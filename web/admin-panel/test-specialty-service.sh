#!/bin/bash

# Test script to check if specialty-service is reachable
# Run this on the VPS server: bash test-specialty-service.sh

SPECIALTY_SERVICE_URL="http://31.97.58.62:3004"
ENDPOINT="/api/v1/specialties"

echo "🔍 Testing specialty-service connectivity..."
echo ""
echo "Target URL: ${SPECIALTY_SERVICE_URL}${ENDPOINT}"
echo ""

# Test 1: Check if port is open
echo "📡 Test 1: Checking if port 3004 is open..."
if nc -z -v 31.97.58.62 3004 2>&1 | grep -q "succeeded"; then
    echo "✅ Port 3004 is open and accessible"
else
    echo "❌ Port 3004 is not accessible"
    echo "   This could mean:"
    echo "   - The service is not running"
    echo "   - The port is blocked by firewall"
    echo "   - The service is bound to a different interface"
fi
echo ""

# Test 2: Try HTTP request with curl
echo "📡 Test 2: Making HTTP request..."
response=$(curl -s -w "\n%{http_code}" -o /tmp/specialty_response.json --max-time 5 "${SPECIALTY_SERVICE_URL}${ENDPOINT}" 2>&1)
http_code=$(echo "$response" | tail -n1)
response_body=$(cat /tmp/specialty_response.json 2>/dev/null)

if [ "$http_code" = "200" ]; then
    echo "✅ HTTP request successful!"
    echo "   Status Code: $http_code"
    echo ""
    echo "📦 Response:"
    echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body"
    
    # Count specialties if it's an array
    count=$(echo "$response_body" | jq 'length' 2>/dev/null || echo "$response_body" | jq '.data | length' 2>/dev/null || echo "0")
    if [ "$count" != "0" ] && [ "$count" != "null" ]; then
        echo ""
        echo "✅ Successfully retrieved $count specialties"
    fi
elif [ "$http_code" = "000" ]; then
    echo "❌ Connection failed!"
    echo "   Error: Could not connect to the service"
    echo "   Check if the service is running:"
    echo "   - docker ps | grep specialty"
    echo "   - docker logs <specialty-container-id>"
    echo "   - netstat -tuln | grep 3004"
else
    echo "⚠️  HTTP request returned status code: $http_code"
    echo "   Response:"
    echo "$response_body"
fi
echo ""

# Test 3: Check from localhost
echo "📡 Test 3: Testing from localhost..."
localhost_response=$(curl -s -w "\n%{http_code}" -o /tmp/specialty_localhost.json --max-time 5 "http://localhost:3004${ENDPOINT}" 2>&1)
localhost_code=$(echo "$localhost_response" | tail -n1)

if [ "$localhost_code" = "200" ]; then
    echo "✅ Service is accessible from localhost"
elif [ "$localhost_code" = "000" ]; then
    echo "❌ Service is NOT accessible from localhost"
    echo "   The service might not be running or not bound to localhost"
else
    echo "⚠️  Localhost test returned status code: $localhost_code"
fi
echo ""

# Cleanup
rm -f /tmp/specialty_response.json /tmp/specialty_localhost.json

echo "🏁 Testing complete!"

