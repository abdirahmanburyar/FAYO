# HTTPS Setup for Zoom SDK OAuth

## Overview
Zoom Video SDK uses OAuth 2.0 for authentication, which **requires HTTPS** connections. This document explains how to configure HTTPS for the mobile app.

## Why HTTPS is Required

1. **OAuth 2.0 Security**: OAuth flows require secure connections to protect tokens and credentials
2. **Zoom SDK Requirements**: Zoom SDK authentication endpoints only accept HTTPS connections
3. **Android Security**: Modern Android versions restrict cleartext (HTTP) traffic by default
4. **Token Security**: JWT tokens and API keys must be transmitted over encrypted connections

## Configuration

### 1. Network Security Configuration

The app includes a network security config at:
- `androidApp/src/main/res/xml/network_security_config.xml`

This config:
- **Blocks HTTP** by default (required for Zoom SDK)
- Allows HTTPS with system and user certificates
- Optionally allows HTTP for localhost/development IPs (for local testing only)

### 2. AppModule Configuration

In `androidApp/src/main/java/com/fayo/healthcare/di/AppModule.kt`:

```kotlin
val useHttps = true // Set to true for production (required for Zoom SDK)
val baseHost = "your-server-domain.com" // Use domain name for production
val protocol = if (useHttps) "https" else "http"
```

**Important**: 
- Set `useHttps = true` for production
- Use a domain name (not IP) for production HTTPS
- Only use `useHttps = false` for local development without HTTPS

### 3. Server Requirements

Your backend services must support HTTPS:

1. **SSL Certificate**: Obtain a valid SSL certificate (Let's Encrypt, commercial, etc.)
2. **Nginx/Reverse Proxy**: Configure HTTPS on port 443
3. **Backend Services**: Ensure services accept HTTPS connections
4. **Certificate Chain**: Include full certificate chain for proper validation

### 4. Development Setup

For local development with HTTP:

1. **Option 1**: Use HTTPS locally with self-signed certificate
   - Generate self-signed certificate
   - Configure nginx/backend to use it
   - Add certificate to Android's trust store (or use network security config)

2. **Option 2**: Use HTTP only for local testing (NOT for Zoom SDK)
   - Set `useHttps = false` in AppModule
   - Add your dev IP to `network_security_config.xml` cleartext domains
   - **Note**: Zoom SDK calls will fail with HTTP - use HTTPS even for dev

### 5. Production Setup

For production:

1. **Use HTTPS**: Set `useHttps = true` in AppModule
2. **Use Domain**: Use domain name instead of IP address
   ```kotlin
   val baseHost = "api.yourdomain.com" // Not "10.86.182.69"
   ```
3. **Valid Certificate**: Ensure SSL certificate is valid and not expired
4. **Certificate Pinning** (Optional but recommended):
   - Implement certificate pinning in `AndroidHttpClient.kt`
   - Pin your server's certificate to prevent MITM attacks

## Testing HTTPS

1. **Verify Connection**:
   ```bash
   curl -v https://your-server-domain.com:3005/api/v1/health
   ```

2. **Check Certificate**:
   ```bash
   openssl s_client -connect your-server-domain.com:443 -showcerts
   ```

3. **Android Logs**: Check app logs for SSL errors:
   ```
   🔐 [AppModule] Using HTTPS for API connections
   ```

## Common Issues

### Issue: "SSL Handshake Failed"
**Solution**: 
- Verify SSL certificate is valid
- Check certificate chain is complete
- Ensure server supports TLS 1.2+

### Issue: "Certificate Not Trusted"
**Solution**:
- For production: Use valid CA-signed certificate
- For dev: Add self-signed cert to network security config

### Issue: "Cleartext Traffic Not Permitted"
**Solution**:
- Ensure `android:usesCleartextTraffic="false"` in AndroidManifest
- Remove HTTP URLs from network security config
- Use HTTPS for all API calls

## Security Best Practices

1. **Always use HTTPS** for production
2. **Implement certificate pinning** for sensitive apps
3. **Use domain names** instead of IP addresses
4. **Keep certificates updated** and monitor expiration
5. **Use strong TLS versions** (TLS 1.2 or higher)

## References

- [Android Network Security Config](https://developer.android.com/training/articles/security-config)
- [Zoom SDK Authentication](https://marketplace.zoom.us/docs/sdk/video/android/authentication)
- [OAuth 2.0 Security Best Practices](https://oauth.net/2/security-best-practices/)

