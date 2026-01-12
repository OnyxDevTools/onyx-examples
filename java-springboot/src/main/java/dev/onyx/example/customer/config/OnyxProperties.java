package dev.onyx.example.customer.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "onyx")
public class OnyxProperties {

    /**
     * The fully qualified Onyx base URL, e.g. https://api.onyx.dev.
     */
    private String baseUrl;

    /**
     * Database identifier provided by Onyx.
     */
    private String databaseId;

    /**
     * API key issued for the database.
     */
    private String apiKey;

    /**
     * API secret issued for the database.
     */
    private String apiSecret;

    /**
     * Default partition to use when one is not supplied by callers.
     */
    private String partition;

    private Boolean requestLoggingEnabled;

    private Boolean responseLoggingEnabled;

    private Long ttl;

    private Integer requestTimeoutMs;

    private Integer connectTimeoutMs;

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getDatabaseId() {
        return databaseId;
    }

    public void setDatabaseId(String databaseId) {
        this.databaseId = databaseId;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getApiSecret() {
        return apiSecret;
    }

    public void setApiSecret(String apiSecret) {
        this.apiSecret = apiSecret;
    }

    public String getPartition() {
        return partition;
    }

    public void setPartition(String partition) {
        this.partition = partition;
    }

    public Boolean getRequestLoggingEnabled() {
        return requestLoggingEnabled;
    }

    public void setRequestLoggingEnabled(Boolean requestLoggingEnabled) {
        this.requestLoggingEnabled = requestLoggingEnabled;
    }

    public Boolean getResponseLoggingEnabled() {
        return responseLoggingEnabled;
    }

    public void setResponseLoggingEnabled(Boolean responseLoggingEnabled) {
        this.responseLoggingEnabled = responseLoggingEnabled;
    }

    public Long getTtl() {
        return ttl;
    }

    public void setTtl(Long ttl) {
        this.ttl = ttl;
    }

    public Integer getRequestTimeoutMs() {
        return requestTimeoutMs;
    }

    public void setRequestTimeoutMs(Integer requestTimeoutMs) {
        this.requestTimeoutMs = requestTimeoutMs;
    }

    public Integer getConnectTimeoutMs() {
        return connectTimeoutMs;
    }

    public void setConnectTimeoutMs(Integer connectTimeoutMs) {
        this.connectTimeoutMs = connectTimeoutMs;
    }
}
