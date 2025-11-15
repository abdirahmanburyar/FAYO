#!/bin/bash

# Script to fix out-of-sync package-lock.json files
# This updates all lock files to match their package.json files

set -e

echo "=========================================="
echo "Fixing package-lock.json files"
echo "=========================================="
echo ""

# Fix service lock files
for service in services/*/; do
    if [ -f "$service/package.json" ]; then
        service_name=$(basename "$service")
        echo "Fixing lock file for $service_name..."
        cd "$service"
        
        # Remove old lock file and node_modules
        rm -f package-lock.json
        rm -rf node_modules
        
        # Install fresh dependencies
        npm install
        
        cd ../..
        echo "✓ Fixed $service_name"
        echo ""
    fi
done

# Fix web/admin-panel if it exists
if [ -f "web/admin-panel/package.json" ]; then
    echo "Fixing lock file for web/admin-panel..."
    cd web/admin-panel
    
    # Remove old lock file and node_modules
    rm -f package-lock.json
    rm -rf node_modules
    
    # Install fresh dependencies
    npm install
    
    cd ../..
    echo "✓ Fixed web/admin-panel"
    echo ""
fi

echo "=========================================="
echo "All lock files have been updated!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Review the changes: git status"
echo "2. Commit the updated lock files:"
echo "   git add */package-lock.json"
echo "   git commit -m 'Update package-lock.json files'"
echo "   git push"
echo ""

