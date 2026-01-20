# Customer API with Spring Boot & Onyx Database

This project is a minimal Spring Boot 3 showcase that integrates the Kotlin-first Onyx Database client to provide a CRUD API for a `Customer` table. It includes DI wiring, validation, Swagger UI, and clear steps to run manually with debug enabled.

## Prerequisites
- JDK 21+ (the Onyx client is built with class file version 65)
- Maven 3.9+ (or use the included `mvnw` if you add it)
- `jq` (used by `scripts/run.sh` to read connection settings)
- macOS users: `brew install openjdk@21 jq`

## Project layout
- `pom.xml` — Spring Boot 3.5.9, Onyx client 3.8.3, Kotlin stdlib/reflect, SpringDoc UI
- `src/main/java/dev/onyx/example/customer` — app code (config, controller, service, models)
- `src/main/resources/application.yml` — Spring config (port, swagger paths)
- `src/main/resources/onyx-database.json` — local Onyx connection settings (ignored by git)

## Configure Onyx connection
Add `src/main/resources/onyx-database.json` (should be ignored by git). You can get it by going to https://cloud.onyx.dev, creating a organization and a database as well then creating a apiKey, and clicking the [download] button:
```json
{
  "baseUrl": "https://api.onyx.dev",
  "databaseId": "<your-db-id>",
  "apiKey": "<your-api-key>",
  "apiSecret": "<your-api-secret>"
}
```

Alternitively, you can set the following envars:
- `ONYX_BASE_URL`
- `ONYX_DATABASE_ID`
- `ONYX_API_KEY`
- `ONYX_API_SECRET`


## Key dependencies (pom.xml)
```xml
<properties>
  <java.version>21</java.version>
  <onyx-client.version>3.8.3</onyx-client.version>
  <kotlin.version>2.2.10</kotlin.version>
</properties>

<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.6.0</version>
  </dependency>
  <dependency>
    <groupId>dev.onyx</groupId>
    <artifactId>onyx-cloud-client</artifactId>
    <version>${onyx-client.version}</version>
  </dependency>
  <dependency>
    <groupId>org.jetbrains.kotlin</groupId>
    <artifactId>kotlin-stdlib</artifactId>
    <version>${kotlin.version}</version>
  </dependency>
  <dependency>
    <groupId>org.jetbrains.kotlin</groupId>
    <artifactId>kotlin-reflect</artifactId>
    <version>${kotlin.version}</version>
  </dependency>
</dependencies>
```

## Onyx client DI wiring
`src/main/java/dev/onyx/example/customer/config/OnyxClientConfig.java`:
```java
@Configuration
public class OnyxClientConfig {

    @Bean(destroyMethod = "close")
    public OnyxClient onyxClient(OnyxProperties properties) {
        OnyxConfig config = new OnyxConfig(
                properties.getBaseUrl(),
                properties.getDatabaseId(),
                properties.getApiKey(),
                properties.getApiSecret(),
                null,
                properties.getPartition(),
                properties.getRequestLoggingEnabled(),
                properties.getResponseLoggingEnabled(),
                properties.getTtl(),
                properties.getRequestTimeoutMs(),
                properties.getConnectTimeoutMs()
        );
        return (OnyxClient) OnyxFacadeImpl.INSTANCE.init(config);
    }
}
```

`src/main/java/dev/onyx/example/customer/config/OnyxProperties.java`:
```java
@ConfigurationProperties(prefix = "onyx")
public class OnyxProperties {
    private String baseUrl;
    private String databaseId;
    private String apiKey;
    private String apiSecret;
    private String partition;
    private Boolean requestLoggingEnabled;
    private Boolean responseLoggingEnabled;
    private Long ttl;
    private Integer requestTimeoutMs;
    private Integer connectTimeoutMs;
    // getters/setters...
}
```

## Domain and service
`src/main/java/dev/onyx/example/customer/model/Customer.java` mirrors the schema (UUID `customerId`, `firstName`, `lastName`, `email`, `age`, `dateCreated`, `isActive`, `balance`, embedded `profilePic`, `countryCode`).

