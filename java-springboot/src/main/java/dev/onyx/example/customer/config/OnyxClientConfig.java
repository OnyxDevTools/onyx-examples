package dev.onyx.example.customer.config;

import com.onyx.cloud.api.IOnyxDatabase;
import com.onyx.cloud.api.OnyxConfig;
import com.onyx.cloud.impl.OnyxClient;
import com.onyx.cloud.impl.OnyxFacadeImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.util.Assert;

@Configuration
public class OnyxClientConfig {

    @Bean(destroyMethod = "close")
    public OnyxClient onyxClient(OnyxProperties properties) {
        Assert.hasText(properties.getBaseUrl(), "onyx.base-url must be provided");
        Assert.hasText(properties.getDatabaseId(), "onyx.database-id must be provided");
        Assert.hasText(properties.getApiKey(), "onyx.api-key must be provided");
        Assert.hasText(properties.getApiSecret(), "onyx.api-secret must be provided");

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

    @Bean
    @Primary
    public IOnyxDatabase<Object> onyxDatabase(OnyxClient onyxClient) {
        return onyxClient;
    }
}
