# Kotlin Multiplatform (KMP) + Jetpack Compose Architecture Discussion

## 🎯 Overview

This document outlines the proposed architecture for migrating from Flutter to **Kotlin Multiplatform (KMP)** with **Jetpack Compose** for the FAYO Healthcare mobile application.

## 📋 Current State

- **Existing**: Flutter app in `mobile/flutter_app/`
- **Backend**: NestJS monolithic API service (unified service on port 3001)
- **API**: RESTful APIs with JWT authentication
- **Features**: OTP authentication, hospital search, appointments, video calls

## 🏗️ Proposed Architecture

### Directory Structure

```
mobile/
├── flutter_app/                    # (Legacy - to be phased out)
│
└── kmp_app/                        # New Kotlin Multiplatform App
    ├── shared/                     # Shared Business Logic (KMP)
    │   ├── commonMain/
    │   │   ├── kotlin/
    │   │   │   ├── data/
    │   │   │   │   ├── api/        # API clients (Ktor)
    │   │   │   │   ├── local/      # Local storage (SQLDelight)
    │   │   │   │   └── models/     # Data models
    │   │   │   ├── domain/
    │   │   │   │   ├── usecases/   # Business logic
    │   │   │   │   └── repositories/ # Repository interfaces
    │   │   │   └── utils/          # Shared utilities
    │   │   └── resources/          # Shared resources
    │   ├── androidMain/            # Android-specific implementations
    │   │   └── kotlin/
    │   │       └── platform/       # Android platform code
    │   └── iosMain/                # iOS-specific implementations (future)
    │       └── kotlin/
    │           └── platform/      # iOS platform code
    │
    ├── androidApp/                 # Android App (Jetpack Compose)
    │   ├── src/
    │   │   └── main/
    │   │       ├── java/
    │   │       │   └── com/fayo/
    │   │       │       └── MainActivity.kt
    │   │       ├── res/            # Android resources
    │   │       └── AndroidManifest.xml
    │   ├── build.gradle.kts
    │   └── proguard-rules.pro
    │
    └── build.gradle.kts           # Root build file
```

## 🔑 Key Decisions to Discuss

### 1. **Shared vs Platform-Specific Code**

**Question**: How much should be shared?

**Option A: Maximum Sharing (Recommended)**
- ✅ All business logic in `shared/commonMain`
- ✅ Data layer (API clients, repositories) in shared
- ✅ Domain models and use cases in shared
- ✅ Platform-specific: Only UI (Compose) and platform APIs

**Option B: Moderate Sharing**
- Business logic shared
- Platform-specific API implementations
- More platform-specific code

**Recommendation**: **Option A** - Maximum sharing for faster development and consistency.

### 2. **State Management**

**Options**:
- **MVI (Model-View-Intent)** with Kotlin Coroutines Flow
- **MVVM** with ViewModel + StateFlow
- **Compose State** with remember/State

**Recommendation**: **MVI with Flow** - Clean separation, testable, reactive.

### 3. **Dependency Injection**

**Options**:
- **Koin** (Lightweight, Kotlin-first)
- **Kodein** (Simple)
- **Manual DI** (Simple projects)

**Recommendation**: **Koin** - Easy to use, works well with KMP.

### 4. **Networking**

**Options**:
- **Ktor Client** (Recommended for KMP)
- **OkHttp** (Android-only)
- **Retrofit** (Android-only)

**Recommendation**: **Ktor Client** - Native KMP support, multiplatform.

### 5. **Local Storage**

**Options**:
- **SQLDelight** (SQL database, multiplatform)
- **DataStore** (Android-only, but simple)
- **SharedPreferences** (Android-only, legacy)

**Recommendation**: **SQLDelight** - Multiplatform, type-safe, performant.

### 6. **Image Loading**

**Options**:
- **Coil** (Android, Compose-friendly)
- **Glide** (Android, mature)
- **KMP Image Loader** (Multiplatform, experimental)

**Recommendation**: **Coil** - Modern, Compose-first, easy to use.

## 📦 Technology Stack

### Shared Module (KMP)
```kotlin
// Dependencies
- kotlinx-coroutines-core
- kotlinx-serialization-json
- ktor-client-core
- ktor-client-content-negotiation
- ktor-client-logging
- sql-delight-runtime
- koin-core
```

### Android App
```kotlin
// Dependencies
- androidx.compose.ui
- androidx.compose.material3
- androidx.compose.runtime
- androidx.lifecycle-viewmodel-compose
- androidx.navigation-compose
- coil-compose
- koin-android
- koin-androidx-compose
```

## 🔄 Migration Strategy