`src/main/java/dev/onyx/example/customer/service/CustomerService.java` (excerpt):
```java
@Service
public class CustomerService {
    private static final KClass<Customer> CUSTOMER_KCLASS = JvmClassMappingKt.getKotlinClass(Customer.class);
    private final OnyxClient db;
    private final OnyxProperties properties;

    public CustomerService(OnyxClient db, OnyxProperties properties) { ... }

    public Customer create(CustomerRequest request) {
        Customer customer = toCustomer(UUID.randomUUID().toString(), Instant.now().toString(), request);
        return save(customer);
    }

    public List<Customer> list(String partition, Integer pageSize) {
        QueryBuilder builder = (QueryBuilder) db.from("Customer");
        builder.setType(CUSTOMER_KCLASS);
        if (StringUtils.hasText(partition)) builder.inPartition(partition);
        if (pageSize != null && pageSize > 0) builder.pageSize(pageSize);
        IQueryResults<?> raw = builder.list();
        @SuppressWarnings("unchecked")
        IQueryResults<Customer> results = (IQueryResults<Customer>) raw;
        return new ArrayList<>(results);
    }

    public Customer update(String customerId, CustomerRequest request, String partition) { ... }
    public boolean delete(String customerId, String partition) { ... }
    // toCustomer, resolvePartition helpers...
}
```

## REST API
`src/main/java/dev/onyx/example/customer/controller/CustomerController.java` exposes:
- `POST /api/customers` — create
- `GET /api/customers/{customerId}?countryCode=...` — get by id
- `GET /api/customers?countryCode=...&pageSize=...` — list
- `PUT /api/customers/{customerId}?countryCode=...` — update
- `DELETE /api/customers/{customerId}?countryCode=...` — delete

Validation DTOs live in `dto/CustomerRequest.java` and `dto/ProfilePicRequest.java`.

## Swagger UI
SpringDoc is configured in `src/main/resources/application.yml`:
```yaml
server:
  port: 8080
springdoc:
  swagger-ui:
    path: /swagger-ui.html
  api-docs:
    path: /api-docs
```

Browse:
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- API docs: `http://localhost:8080/api-docs`

## Run the app (manual steps)
1) **Use Java 21+**  
   - macOS/Homebrew: `brew install openjdk@21` and set `export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"` and `export PATH="${JAVA_HOME}/bin:${PATH}"`.
   - Verify: `java -version` shows 21+.

2) **Export Onyx credentials**  
   ```bash
   export ONYX_BASE_URL=https://api.onyx.dev
   export ONYX_DATABASE_ID=<your-db-id>
   export ONYX_API_KEY=<your-api-key>
   export ONYX_API_SECRET=<your-api-secret>
   export ONYX_DEFAULT_PARTITION=<partition-code>
   ```

3) **Build**  
   ```bash
   mvn -B clean package -DskipTests
   ```

4) **Run with debug enabled (port 5005) and Java module opens for Gson**  
   ```bash
   mvn spring-boot:run \
     -Dspring-boot.run.jvmArguments='-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005 --add-opens=java.base/java.time=ALL-UNNAMED --add-opens=java.base/java.lang=ALL-UNNAMED'
   ```

The app starts on `http://localhost:8080`.

Optional quick CRUD check (app must be running):
```bash
./scripts/test.sh
```

## Sample usage
Create a customer:
```bash
curl -X POST http://localhost:8080/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ada",
    "lastName": "Lovelace",
    "email": "ada@example.com",
    "age": 36,
    "isActive": true,
    "balance": 123.45,
    "countryCode": "UK"
  }'
```

Get by id:
```bash
curl "http://localhost:8080/api/customers/<customerId>?countryCode=UK"
```

List:
```bash
curl "http://localhost:8080/api/customers?countryCode=UK&pageSize=20"
```

Delete:
```bash
curl -X DELETE "http://localhost:8080/api/customers/<customerId>?countryCode=UK"
```

## Notes
- Keep `src/main/resources/onyx-database.json` out of source control (already in `.gitignore`).
- Ensure your Onyx credentials and partition match your target database.
- The app defaults to port 8080; adjust `server.port` in `application.yml` if desired.
