#!/bin/bash

# Setup VPS Auto-Deployment
# Run this script ON THE VPS to set up automatic deployment

set -e

VPS_PATH="${VPS_PATH:-/root/fayo}"
DEPLOY_SCRIPT="${VPS_PATH}/.git/hooks/post-receive"

echo "🚀 Setting up VPS Auto-Deployment"
echo "Path: ${VPS_PATH}"

# Check if we're in the right directory
if [ ! -d "${VPS_PATH}" ]; then
    echo "❌ Directory ${VPS_PATH} does not exist!"
    exit 1
fi

cd ${VPS_PATH}

# Initialize git if needed
if [ ! -d .git ]; then
    echo "📦 Initializing git repository..."
    git init
    git config receive.denyCurrentBranch warn
fi

# Create comprehensive post-receive hook
echo "📝 Creating post-receive hook..."
mkdir -p .git/hooks

cat > .git/hooks/post-receive << 'HOOK_EOF'
#!/bin/bash

# VPS Auto-Deployment Hook
# This runs automatically when code is pushed to VPS

VPS_PATH="/root/fayo"
cd ${VPS_PATH} || exit 1

echo "🔄 Received code update, deploying..."

# Update working directory
unset GIT_DIR
git checkout -f HEAD || echo "⚠️  Checkout failed, continuing..."
git clean -fd || echo "⚠️  Clean failed, continuing..."

echo "✅ Code updated"

# Check if Docker Compose is available
if command -v docker &> /dev/null; then
    # Try docker compose (V2), fallback to docker-compose (V1)
    if docker compose version &> /dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        echo "⚠️  Docker Compose not found, skipping deployment"
        exit 0
    fi
    
    echo "🐳 Rebuilding and restarting services..."
    
    # Navigate to project root
    cd ${VPS_PATH} || exit 1
    
    # Rebuild and restart services (with error handling)
    ${COMPOSE_CMD} -f docker-compose.prod.yml down --remove-orphans 2>&1 || echo "⚠️  Down command had issues"
    ${COMPOSE_CMD} -f docker-compose.prod.yml build --no-cache 2>&1 || {
        echo "⚠️  Build failed, trying without --no-cache"
        ${COMPOSE_CMD} -f docker-compose.prod.yml build 2>&1 || echo "⚠️  Build failed completely"
    }
    ${COMPOSE_CMD} -f docker-compose.prod.yml up -d 2>&1 || echo "⚠️  Up command had issues"
    
    echo "✅ Services restart attempted"
else
    echo "⚠️  Docker not found, code updated but services not restarted"
fi

echo "🎉 Deployment complete!"
HOOK_EOF

chmod +x .git/hooks/post-receive

# Also create update hook for better control
cat > .git/hooks/update << 'HOOK_EOF'
#!/bin/bash
# Allow all updates
exit 0
HOOK_EOF

chmod +x .git/hooks/update

echo ""
echo "✅ VPS auto-deployment configured!"
echo ""
echo "📋 What happens now:"
echo "   - When code is pushed to VPS, it will automatically:"
echo "     1. Update the working directory"
echo "     2. Rebuild Docker images"
echo "     3. Restart all services"
echo ""
echo "🔧 To test: git push vps from your local machine"

