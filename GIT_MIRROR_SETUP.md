# Git Mirror Setup - Local to VPS Auto-Sync

This guide sets up automatic mirroring from your local git repository to your VPS, so changes are automatically synced and deployed using PM2 without using GitHub Actions.

## 🎯 Overview

With this setup:
- ✅ Every local commit automatically pushes to VPS
- ✅ VPS automatically updates and redeploys with PM2
- ✅ No need for GitHub Actions
- ✅ Fast and direct deployment

## 📋 Prerequisites

1. SSH access to VPS configured
2. Git installed locally
3. Node.js 22+ and PM2 installed on VPS
4. Infrastructure services (PostgreSQL, Redis, RabbitMQ) running on VPS

> **Note:** See [PM2_DEPLOYMENT_GUIDE.md](./PM2_DEPLOYMENT_GUIDE.md) for initial VPS setup.
> 
> **CentOS 10 Stream:** This guide includes CentOS-specific instructions. If you're using Ubuntu/Debian, use `apt-get` instead of `dnf`.

## 🚀 Quick Setup

### Step 1: Setup Local Git Mirror

**Windows:**
```bash
cd C:\FAYO
scripts\setup-git-mirror.bat
```

**Linux/macOS:**
```bash
cd /path/to/FAYO
chmod +x scripts/setup-git-mirror.sh
./scripts/setup-git-mirror.sh
```

This will:
- Add VPS as a git remote named `vps`
- Create post-commit hook for auto-push
- Test SSH connection
- Setup VPS git repository and post-receive hook

### Step 2: Verify VPS Setup

SSH to your VPS and verify PM2 is running:
```bash
ssh root@72.62.51.50
cd /root/fayo
pm2 status
```

## 🔧 Manual Setup (Alternative)

### Local Setup

1. **Add VPS as remote:**
```bash
git remote add vps root@72.62.51.50:/root/fayo
```

2. **Create post-commit hook:**

**Windows** (`.git\hooks\post-commit`):
```bash
#!/bin/bash
git push vps HEAD:main 2>&1 || git push vps HEAD:master 2>&1
```

**Linux/macOS** (`.git/hooks/post-commit`):
```bash
#!/bin/bash
git push vps HEAD:main 2>&1 || git push vps HEAD:master 2>&1
chmod +x .git/hooks/post-commit
```

### VPS Setup (CentOS 10 Stream)

1. **SSH to VPS:**
```bash
ssh root@72.62.51.50
cd /root/fayo
```

2. **Install prerequisites (if not already installed):**
```bash
# Update system
dnf update -y

# Install Git (if not installed)
dnf install -y git

# Install Node.js 22+ (if not installed)
curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
dnf install -y nodejs

# Install PM2 (if not installed)
npm install -g pm2

# Verify installations
git --version
node -v  # Should be v22.17.1 or higher
pm2 --version
```

3. **Initialize git (if not already):**
```bash
git init
git config receive.denyCurrentBranch warn
```

4. **Create post-receive hook:**
```bash
cat > .git/hooks/post-receive << 'EOF'
#!/bin/bash
cd /root/fayo
unset GIT_DIR
git checkout -f

echo "🔄 Code updated, redeploying with PM2..."

# Install dependencies and build (if needed)
cd services/api-service
npm ci --legacy-peer-deps --no-audit --no-fund || true
npx prisma generate || true
npm run build || true
cd ../..

cd web/admin-panel
npm ci --legacy-peer-deps --no-audit --no-fund || true
npm run build || true
cd ../..

cd web/hospital-panel
npm ci --legacy-peer-deps --no-audit --no-fund || true
npm run build || true
cd ../..

# Restart PM2 services
pm2 restart ecosystem.config.js || pm2 reload ecosystem.config.js

echo "✅ Deployment complete"
EOF

chmod +x .git/hooks/post-receive
```

## 📝 Usage

### Normal Workflow

1. **Make changes locally:**
```bash
# Edit files
git add .
git commit -m "Your changes"
# Code automatically pushes to VPS and deploys!
```

2. **Manual push (if needed):**
```bash
git push vps
```

### Disable Auto-Push

To temporarily disable auto-push:

**Windows:**
```bash
del .git\hooks\post-commit
```

**Linux/macOS:**
```bash
rm .git/hooks/post-commit
```

### Re-enable Auto-Push

Run the setup script again or manually recreate the hook.

## 🔍 Troubleshooting

### SSH Connection Issues

```bash
# Test SSH connection
ssh root@72.62.51.50 "echo 'Connection successful'"

# If password is required, set up SSH keys:
ssh-keygen -t rsa -b 4096
ssh-copy-id root@72.62.51.50
```

### Git Push Fails

```bash
# Check remote URL
git remote -v

# Update remote URL
git remote set-url vps root@72.62.51.50:/root/fayo

# Test push manually
git push vps HEAD:main
```

### VPS Not Updating

1. **Check post-receive hook exists:**
```bash
ssh root@72.62.51.50 "ls -la /root/fayo/.git/hooks/post-receive"
```

2. **Check hook permissions:**
```bash
ssh root@72.62.51.50 "chmod +x /root/fayo/.git/hooks/post-receive"
```

3. **Test hook manually:**
```bash
ssh root@72.62.51.50 "cd /root/fayo && .git/hooks/post-receive"
```

### PM2 Not Restarting

1. **Check PM2 status:**
```bash
ssh root@72.62.51.50 "cd /root/fayo && pm2 status"
```

2. **Check PM2 logs:**
```bash
ssh root@72.62.51.50 "cd /root/fayo && pm2 logs"
```

