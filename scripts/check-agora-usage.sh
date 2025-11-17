#!/bin/bash

# Agora Usage Checker Script
# This script helps you check your Agora usage and estimate costs
# Requires Agora REST API credentials

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔍 Agora Usage Checker${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check if credentials are set
if [ -z "$AGORA_APP_ID" ] || [ -z "$AGORA_CUSTOMER_ID" ] || [ -z "$AGORA_CUSTOMER_SECRET" ]; then
    echo -e "${YELLOW}⚠️  Agora API credentials not set${NC}"
    echo ""
    echo "To use this script, set the following environment variables:"
    echo "  export AGORA_APP_ID='your-app-id'"
    echo "  export AGORA_CUSTOMER_ID='your-customer-id'"
    echo "  export AGORA_CUSTOMER_SECRET='your-customer-secret'"
    echo ""
    echo "You can find these in:"
    echo "  https://console.agora.io/ → Your Project → Settings → RESTful API"
    echo ""
    echo -e "${YELLOW}For now, showing manual check instructions...${NC}"
    echo ""
    echo -e "${GREEN}Manual Usage Check:${NC}"
    echo "1. Go to: https://console.agora.io/"
    echo "2. Select your project"
    echo "3. Navigate to: Usage & Billing"
    echo "4. View: Monthly Usage Statistics"
    echo ""
    echo -e "${GREEN}Usage Calculation:${NC}"
    echo "Free Tier: 10,000 minutes/month (video or voice)"
    echo "Video Cost: \$3.99 per 1,000 minutes after free tier"
    echo "Voice Cost: \$0.99 per 1,000 minutes after free tier"
    echo ""
    echo -e "${GREEN}Example Calculation:${NC}"
    echo "If you use 15,000 video minutes:"
    echo "  Free: 10,000 minutes"
    echo "  Paid: 5,000 minutes"
    echo "  Cost: 5 × \$3.99 = \$19.95/month"
    echo ""
    exit 0
fi

# Get current date
CURRENT_DATE=$(date +%Y-%m-%d)
FIRST_OF_MONTH=$(date +%Y-%m-01)

echo -e "${GREEN}📊 Checking usage for: ${FIRST_OF_MONTH} to ${CURRENT_DATE}${NC}"
echo ""

# Note: Agora REST API requires authentication
# This is a template - you'll need to implement actual API calls
echo -e "${YELLOW}Note: This script requires Agora REST API implementation${NC}"
echo ""
echo "To implement full usage checking:"
echo "1. Use Agora REST API: https://docs.agora.io/en/faq/restful_authentication"
echo "2. Call Usage API endpoint"
echo "3. Parse and display results"
echo ""
echo -e "${GREEN}For now, check usage manually in console:${NC}"
echo "https://console.agora.io/project/${AGORA_APP_ID}/usage"

