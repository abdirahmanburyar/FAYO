pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        // Zoom Video SDK repositories
        maven {
            url = uri("https://jitpack.io")
        }
        // Add Zoom's Maven repository if they have one
        // Check https://marketplace.zoom.us/docs/sdk/video/android for the correct repository URL
    }
}

rootProject.name = "FAYO Healthcare"
include(":shared")
include(":androidApp")
// include(":iosApp") // TODO: Enable when iOS setup is complete

