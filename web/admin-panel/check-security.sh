#!/bin/bash

# Security Check Script for Admin Panel
# Run this script to check for potential security issues

echo "🔒 Security Check for Admin Panel"
echo "=================================="
echo ""

# Check for suspicious processes
echo "1. Checking for suspicious Node.js processes..."
NODE_PROCESSES=$(ps aux | grep -E "node|npm|next" | grep -v grep)
if [ -z "$NODE_PROCESSES" ]; then
    echo "   ✅ No Node.js processes found"
else
    echo "   ⚠️  Found Node.js processes:"
    echo "$NODE_PROCESSES" | while read line; do
        echo "      $line"
    done
fi
echo ""

# Check for high CPU usage
echo "2. Checking for high CPU usage..."
HIGH_CPU=$(top -b -n 1 | head -20 | grep -E "%CPU|node|npm" | head -5)
echo "$HIGH_CPU"
echo ""

# Check for suspicious network connections
echo "3. Checking network connections..."
NETWORK_CONN=$(netstat -tulpn 2>/dev/null | grep LISTEN | grep -E "node|3000")
if [ -z "$NETWORK_CONN" ]; then
    echo "   ✅ No suspicious network connections found"
else
    echo "   ⚠️  Found network connections:"
    echo "$NETWORK_CONN"
fi
echo ""

# Check for recently modified files
echo "4. Checking for recently modified files (last 24 hours)..."
RECENT_FILES=$(find /app -type f -mtime -1 2>/dev/null | head -20)
if [ -z "$RECENT_FILES" ]; then
    echo "   ✅ No recently modified files found"
else
    echo "   ⚠️  Found recently modified files:"
    echo "$RECENT_FILES" | while read file; do
        echo "      $file"
    done
fi
echo ""

# Check npm audit
echo "5. Running npm audit..."
if [ -f "package.json" ]; then
    npm audit --audit-level=moderate 2>/dev/null || echo "   ⚠️  npm audit failed or found vulnerabilities"
else
    echo "   ⚠️  package.json not found"
fi
echo ""

# Check for environment variables exposure
echo "6. Checking for exposed secrets in code..."
SECRET_PATTERNS="password|secret|key|token|api_key"
FOUND_SECRETS=$(grep -r -i -E "$SECRET_PATTERNS" src/ --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v "node_modules" | head -10)
if [ -z "$FOUND_SECRETS" ]; then
    echo "   ✅ No obvious secrets found in code"
else
    echo "   ⚠️  Potential secrets found (review manually):"
    echo "$FOUND_SECRETS" | while read line; do
        echo "      $line"
    done
fi
echo ""

# Check middleware exists
echo "7. Checking security middleware..."
if [ -f "src/middleware.ts" ]; then
    echo "   ✅ Security middleware found"
else
    echo "   ❌ Security middleware NOT found!"
fi
echo ""

# Check next.config.ts security headers
echo "8. Checking Next.js security configuration..."
if grep -q "X-Frame-Options\|Content-Security-Policy" next.config.ts 2>/dev/null; then
    echo "   ✅ Security headers configured"
else
    echo "   ⚠️  Security headers may not be fully configured"
fi
echo ""

echo "=================================="
echo "✅ Security check complete!"
echo ""
echo "Next steps:"
echo "1. Review any warnings above"
echo "2. Run: npm audit fix"
echo "3. Update dependencies: npm update"
echo "4. Review SECURITY.md for more information"