3. **Manually restart services:**
```bash
ssh root@72.62.51.50 "cd /root/fayo && pm2 restart ecosystem.config.js"
```

### Build Failures

If builds fail during auto-deployment, you may need to run the full setup:

```bash
ssh root@72.62.51.50
cd /root/fayo
./setup-pm2.sh
```

## 🎨 Customization

### Change VPS Path

Edit the scripts or set environment variables:
```bash
export VPS_PATH=/custom/path
./scripts/setup-git-mirror.sh
```

### Custom Deployment Steps

Edit `.git/hooks/post-receive` on VPS to add custom steps:
```bash
# Example: Run database migrations
cd services/api-service
npx prisma migrate deploy

# Example: Clear cache
pm2 flush

# Example: Run tests before deployment
npm test
```

### Skip Auto-Build

To skip building during auto-deployment (faster, but requires manual build):
```bash
# In post-receive hook, comment out build steps:
# npm run build || true
```

## 🔒 Security Notes

- ✅ Uses SSH for secure transfer
- ✅ No passwords in scripts
- ⚠️  Ensure SSH keys are properly secured
- ⚠️  VPS should have firewall configured
- ⚠️  Use strong JWT secrets in production

## 📊 Comparison: Git Mirror vs GitHub Actions

| Feature | Git Mirror | GitHub Actions |
|---------|-----------|----------------|
| Speed | ⚡ Instant | 🐌 Slower (CI/CD overhead) |
| Setup | Simple | More complex |
| Cost | Free | Free (with limits) |
| Visibility | Local only | GitHub UI |
| Dependencies | SSH only | GitHub + SSH |
| Build Time | On VPS | On GitHub runners |

## 🎉 Benefits

1. **Faster Deployment** - Direct push, no CI/CD queue
2. **Simpler Setup** - No GitHub secrets needed
3. **More Control** - Full control over deployment process
4. **Offline Capable** - Works without internet (after initial setup)
5. **Cost Effective** - No GitHub Actions minutes used
6. **Direct Access** - Immediate feedback on deployment

## 📚 Additional Resources

- [PM2 Deployment Guide](./PM2_DEPLOYMENT_GUIDE.md) - Complete PM2 setup instructions
- [Git Hooks Documentation](https://git-scm.com/docs/githooks)
- [SSH Key Setup Guide](./SETUP_SSH_KEY.md)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)

## 🔄 Deployment Flow

```
Local Commit
    ↓
Post-Commit Hook (auto-push)
    ↓
VPS Git Repository
    ↓
Post-Receive Hook (auto-deploy)
    ↓
Update Code → Install Dependencies → Build → PM2 Restart
    ↓
Services Running
```

## ⚠️ Important Notes

1. **First Time Setup**: Run `setup-pm2.sh` on VPS before using git mirror
2. **Environment Variables**: Ensure `.env` files are configured on VPS
3. **Database Migrations**: May need to run manually: `npx prisma migrate deploy`
4. **Build Time**: First deployment may take longer due to dependency installation
5. **PM2 Persistence**: Run `pm2 save` and `pm2 startup` to ensure services restart on reboot

## 🎯 Quick Start for CentOS 10 Stream

If you have a clean `/root/fayo` directory on CentOS 10 Stream, follow these steps:

### Step 1: Install Prerequisites on VPS
```bash
ssh root@72.62.51.50
cd /root/fayo

# Update system
dnf update -y

# Install Git
dnf install -y git

# Install Node.js 22+
curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
dnf install -y nodejs

# Install PM2
npm install -g pm2

# Verify
git --version
node -v
pm2 --version
```

### Step 2: Initialize Git Repository
```bash
cd /root/fayo
git init
git config receive.denyCurrentBranch warn
```

### Step 3: Create Post-Receive Hook
```bash
cat > .git/hooks/post-receive << 'EOF'
#!/bin/bash
cd /root/fayo
unset GIT_DIR
git checkout -f

echo "🔄 Code updated, redeploying with PM2..."

# Install dependencies and build
cd services/api-service
npm ci --legacy-peer-deps --no-audit --no-fund || true
npx prisma generate || true
npm run build || true
cd ../..

cd web/admin-panel
npm ci --legacy-peer-deps --no-audit --no-fund || true
npm run build || true
cd ../..

cd web/hospital-panel
npm ci --legacy-peer-deps --no-audit --no-fund || true
npm run build || true
cd ../..

# Restart PM2 services
pm2 restart ecosystem.config.js || pm2 reload ecosystem.config.js

echo "✅ Deployment complete"
EOF

chmod +x .git/hooks/post-receive
```

### Step 4: Push Code from Local
```bash
# From your local machine (C:\FAYO)
git remote add vps root@72.62.51.50:/root/fayo
git push vps HEAD:main
```

### Step 5: Install Infrastructure & Setup
```bash
# Back on VPS
ssh root@72.62.51.50
cd /root/fayo

# Install PostgreSQL
dnf install -y postgresql15-server postgresql15
postgresql-15-setup --initdb
systemctl enable postgresql-15
systemctl start postgresql-15
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE fayo;"

# Install Redis
dnf install -y redis
systemctl enable redis
systemctl start redis

# Install RabbitMQ
dnf install -y epel-release
dnf install -y rabbitmq-server
systemctl enable rabbitmq-server
systemctl start rabbitmq-server
rabbitmq-plugins enable rabbitmq_management

# Run PM2 setup
chmod +x setup-pm2.sh
./setup-pm2.sh

# Run migrations
cd services/api-service
npx prisma migrate deploy
cd ../..

# Start services
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```
