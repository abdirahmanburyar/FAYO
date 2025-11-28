# FAYO Healthcare - Kotlin Multiplatform App

## Overview
This is the Kotlin Multiplatform (KMP) mobile application for FAYO Healthcare, built with Jetpack Compose for Android.

## Project Structure

```
kmp/
├── shared/              # Shared KMP module (business logic, API clients)
│   ├── commonMain/     # Shared code for all platforms
│   └── androidMain/    # Android-specific implementations
├── android/             # Android app (Jetpack Compose)
└── ios/                 # iOS app (SwiftUI) - Future
```

## Features

### ✅ Implemented Screens
- **Splash Screen** - App initialization and authentication check
- **Login Screen** - Phone number input with OTP request
- **OTP Verification** - 6-digit code verification
- **Home Screen** - Dashboard with quick actions
- **Hospitals Screen** - Browse and search hospitals/clinics
- **Appointments Screen** - View and manage appointments
- **Profile Screen** - User profile and settings

### 🎨 UI/UX Features
- Material Design 3
- Sky Blue color theme
- Smooth animations
- Professional card-based layouts
- Responsive design
- Loading states and error handling

## Technology Stack

### Shared Module
- **Kotlin Multiplatform** - Code sharing across platforms
- **Ktor Client** - HTTP networking
- **Kotlinx Serialization** - JSON parsing
- **Kotlinx Coroutines** - Asynchronous operations
- **Koin** - Dependency injection

### Android App
- **Jetpack Compose** - Modern UI toolkit
- **Material Design 3** - Material You design system
- **Navigation Compose** - Screen navigation
- **ViewModel** - State management
- **StateFlow** - Reactive state handling

## Setup Instructions

### Prerequisites
- Android Studio Hedgehog or later
- Kotlin 1.9.22+
- Gradle 8.0+
- Android SDK 26+ (minSdk)
- Android SDK 34 (targetSdk)

### Configuration

1. **Update API Base URL**
   Edit `android/src/main/java/com/fayo/healthcare/di/AppModule.kt`:
   ```kotlin
   val baseUrl = "http://10.117.68.69:3001/api/v1" // For Android emulator
   // Or use your actual server IP for physical device
   ```

2. **Build and Run**
   ```bash
   cd mobile/kmp
   ./gradlew build
   ./gradlew :android:installDebug
   ```

## Architecture

### Clean Architecture
- **Data Layer**: API clients, repositories, data models
- **Domain Layer**: Use cases, repository interfaces
- **Presentation Layer**: ViewModels, UI screens

### State Management
- **MVI Pattern** with StateFlow
- Unidirectional data flow
- Reactive UI updates

### Dependency Injection
- **Koin** for DI
- ViewModels injected via Koin
- Easy testing and modularity

## API Integration

The app integrates with the following backend services:
- **User Service** (Port 3001) - Authentication, user management
- **Hospital Service** (Port 3002) - Hospital/clinic data
- **Appointment Service** (Port 3005) - Appointment management

## Next Steps

### Planned Features
- [ ] Doctor search and profiles
- [ ] Appointment booking flow
- [ ] Video call integration
- [ ] Push notifications
- [ ] Offline support with SQLDelight
- [ ] iOS app implementation

### Improvements
- [ ] Add unit tests
- [ ] Add UI tests
- [ ] Implement caching
- [ ] Add error recovery
- [ ] Improve loading states

## Development

### Running the App
1. Open project in Android Studio
2. Sync Gradle files
3. Run on emulator or physical device

### Building
```bash
./gradlew :android:assembleDebug
```

### Testing
```bash
./gradlew test
```

## License
Copyright © 2024 FAYO Healthcare. All rights reserved.

