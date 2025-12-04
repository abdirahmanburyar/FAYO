# Waafipay Mobile Integration Guide

## Overview

The mobile app now supports Waafipay payment integration with QR code scanning. Users can pay for appointments by scanning a QR code that contains either a 6-digit account number or a phone number.

## Features

1. **QR Code Scanning**: Scan QR codes containing account numbers or phone numbers
2. **Payment Initiation**: Initiate payments via Waafipay API
3. **Payment Status Tracking**: Real-time payment status updates via polling
4. **Payment Screen**: Dedicated screen for payment flow

## Implementation Details

### 1. Payment Models

Location: `shared/src/commonMain/kotlin/com/fayo/healthcare/data/models/PaymentModels.kt`

- `QrCodeResponse`: Response from QR code generation endpoint
- `InitiatePaymentRequest`: Request to initiate payment
- `InitiatePaymentResponse`: Response from payment initiation
- `PaymentStatusResponse`: Payment status information

### 2. API Client Methods

Location: `shared/src/commonMain/kotlin/com/fayo/healthcare/data/api/ApiClient.kt`

Added methods:
- `getPaymentQrCode(appointmentId: String)`: Get QR code for an appointment
- `initiatePayment(request: InitiatePaymentRequest)`: Initiate payment
- `getPaymentStatus(paymentId: String)`: Check payment status

### 3. Payment Screens

#### QR Code Scanner Screen
Location: `androidApp/src/main/java/com/fayo/healthcare/ui/screens/payment/QrCodeScannerScreen.kt`

- Uses ML Kit Barcode Scanning for QR code detection
- Uses CameraX for camera preview
- Validates QR code format (6 digits or phone number)
- Requires camera permission

#### Payment Screen
Location: `androidApp/src/main/java/com/fayo/healthcare/ui/screens/payment/PaymentScreen.kt`

- Shows payment summary
- QR code scanning integration
- Payment status tracking
- Polls payment status every 5 seconds
- Handles payment success/failure states

### 4. Navigation

Location: `androidApp/src/main/java/com/fayo/healthcare/ui/navigation/NavGraph.kt`

- Added `Payment` screen route
- Navigation from appointments screen to payment screen
- Passes appointment data via JSON encoding

### 5. Appointment Card Integration

Location: `androidApp/src/main/java/com/fayo/healthcare/ui/screens/appointments/AppointmentsScreen.kt`

- Added "Pay Now" button for pending payments
- Navigates to payment screen on click
- Shows payment status badge

## Dependencies

### Android App (`androidApp/build.gradle.kts`)

```kotlin
// ML Kit Barcode Scanning
implementation("com.google.mlkit:barcode-scanning:17.2.0")

// CameraX
implementation("androidx.camera:camera-camera2:1.3.1")
implementation("androidx.camera:camera-lifecycle:1.3.1")
implementation("androidx.camera:camera-view:1.3.1")
```

### Permissions

Already configured in `AndroidManifest.xml`:
- `android.permission.CAMERA`

## Payment Flow

1. **User views appointments**: Appointments with `paymentStatus = "PENDING"` show a "Pay Now" button
2. **User taps "Pay Now"**: Navigates to payment screen
3. **User scans QR code**: Opens QR scanner, scans code containing account number or phone number
4. **Payment initiated**: App sends payment request to backend
5. **Status polling**: App polls payment status every 5 seconds
6. **Payment completion**: On success, navigates back to appointments screen

## QR Code Format

The QR code can contain either:
- **6-digit account number**: `123456`
- **Phone number**: `+252907700949` (format: +252 followed by 9 digits)

## API Endpoints

### Get QR Code
```
GET /api/v1/waafipay/appointment/{appointmentId}/qr
```

### Initiate Payment
```
POST /api/v1/waafipay/initiate
Body: {
  "appointmentId": "string",
  "amount": 10000, // in cents
  "currency": "USD",
  "accountNumber": "123456", // or phoneNumber
  "phoneNumber": "+252907700949"
}
```

### Get Payment Status
```
GET /api/v1/waafipay/status/{paymentId}
```

## Testing

1. **Create an appointment** with pending payment status
2. **Navigate to appointments screen**
3. **Tap "Pay Now"** on a pending appointment
4. **Scan QR code** (use a test QR code generator)
5. **Verify payment initiation** in logs
6. **Check payment status** updates

## Future Enhancements

- [ ] WebSocket integration for real-time payment updates (instead of polling)
- [ ] Payment history screen
- [ ] Receipt generation
- [ ] Multiple payment methods support
- [ ] Offline payment queue

## Troubleshooting

### Camera Permission Not Granted
- Check `AndroidManifest.xml` has camera permission
- Verify runtime permission request is working

### QR Code Not Scanning
- Ensure good lighting
- Check QR code format (6 digits or phone number)
- Verify ML Kit is properly initialized

### Payment Not Initiating
- Check API endpoint URL in `AppModule.kt`
- Verify authentication token is valid
- Check network connectivity
- Review backend logs for errors

### Payment Status Not Updating
- Verify polling is running (check logs)
- Check payment service is running
- Verify transaction ID is correct

