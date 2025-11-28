# How to View Console Logs from Mobile App

## Method 1: Android Studio Logcat (Recommended)

### Steps:
1. **Open Android Studio**
2. **Connect your device** or start an emulator
3. **Open Logcat**:
   - Click on the **Logcat** tab at the bottom of Android Studio
   - Or go to: `View` → `Tool Windows` → `Logcat`
   - Or press: `Alt + 6` (Windows/Linux) or `Cmd + 6` (Mac)

4. **Filter logs**:
   - Use the search box to filter by tag (e.g., `BookAppointment`, `CallWebSocket`, `API`)
   - Or filter by package: `com.fayo.healthcare`
   - Or filter by log level: `Debug`, `Info`, `Warning`, `Error`

### Example Filters:
- `tag:BookAppointment` - See appointment booking logs
- `tag:CallWebSocket` - See WebSocket connection logs
- `tag:API` - See API request/response logs
- `package:com.fayo.healthcare` - See all app logs

## Method 2: ADB Logcat (Command Line)

### Basic Commands:

```bash
# View all logs
adb logcat

# Filter by package name
adb logcat | grep "com.fayo.healthcare"

# Filter by tag
adb logcat | grep "BookAppointment"
adb logcat | grep "CallWebSocket"
adb logcat | grep "API"

# Filter by log level (only errors)
adb logcat *:E

# Filter by multiple tags
adb logcat | grep -E "BookAppointment|CallWebSocket|API"

# Clear log buffer and show new logs
adb logcat -c && adb logcat

# Save logs to file
adb logcat > app_logs.txt

# View logs with timestamps
adb logcat -v time

# View logs with process ID and thread ID
adb logcat -v threadtime
```

### Useful ADB Logcat Filters:

```bash
# Only show logs from your app
adb logcat | grep "com.fayo.healthcare"

# Show errors and warnings only
adb logcat *:E *:W

# Show specific tags
adb logcat BookAppointment:D CallWebSocket:D API:D *:S

# Clear and show only new logs
adb logcat -c && adb logcat | grep "com.fayo.healthcare"
```

## Method 3: Using Log.d(), Log.e(), etc. in Code

The app already uses `println()` statements which appear in Logcat. You can also use Android's `Log` class for better filtering:

```kotlin
import android.util.Log

// Debug logs (shown in Logcat)
Log.d("TAG", "Debug message")

// Info logs
Log.i("TAG", "Info message")

// Warning logs
Log.w("TAG", "Warning message")

// Error logs
Log.e("TAG", "Error message", exception)

// Verbose logs
Log.v("TAG", "Verbose message")
```

### Current Log Tags Used in the App:

- `BookAppointment` - Appointment booking
- `CallWebSocket` - WebSocket connections
- `API` - API requests/responses
- `HomeViewModel` - Home screen view model
- `ZoomVideoService` - Zoom SDK operations
- `CallScreen` - Call screen operations

## Method 4: Filter Logs by Log Level

In Android Studio Logcat, you can filter by log level:

1. Click the dropdown next to the search box
2. Select log level:
   - **Verbose** (V) - All logs
   - **Debug** (D) - Debug and above
   - **Info** (I) - Info and above
   - **Warning** (W) - Warnings and errors
   - **Error** (E) - Errors only

## Method 5: View Logs in Real-Time While Testing

### In Android Studio:
1. Run the app in debug mode
2. Open Logcat
3. Logs will appear in real-time as the app runs

### Using ADB:
```bash
# Watch logs in real-time
adb logcat | grep "com.fayo.healthcare"

# Or watch specific tags
adb logcat BookAppointment:D CallWebSocket:D API:D *:S
```

## Method 6: Save and Share Logs

### Save to File:
```bash
# Save all logs
adb logcat > logs.txt

# Save filtered logs
adb logcat | grep "com.fayo.healthcare" > app_logs.txt

# Save with timestamps
adb logcat -v time > logs_with_time.txt
```

### In Android Studio:
1. Right-click in Logcat
2. Select **Export Logcat to File**
3. Choose location and save

## Common Log Patterns to Look For

### Appointment Booking:
```
📡 [API] POST http://.../appointments
📥 [API] Response status: 200
✅ [API] Created appointment: ...
```

### WebSocket Connection:
```
📞 [CallWebSocket] Connecting to: ws://...
✅ [CallWebSocket] Connected successfully
📥 [CallWebSocket] Received: ...
```

### Call Acceptance:
```
📞 [API] POST .../calls/.../accept
✅ [API] Call accepted event sent successfully
```

### Zoom SDK:
```
📞 [ZOOM] Initializing Zoom SDK...
✅ [ZOOM] SDK initialized
📞 [ZOOM] Joining session...
```

## Troubleshooting

### No Logs Appearing:
1. **Check device connection**: `adb devices`
2. **Check log level**: Make sure it's set to Verbose or Debug
3. **Check filters**: Clear all filters in Logcat
4. **Restart ADB**: `adb kill-server && adb start-server`

### Too Many Logs:
1. **Filter by package**: `package:com.fayo.healthcare`
2. **Filter by tag**: Use specific tags like `BookAppointment`
3. **Set log level**: Use Warning or Error only

### Logs Not Showing in Real-Time:
1. **Check Logcat is active**: Click on Logcat tab
2. **Check device**: Make sure correct device is selected
3. **Clear and restart**: `adb logcat -c` then restart app

## Quick Reference Commands

```bash
# View all logs from your app
adb logcat | grep "com.fayo.healthcare"

# View only errors
adb logcat *:E | grep "com.fayo.healthcare"

# View specific tags
adb logcat | grep -E "BookAppointment|CallWebSocket|API"

# Clear logs and start fresh
adb logcat -c

# Save logs to file
adb logcat > logs.txt

# View logs with timestamps
adb logcat -v time | grep "com.fayo.healthcare"
```

## Tips

1. **Use consistent tags**: The app uses emoji prefixes (📞, ✅, ❌) which make logs easy to spot
2. **Filter by emoji**: Search for `📞` to see all call-related logs
3. **Use log levels**: Use `Log.e()` for errors, `Log.d()` for debug info
4. **Save important logs**: Export logs when debugging issues
5. **Use breakpoints**: Combine with Android Studio debugger for detailed inspection

