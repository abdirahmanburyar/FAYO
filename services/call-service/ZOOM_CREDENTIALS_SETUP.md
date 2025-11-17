# Zoom Credentials Setup Guide

## Credentials Provided

You have provided the following Zoom credentials:
- **Account ID**: `9mq72XcPTOaCqrSX9HDM7w`
- **Client ID**: `VeGoqTdsQYKdjPeWSdgLuw`
- **Client Secret**: `4UCWlPCZhfLC2he09oMNUXtmoIWnLZF2`

## Configuration

### Option 1: Using Client ID/Secret (Your Current Credentials)

Add these to your `services/call-service/.env` file:

```env
ZOOM_CLIENT_ID=VeGoqTdsQYKdjPeWSdgLuw
ZOOM_CLIENT_SECRET=4UCWlPCZhfLC2he09oMNUXtmoIWnLZF2
ZOOM_ACCOUNT_ID=9mq72XcPTOaCqrSX9HDM7w
ZOOM_TOKEN_TTL=3600
```

### Option 2: Using SDK Key/Secret (If You Have Video SDK App)

If you have a Video SDK app (different from OAuth app), use:

```env
ZOOM_SDK_KEY=your_sdk_key_here
ZOOM_SDK_SECRET=your_sdk_secret_here
ZOOM_TOKEN_TTL=3600
```

## Important Notes

1. **Client ID/Secret vs SDK Key/Secret**:
   - **Client ID/Secret**: Used for OAuth apps (Server-to-Server OAuth)
   - **SDK Key/Secret**: Used for Video SDK apps
   - The backend now supports both, but you need to use the correct one based on your app type

2. **JWT Token Generation**:
   - The backend generates JWT tokens using the credentials
   - For Client ID/Secret: Uses Client ID as `iss` (issuer) in JWT
   - For SDK Key/Secret: Uses SDK Key as `iss` (issuer) in JWT

3. **Account ID**:
   - Currently stored but not used in JWT generation
   - May be needed for future features or specific Zoom API calls

## Verification

After setting up the credentials, restart the `call-service`:

```bash
cd services/call-service
npm run start:dev
```

Check the logs to ensure the service starts without credential errors.

