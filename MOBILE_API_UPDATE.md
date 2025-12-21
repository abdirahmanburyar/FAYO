# Mobile App API Update - Unified API Service

## Summary

Updated both Flutter and KMP mobile applications to use the unified API service on port 3001 instead of multiple microservices.

## Changes Made

### Flutter App (`mobile/fayo/`)

1. **`lib/core/constants/api_constants.dart`**:
   - ✅ Added unified `apiBaseUrl` pointing to port 3001
   - ✅ Updated all service URLs to use `apiBaseUrl`
   - ✅ Updated WebSocket URLs to use unified service
   - ✅ Fixed doctor endpoints (removed duplicate `/api/v1`)

2. **`lib/presentation/screens/home/home_screen.dart`**:
   - ✅ Updated ad image URL to use unified API service (port 3001)

3. **`README.md`**:
   - ✅ Updated documentation to reflect unified API service

### KMP App (`mobile/kmp/`)

1. **`androidApp/src/main/java/com/fayo/healthcare/di/AppModule.kt`**:
   - ✅ Added unified `apiBaseUrl` pointing to port 3001
   - ✅ Updated all service URLs to use `apiBaseUrl`

2. **`shared/src/commonMain/kotlin/com/fayo/healthcare/data/api/ApiClient.kt`**:
   - ✅ Updated WebSocket URL comment for ads

3. **`androidApp/src/main/java/com/fayo/healthcare/ui/screens/home/HomeScreen.kt`**:
   - ✅ Updated hardcoded ad image URL to port 3001

4. **Documentation**:
   - ✅ Updated `README.md`
   - ✅ Updated `CALL_ACCEPTANCE_FLOW.md`
   - ✅ Updated `HTTPS_SETUP.md`
   - ✅ Updated `KMP_ARCHITECTURE_DISCUSSION.md`

## API Endpoints (All on Port 3001)

### Base URL
```
http://72.62.51.50:3001/api/v1
```

### Service Endpoints
- **Users**: `/api/v1/users`, `/api/v1/auth`, `/api/v1/otp`
- **Hospitals**: `/api/v1/hospitals`
- **Doctors**: `/api/v1/doctors`
- **Appointments**: `/api/v1/appointments`
- **Payments**: `/api/v1/payments`, `/api/v1/waafipay`
- **Ads**: `/api/v1/ads`

### WebSocket Endpoints
- **Appointments**: `ws://72.62.51.50:3001/api/v1/ws/appointments`
- **Ads**: `ws://72.62.51.50:3001/ws/ads`
- **Hospitals**: `ws://72.62.51.50:3001/ws/hospitals`

### Image URLs
- **Ads Images**: `http://72.62.51.50:3001/uploads/ads/{filename}`
- **Doctor Images**: `http://72.62.51.50:3001/uploads/doctors/{filename}`
- **Hospital Images**: `http://72.62.51.50:3001/uploads/hospitals/{filename}`
- **User Images**: `http://72.62.51.50:3001/uploads/users/{filename}`

## Testing

After updating, test the mobile apps:

1. **Flutter App**:
   ```bash
   cd mobile/fayo
   flutter run
   ```

2. **KMP App**:
   ```bash
   cd mobile/kmp
   ./gradlew :androidApp:installDebug
   ```

## Verification Checklist

- [x] All API endpoints point to port 3001
- [x] WebSocket URLs updated
- [x] Image URLs updated
- [x] Documentation updated
- [ ] Test authentication flow
- [ ] Test hospital/doctor listings
- [ ] Test appointment creation
- [ ] Test payment flow
- [ ] Test ads display
- [ ] Test WebSocket connections

## Migration Notes

- **Before**: Multiple services on ports 3001-3007
- **After**: Single unified API service on port 3001
- **Breaking Changes**: None (same endpoints, just different port)
- **WebSocket Changes**: URLs updated but endpoints remain the same

