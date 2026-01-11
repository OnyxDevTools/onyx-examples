package com.example

import com.onyx.cloud.api.IOnyxDatabase
import com.onyx.cloud.api.OnyxConfig
import com.onyx.cloud.api.onyx
import java.util.concurrent.atomic.AtomicReference

data class OnyxEnvConfig(
    val baseUrl: String,
    val databaseId: String,
    val apiKey: String,
    val apiSecret: String,
) {
    companion object {
        fun fromEnv(): OnyxEnvConfig? {
            val dbId = System.getenv("ONYX_DATABASE_ID") ?: return null
            val apiKey = System.getenv("ONYX_API_KEY") ?: return null
            val apiSecret = System.getenv("ONYX_API_SECRET") ?: return null
            val baseUrl = System.getenv("ONYX_BASE_URL") ?: "https://api.onyx.dev"
            return OnyxEnvConfig(
                baseUrl = baseUrl,
                databaseId = dbId,
                apiKey = apiKey,
                apiSecret = apiSecret,
            )
        }
    }
}

/**
 * Lazily creates and caches an Onyx client based on environment variables.
 *
 * If configuration changes at runtime, the cache will be refreshed on next access.
 */
class OnyxClientManager(
    private val configProvider: () -> OnyxEnvConfig? = { OnyxEnvConfig.fromEnv() }
) {
    private val cachedConfig = AtomicReference<OnyxEnvConfig?>()
    private val cachedDb = AtomicReference<IOnyxDatabase<Any>?>(null)

    fun currentConfig(): OnyxEnvConfig? = configProvider()

    @Synchronized
    fun database(): IOnyxDatabase<Any> {
        val config = configProvider() ?: error("Onyx is not configured. Set ONYX_DATABASE_ID, ONYX_API_KEY, and ONYX_API_SECRET.")
        val existingConfig = cachedConfig.get()
        val existingDb = cachedDb.get()
        if (existingDb != null && existingConfig == config) return existingDb

        cachedDb.getAndSet(null)?.close()
        val db = onyx.init<Any>(
            OnyxConfig(
                baseUrl = config.baseUrl,
                databaseId = config.databaseId,
                apiKey = config.apiKey,
                apiSecret = config.apiSecret,
            )
        )
        cachedConfig.set(config)
        cachedDb.set(db)
        return db
    }

    fun close() {
        cachedDb.getAndSet(null)?.close()
        cachedConfig.set(null)
    }
}