### Phase 1: Setup & Foundation (Week 1-2)
1. ✅ Create KMP project structure
2. ✅ Setup Gradle with KMP plugin
3. ✅ Configure shared module
4. ✅ Setup Koin for DI
5. ✅ Setup Ktor client for API calls

### Phase 2: Core Features (Week 3-4)
1. ✅ Authentication (OTP login)
2. ✅ User profile management
3. ✅ API integration with backend services
4. ✅ Local storage setup

### Phase 3: UI Implementation (Week 5-6)
1. ✅ Splash screen
2. ✅ Login/OTP screens
3. ✅ Home screen
4. ✅ Hospital search
5. ✅ Appointment booking

### Phase 4: Advanced Features (Week 7-8)
1. ✅ Video call integration
2. ✅ Real-time updates (WebSocket)
3. ✅ Push notifications
4. ✅ Offline support

## 🎨 UI Architecture (Jetpack Compose)

### Screen Structure
```kotlin
// Example: Login Screen
@Composable
fun LoginScreen(
    viewModel: LoginViewModel = koinViewModel(),
    onNavigateToOtp: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    
    when (uiState) {
        is LoginUiState.Loading -> LoadingIndicator()
        is LoginUiState.Success -> {
            // Navigate to OTP
            LaunchedEffect(uiState.phoneNumber) {
                onNavigateToOtp(uiState.phoneNumber)
            }
        }
        is LoginUiState.Error -> ErrorMessage(uiState.message)
        is LoginUiState.Idle -> LoginForm(
            onPhoneSubmit = viewModel::sendOtp
        )
    }
}
```

### State Management Pattern
```kotlin
// ViewModel
class LoginViewModel(
    private val sendOtpUseCase: SendOtpUseCase
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()
    
    fun sendOtp(phoneNumber: String) {
        viewModelScope.launch {
            _uiState.value = LoginUiState.Loading
            sendOtpUseCase(phoneNumber)
                .onSuccess { _uiState.value = LoginUiState.Success(phoneNumber) }
                .onFailure { _uiState.value = LoginUiState.Error(it.message) }
        }
    }
}
```

## 🔌 API Integration

### Shared API Client
```kotlin
// shared/commonMain/kotlin/data/api/ApiClient.kt
class ApiClient(
    private val baseUrl: String,
    private val tokenStorage: TokenStorage
) {
    private val client = HttpClient {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
            })
        }
        install(Logging) {
            level = LogLevel.INFO
        }
        install(HttpRequestRetry) {
            retryOnServerErrors(maxRetries = 3)
        }
        defaultRequest {
            header("Content-Type", "application/json")
            tokenStorage.getToken()?.let {
                header("Authorization", "Bearer $it")
            }
        }
    }
    
    suspend fun sendOtp(phoneNumber: String): Result<OtpResponse> {
        return try {
            val response = client.post("$baseUrl/auth/send-otp") {
                setBody(OtpRequest(phoneNumber))
            }
            Result.success(response.body())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

## 📱 Platform-Specific Considerations

### Android
- ✅ Jetpack Compose for UI
- ✅ Material Design 3
- ✅ Navigation Component (Compose)
- ✅ ViewModel for state management
- ✅ Room (if needed for complex queries) or SQLDelight

### iOS (Future)
- SwiftUI for UI
- Combine for reactive streams
- Same shared business logic

## 🚀 Getting Started

### Prerequisites
- ✅ Android SDK (Already set up)
- Android Studio Hedgehog or later
- Kotlin 1.9.20+
- Gradle 8.0+

### Next Steps
1. **Create KMP project structure**
2. **Setup Gradle configuration**
3. **Implement shared API client**
4. **Create first screen (Login)**
5. **Integrate with existing backend**

## ❓ Questions for Discussion

1. **iOS Support**: Do we need iOS support now or later?
   - If later: Focus on Android first, add iOS module later
   - If now: Setup iOS module from start

2. **Video Calls**: How to handle video calls?
   - Use native Android SDK (Zoom, etc.)
   - Or shared WebRTC implementation?

3. **Real-time Updates**: WebSocket implementation?
   - Shared Ktor WebSocket client?
   - Or platform-specific?

4. **Offline Support**: How much offline functionality?
   - Cache appointments?
   - Queue actions when offline?

5. **Testing Strategy**: 
   - Unit tests for shared logic?
   - UI tests for Compose screens?

## 📝 Recommendations

Based on the current Flutter app structure, I recommend:

1. **Start with Android-only** (add iOS later)
2. **Maximum code sharing** in shared module
3. **MVI pattern** for state management
4. **Ktor + SQLDelight** for networking and storage
5. **Koin** for dependency injection
6. **Material Design 3** for UI consistency

---

**Ready to proceed?** Let me know your preferences on the questions above, and I'll start setting up the KMP project structure!

