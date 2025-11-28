plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.serialization)
}

// Configure Android BEFORE Kotlin to prevent early configuration resolution
android {
    namespace = "com.fayo.healthcare.shared"
    compileSdk = 34
    defaultConfig {
        minSdk = 26
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    androidTarget {
        compilations.all {
            kotlinOptions {
                jvmTarget = "17"
                // Suppress expect/actual classes beta warning
                freeCompilerArgs += listOf("-Xexpect-actual-classes")
            }
        }
    }
    
    // iOS targets for future use
    // iosX64()
    // iosArm64()
    // iosSimulatorArm64()

    sourceSets {
        val commonMain by getting {
            dependencies {
                // Coroutines
                implementation(libs.kotlinx.coroutines.core)
                
                // Serialization
                implementation(libs.kotlinx.serialization.json)
                
                // Ktor - common dependencies
                implementation(libs.ktor.client.core)
                implementation(libs.ktor.client.content.negotiation)
                implementation(libs.ktor.serialization.kotlinx.json)
                implementation(libs.ktor.client.logging)
                implementation(libs.ktor.client.websockets)
                
                // Koin core
                implementation(libs.koin.core)
            }
        }

        val androidMain by getting {
            dependsOn(commonMain)
            dependencies {
                // Android-specific Ktor engine - use OkHttp for WebSocket support
                implementation(libs.ktor.client.okhttp)
                // Socket.IO client for Android (to connect to Socket.IO server)
                implementation("io.socket:socket.io-client:2.1.1")
            }
        }
    }
}
