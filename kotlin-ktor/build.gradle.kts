import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

val ktorVersion = "2.3.12"
val onyxVersion = "3.6.11"
val onyxGithubUser: String? = System.getenv("ONYX_GITHUB_USERNAME") ?: System.getenv("GITHUB_ACTOR")
val onyxGithubToken: String? = System.getenv("ONYX_GITHUB_TOKEN") ?: System.getenv("GITHUB_TOKEN")

plugins {
    kotlin("jvm") version "2.2.10"
    kotlin("plugin.serialization") version "2.2.10"
    application
}

group = "com.example"
version = "0.0.1"

repositories {
    mavenCentral()
    maven {
        url = uri("https://maven.pkg.github.com/OnyxDevTools/onyx-database-parent")
        credentials {
            username = onyxGithubUser ?: ""
            password = onyxGithubToken ?: ""
        }
        if (onyxGithubUser.isNullOrBlank() || onyxGithubToken.isNullOrBlank()) {
            println("WARNING: ONYX_GITHUB_USERNAME/ONYX_GITHUB_TOKEN not set; Onyx artifacts will fail to resolve.")
        }
    }
}

dependencies {
    implementation("io.ktor:ktor-server-core-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-netty-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-content-negotiation-jvm:$ktorVersion")
    implementation("io.ktor:ktor-serialization-kotlinx-json-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-call-logging-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-cors-jvm:$ktorVersion")
    implementation("ch.qos.logback:logback-classic:1.4.14")
    implementation("dev.onyx:onyx-cloud-client:$onyxVersion")

    testImplementation(kotlin("test"))
    testImplementation(kotlin("test-junit5"))
    testImplementation("io.ktor:ktor-server-tests-jvm:$ktorVersion")
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:5.11.3")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher:1.11.3")
}

application {
    mainClass.set("com.example.ApplicationKt")
    applicationDefaultJvmArgs = listOf("-Dio.ktor.development=true")
}

kotlin {
    jvmToolchain(21)
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}

tasks.withType<KotlinCompile>().configureEach {
    compilerOptions.jvmTarget.set(JvmTarget.JVM_21)
}
