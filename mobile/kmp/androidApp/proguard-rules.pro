# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.kts.

# Keep data models for serialization
-keep class com.fayo.healthcare.data.models.** { *; }

# Keep Ktor serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt

# Keep Koin
-keep class org.koin.** { *; }

# Keep Agora RTC SDK (prevent obfuscation)
-keep class io.agora.** { *; }
-dontwarn io.agora.**

