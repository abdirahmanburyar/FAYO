# Security Hardening Guide

This document outlines the security measures implemented to protect the admin panel from vulnerabilities and attacks.

## Security Measures Implemented

### 1. Route Protection Middleware
- **File**: `src/middleware.ts`
- **Protection**: All `/admin/*` routes are now protected and require authentication
- **Features**:
  - Automatic redirect to login for unauthenticated users
  - Rate limiting (100 requests per 15 minutes per IP)
  - Login attempt limiting (5 attempts per 15 minutes per IP)
  - Security headers on all responses

### 2. Security Headers
- **File**: `next.config.ts`
- **Headers Added**:
  - `X-Frame-Options: DENY` - Prevents clickjacking
  - `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
  - `X-XSS-Protection: 1; mode=block` - XSS protection
  - `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
  - `Permissions-Policy` - Restricts browser features
  - `Content-Security-Policy` - Restricts resource loading
  - `Strict-Transport-Security` - Forces HTTPS (when using HTTPS)

### 3. Input Validation & Sanitization
- **File**: `src/app/api/v1/auth/admin-login/route.ts`
- **Protections**:
  - Input sanitization (removes dangerous characters)
  - Length validation
  - Format validation (username must be numeric)
  - Generic error messages (prevents information leakage)

### 4. Secure Authentication
- HTTP-only cookies for token storage
- Secure flag for cookies in production
- SameSite=strict cookie policy
- No sensitive data in logs

### 5. Rate Limiting
- **Login endpoints**: 5 attempts per 15 minutes per IP
- **Other endpoints**: 100 requests per 15 minutes per IP
- Prevents brute force attacks and DDoS

### 6. Docker Security
- Non-root user execution (nextjs:nodejs)
- Minimal Alpine Linux base image
- Telemetry disabled
- No unnecessary packages

## Additional Security Recommendations

### Immediate Actions Required

1. **Update Next.js and Dependencies**
   ```bash
   npm audit fix
   npm update next react react-dom
   ```

2. **Review and Rotate Secrets**
   - Change all JWT secrets
   - Update database passwords
   - Rotate API keys

3. **Enable HTTPS**
   - Use a reverse proxy (nginx/traefik) with SSL certificates
   - Update CSP headers to match your domain

4. **Monitor for Suspicious Activity**
   - Check server logs for unusual patterns
   - Monitor failed login attempts
   - Review process list for unknown processes

5. **Check for Malware**
   ```bash
   # Check running processes
   ps aux | grep -i node
   
   # Check for suspicious network connections
   netstat -tulpn
   
   # Check for modified files
   find /app -type f -mtime -1
   ```

6. **Review Environment Variables**
   - Ensure no secrets are exposed in environment variables
   - Use secret management (Docker secrets, Kubernetes secrets, etc.)

### Long-term Security Improvements

1. **Implement WAF (Web Application Firewall)**
   - Use Cloudflare, AWS WAF, or similar
   - Block known attack patterns

2. **Add Logging & Monitoring**
   - Implement centralized logging (ELK, Loki, etc.)
   - Set up alerts for suspicious activity
   - Monitor authentication failures

3. **Regular Security Audits**
   - Run `npm audit` regularly
   - Keep dependencies updated
   - Review security advisories

4. **Implement 2FA**
   - Add two-factor authentication for admin accounts
   - Use TOTP or SMS-based 2FA

5. **Backup Strategy**
   - Regular automated backups
   - Test restore procedures
   - Off-site backup storage

## Checking for Compromise

If you suspect your server has been compromised:

1. **Check for Unknown Processes**
   ```bash
   ps aux | grep -E "node|npm|next"
   ```

2. **Check for Modified Files**
   ```bash
   find /app -type f -newermt "2025-01-01" -ls
   ```

3. **Check Network Connections**
   ```bash
   netstat -tulpn | grep LISTEN
   ```

4. **Check for Cryptominers**
   ```bash
   top -b -n 1 | head -20
   # Look for high CPU usage from unknown processes
   ```

5. **Review Logs**
   ```bash
   # Check Next.js logs
   docker logs <admin-panel-container> --tail 1000
   
   # Check system logs
   journalctl -u docker --since "24 hours ago"
   ```

## Incident Response

If you find evidence of compromise:

1. **Immediately**:
   - Take the server offline
   - Change all passwords and secrets
   - Review and revoke all API keys

2. **Investigate**:
   - Document all findings
   - Preserve logs for analysis
   - Identify attack vector

3. **Remediate**:
   - Remove malicious code
   - Patch vulnerabilities
   - Restore from clean backup if needed

4. **Prevent Future Attacks**:
   - Implement all security measures above
   - Regular security audits
   - Keep systems updated

## Contact

For security issues, please report them immediately to your system administrator.

