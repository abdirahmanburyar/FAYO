#!/bin/bash
# Check Firebase initialization status

echo "🔍 Checking Firebase Initialization Status..."
echo ""

# Check if file exists
echo "1. Checking for firebase-service-account.json file:"
if [ -f "firebase-service-account.json" ]; then
  echo "   ✅ File exists in current directory: $(pwd)/firebase-service-account.json"
  echo "   File size: $(stat -f%z firebase-service-account.json 2>/dev/null || stat -c%s firebase-service-account.json 2>/dev/null) bytes"
else
  echo "   ❌ File NOT found in: $(pwd)/firebase-service-account.json"
fi

# Check other possible locations
echo ""
echo "2. Checking other possible locations:"
possible_paths=(
  "./firebase-service-account.json"
  "../firebase-service-account.json"
  "../../firebase-service-account.json"
  "./services/api-service/firebase-service-account.json"
)

for path in "${possible_paths[@]}"; do
  if [ -f "$path" ]; then
    echo "   ✅ Found: $path"
  else
    echo "   ❌ Not found: $path"
  fi
done

# Check environment variable
echo ""
echo "3. Checking FIREBASE_SERVICE_ACCOUNT environment variable:"
if [ -n "$FIREBASE_SERVICE_ACCOUNT" ]; then
  echo "   ✅ Environment variable is set"
  echo "   Length: ${#FIREBASE_SERVICE_ACCOUNT} characters"
  # Try to parse as JSON
  if echo "$FIREBASE_SERVICE_ACCOUNT" | python3 -m json.tool > /dev/null 2>&1; then
    echo "   ✅ Valid JSON format"
  else
    echo "   ⚠️  May not be valid JSON"
  fi
else
  echo "   ❌ Environment variable is NOT set"
fi

# Check PM2 logs for Firebase initialization
echo ""
echo "4. Checking recent PM2 logs for Firebase initialization:"
echo "   (Last 30 lines of api-service logs)"
pm2 logs fayo-api-service --lines 30 --nostream 2>/dev/null | grep -i "firebase\|fcm" || echo "   No Firebase-related logs found"

echo ""
echo "✅ Diagnostic complete!"
echo ""
echo "Next steps:"
echo "1. If file exists, make sure it's in the correct location"
echo "2. Rebuild the service: cd services/api-service && npm run build"
echo "3. Restart PM2: pm2 restart fayo-api-service"
echo "4. Check logs: pm2 logs fayo-api-service --lines 50"

