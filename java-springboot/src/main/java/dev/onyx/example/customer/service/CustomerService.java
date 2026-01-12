package dev.onyx.example.customer.service;

import com.onyx.cloud.api.DeleteOptions;
import com.onyx.cloud.api.FindOptions;
import com.onyx.cloud.api.IQueryResults;
import com.onyx.cloud.api.SaveOptions;
import com.onyx.cloud.impl.QueryBuilder;
import com.onyx.cloud.impl.OnyxClient;
import dev.onyx.example.customer.config.OnyxProperties;
import dev.onyx.example.customer.dto.CustomerRequest;
import dev.onyx.example.customer.dto.ProfilePicRequest;
import dev.onyx.example.customer.model.Customer;
import dev.onyx.example.customer.model.ProfilePic;
import kotlin.jvm.JvmClassMappingKt;
import kotlin.reflect.KClass;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CustomerService {

    private static final KClass<Customer> CUSTOMER_KCLASS = JvmClassMappingKt.getKotlinClass(Customer.class);

    private final OnyxClient db;
    private final OnyxProperties properties;

    public CustomerService(OnyxClient db, OnyxProperties properties) {
        this.db = db;
        this.properties = properties;
    }

    public Customer create(CustomerRequest request) {
        Customer customer = toCustomer(UUID.randomUUID().toString(), Instant.now().toString(), request);
        return save(customer);
    }

    public Optional<Customer> get(String customerId, String partition) {
        return get(customerId, partition, null);
    }

    public Optional<Customer> get(String customerId, String partition, String fallbackPartition) {
        String targetPartition = resolvePartition(partition, fallbackPartition);
        // Passing null avoids emitting an empty resolver list which the API rejects.
        FindOptions options = new FindOptions(targetPartition, null);
        Customer found = db.findById(CUSTOMER_KCLASS, customerId, options);
        return Optional.ofNullable(found);
    }

    public List<Customer> list(String partition, Integer pageSize) {
        String targetPartition = resolvePartition(partition, null);
        QueryBuilder builder = (QueryBuilder) db.from("Customer");
        builder.setType(CUSTOMER_KCLASS);

        if (StringUtils.hasText(targetPartition)) {
            builder.inPartition(targetPartition);
        }
        if (pageSize != null && pageSize > 0) {
            builder.pageSize(pageSize);
        }

        IQueryResults<?> rawResults = builder.list();
        @SuppressWarnings("unchecked")
        IQueryResults<Customer> results = (IQueryResults<Customer>) rawResults;
        return new ArrayList<>(results);
    }

    public Customer update(String customerId, CustomerRequest request, String partition) {
        String targetPartition = resolvePartition(partition, request.getCountryCode());
        Optional<Customer> current = get(customerId, targetPartition, request.getCountryCode());
        String createdAt = current.map(Customer::getDateCreated).orElseGet(() -> Instant.now().toString());
        Customer customer = toCustomer(customerId, createdAt, request);
        return save(customer);
    }

    public boolean delete(String customerId, String partition) {
        String targetPartition = resolvePartition(partition, null);
        // Passing null relationships avoids emitting an empty array the API may reject.
        DeleteOptions options = new DeleteOptions(targetPartition, null);
        // Some environments return false even when the delete succeeds; treat any non-exception as success.
        try {
            db.delete("Customer", customerId, options);
            return true;
        } catch (RuntimeException ex) {
            return false;
        }
    }

    private Customer save(Customer customer) {
        SaveOptions options = new SaveOptions(Collections.emptyList());
        db.save(CUSTOMER_KCLASS, customer, options);
        return customer;
    }

    private Customer toCustomer(String customerId, String createdAt, CustomerRequest request) {
        ProfilePic profilePic = toProfilePic(request.getProfilePic());
        Customer customer = new Customer(
                customerId,
                request.getFirstName(),
                request.getLastName(),
                request.getEmail(),
                request.getAge(),
                createdAt,
                request.getIsActive(),
                request.getBalance(),
                profilePic,
                request.getCountryCode()
        );
        return customer;
    }

    private ProfilePic toProfilePic(ProfilePicRequest request) {
        if (request == null) {
            return null;
        }
        return new ProfilePic(request.getUrl(), request.getContentType(), request.getSizeBytes());
    }

    private String resolvePartition(String provided, String fallback) {
        if (StringUtils.hasText(provided)) {
            return provided;
        }
        if (StringUtils.hasText(fallback)) {
            return fallback;
        }
        return properties.getPartition();
    }
}
