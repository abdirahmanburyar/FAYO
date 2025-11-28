# FAYO Mobile Apps - Naming Convention

## App Names

### Android App
- **App Name**: `FAYO Healthcare`
- **Package Name**: `com.fayo.healthcare`
- **Application ID**: `com.fayo.healthcare`
- **Display Name**: "FAYO Healthcare"

### iOS App
- **App Name**: `FAYO Healthcare`
- **Bundle Identifier**: `com.fayo.healthcare`
- **Display Name**: "FAYO Healthcare"

## Project Structure Names

### Kotlin Multiplatform Project
- **Project Name**: `kmp`
- **Shared Module**: `shared`
- **Android App Module**: `android`
- **iOS App Module**: `ios` (future)

## Directory Structure
```
mobile/
└── kmp/
    ├── shared/              # Shared KMP module
    ├── android/             # Android app (Jetpack Compose)
    └── ios/                 # iOS app (SwiftUI) - future
```

## Versioning
- **Version Code**: 1
- **Version Name**: "1.0.0"
- **Build Number**: Incremental per platform

