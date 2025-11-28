# Login Page Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: HTTPS Certificate Error

**Symptoms:**
- Login fails immediately
- Error message: "SSL connection error" or "Certificate not trusted"
- Logs show: "SSL handshake failed" or "Certificate verification failed"

**Causes:**
- Server doesn't have HTTPS configured
- Server has self-signed certificate
- Certificate is expired or invalid

**Solutions:**

#### Option A: Use HTTP for Development (Not Recommended for Production)
1. Open `androidApp/src/main/java/com/fayo/healthcare/di/AppModule.kt`
2. Change `val useHttps = true` to `val useHttps = false`
3. Uncomment the development IP in `network_security_config.xml`:
   ```xml
   <domain includeSubdomains="true">10.86.182.69</domain>
   ```
4. **Note**: This will NOT work for Zoom SDK calls (they require HTTPS)

#### Option B: Configure Server with Valid HTTPS Certificate
1. Obtain a valid SSL certificate (Let's Encrypt, commercial, etc.)
2. Configure your server (Nginx, Apache, etc.) to use HTTPS
3. Ensure certificate chain is complete
4. Test with: `curl -v https://10.86.182.69:3001/api/v1/health`

#### Option C: Trust Self-Signed Certificate (Development Only)
1. Export server certificate
2. Add to Android's trust store or network security config
3. **Warning**: Only for development, not production

### Issue 2: Network Connection Error

**Symptoms:**
- "Connection timeout" error
- "Unable to resolve host" error
- Request never completes

**Causes:**
- Server is not running
- Wrong IP address or port
- Firewall blocking connection
- Device not on same network

**Solutions:**
1. Verify server is running: `curl http://10.86.182.69:3001/api/v1/health`
2. Check IP address in `AppModule.kt` matches your server
3. Ensure device and server are on same network
4. Check firewall rules allow connections on port 3001

### Issue 3: API Endpoint Not Found (404)

**Symptoms:**
- Error: "HTTP 404: Not Found"
- "Server endpoint not found" message

**Causes:**
- Wrong API endpoint URL
- Server route not configured correctly

**Solutions:**
1. Verify endpoint: `POST https://10.86.182.69:3001/api/v1/otp/generate`
2. Check server logs to see if request is received
3. Verify `main.ts` has `app.setGlobalPrefix('api/v1')`
4. Verify OTP controller is registered in `app.module.ts`

### Issue 4: Response Parsing Error

**Symptoms:**
- Request succeeds but app shows error
- Logs show: "Failed to parse response"

**Causes:**
- Response format doesn't match expected model
- Missing fields in response

**Solutions:**
1. Check server response format matches `SendOtpResponse`:
   ```json
   {
     "message": "OTP sent successfully",
     "expiresIn": 300000,
     "userCreated": false
   }
   ```
2. Check logs for "Raw response" to see actual server response
3. Update `SendOtpResponse` model if server response format changed

### Issue 5: Phone Number Validation Error

**Symptoms:**
- Error: "Invalid phone number"
- Request fails with validation error

**Causes:**
- Phone number format doesn't match backend validation
- Backend expects specific format (e.g., with country code)

**Solutions:**
1. Ensure phone number includes country code: `+252901234567`
2. Check backend validation rules in `generate-otp.dto.ts`
3. Verify phone number format matches backend expectations

## Debugging Steps

### 1. Check Logs

Run the app and check Android logs:
```bash
adb logcat | grep -E "(LoginViewModel|API|OTP|Error)"
```

Look for:
- `📡 [API] POST ...` - Request being sent
- `📥 [API] Response status: ...` - Response status code
- `✅ [API] OTP sent successfully` - Success
- `❌ [API] Error ...` - Error details

### 2. Test API Directly

Test the endpoint with curl:
```bash
# HTTP
curl -X POST http://10.86.182.69:3001/api/v1/otp/generate \
  -H "Content-Type: application/json" \
  -d '{"phone": "+252901234567"}'

# HTTPS
curl -X POST https://10.86.182.69:3001/api/v1/otp/generate \
  -H "Content-Type: application/json" \
  -d '{"phone": "+252901234567"}' \
  -k  # Ignore certificate errors for testing
```

### 3. Verify Configuration

Check these files:
- `AppModule.kt` - API URLs and HTTPS setting
- `network_security_config.xml` - Network security rules
- `AndroidManifest.xml` - Internet permission and network config

### 4. Check Server Logs

Check your backend server logs to see if:
- Request is received
- OTP is generated
- Response is sent
- Any errors occur

## Quick Fixes

### For Development (No HTTPS)
1. Set `useHttps = false` in `AppModule.kt`
2. Uncomment dev IP in `network_security_config.xml`
3. Restart app

### For Production (HTTPS Required)
1. Ensure server has valid SSL certificate
2. Set `useHttps = true` in `AppModule.kt`
3. Use domain name instead of IP if possible
4. Test HTTPS connection before deploying

## Testing Checklist

- [ ] Server is running and accessible
- [ ] API endpoint responds correctly (test with curl)
- [ ] HTTPS certificate is valid (if using HTTPS)
- [ ] Network security config allows connections
- [ ] Phone number format is correct
- [ ] App has internet permission
- [ ] Device and server are on same network (for local testing)
- [ ] Firewall allows connections on required ports

## Still Not Working?

1. **Check Android Logs**: Look for detailed error messages
2. **Test with curl**: Verify server is working independently
3. **Check Network**: Ensure device can reach server
4. **Verify Configuration**: Double-check all URLs and settings
5. **Check Server Logs**: See if requests are reaching the server

