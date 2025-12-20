#!/bin/bash

# Setup Git Mirror to VPS
# This script sets up automatic mirroring from local git to VPS

set -e

VPS_HOST="${VPS_HOST:-72.62.51.50}"
VPS_USER="${VPS_USER:-root}"
VPS_PATH="${VPS_PATH:-/root/fayo}"
LOCAL_REPO_PATH="$(pwd)"

echo "🚀 Setting up Git Mirror to VPS"
echo "VPS: ${VPS_USER}@${VPS_HOST}:${VPS_PATH}"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository!"
    exit 1
fi

# Check if VPS remote already exists
if git remote get-url vps &>/dev/null; then
    echo "⚠️  VPS remote already exists. Updating..."
    git remote set-url vps ${VPS_USER}@${VPS_HOST}:${VPS_PATH}
else
    echo "➕ Adding VPS remote..."
    git remote add vps ${VPS_USER}@${VPS_HOST}:${VPS_PATH}
fi

# Test SSH connection
echo "🔍 Testing SSH connection..."
if ssh -o ConnectTimeout=5 ${VPS_USER}@${VPS_HOST} "echo 'Connection successful'" 2>/dev/null; then
    echo "✅ SSH connection successful"
else
    echo "❌ SSH connection failed!"
    echo "Please set up SSH keys or configure SSH access first."
    exit 1
fi

# Setup VPS git repository (bare or regular)
echo "📦 Setting up VPS git repository..."
ssh ${VPS_USER}@${VPS_HOST} << EOF
    mkdir -p ${VPS_PATH}
    cd ${VPS_PATH}
    
    # Initialize git if not already initialized
    if [ ! -d .git ]; then
        git init
        git config receive.denyCurrentBranch warn
    fi
    
    # Create post-receive hook for auto-deployment
    mkdir -p .git/hooks
    cat > .git/hooks/post-receive << 'HOOK_EOF'
#!/bin/bash
cd ${VPS_PATH}
unset GIT_DIR
git checkout -f
echo "✅ Code updated on VPS"
HOOK_EOF
    
    chmod +x .git/hooks/post-receive
    echo "✅ VPS git repository configured"
EOF

# Create local post-commit hook
echo "📝 Creating local post-commit hook..."
mkdir -p .git/hooks

cat > .git/hooks/post-commit << 'HOOK_EOF'
#!/bin/bash

# Auto-push to VPS after commit
VPS_HOST="${VPS_HOST:-72.62.51.50}"
VPS_USER="${VPS_USER:-root}"
VPS_PATH="${VPS_PATH:-/root/fayo}"

echo "🔄 Auto-pushing to VPS..."
git push vps HEAD:main 2>&1 || git push vps HEAD:master 2>&1 || {
    echo "⚠️  Auto-push failed, but commit was successful"
    echo "You can manually push with: git push vps"
}
HOOK_EOF

chmod +x .git/hooks/post-commit

# Create post-merge hook for pulls
cat > .git/hooks/post-merge << 'HOOK_EOF'
#!/bin/bash

# Auto-push to VPS after merge/pull
VPS_HOST="${VPS_HOST:-72.62.51.50}"
VPS_USER="${VPS_USER:-root}"
VPS_PATH="${VPS_PATH:-/root/fayo}"

echo "🔄 Auto-pushing to VPS after merge..."
git push vps HEAD:main 2>&1 || git push vps HEAD:master 2>&1 || {
    echo "⚠️  Auto-push failed, but merge was successful"
}
HOOK_EOF

chmod +x .git/hooks/post-merge

echo ""
echo "✅ Git mirror setup complete!"
echo ""
echo "📋 What happens now:"
echo "   1. Every time you commit, code will auto-push to VPS"
echo "   2. VPS will auto-update when it receives the push"
echo "   3. Manual push: git push vps"
echo ""
echo "🔧 To disable auto-push, remove .git/hooks/post-commit"

