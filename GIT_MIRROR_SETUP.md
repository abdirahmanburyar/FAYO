# Git Mirror Setup - Local to VPS Auto-Sync

This guide sets up automatic mirroring from your local git repository to your VPS, so changes are automatically synced and deployed without using GitHub Actions.

## 🎯 Overview

With this setup:
- ✅ Every local commit automatically pushes to VPS
- ✅ VPS automatically updates and redeploys
- ✅ No need for GitHub Actions
- ✅ Fast and direct deployment

## 📋 Prerequisites

1. SSH access to VPS configured
2. Git installed locally
3. Docker and Docker Compose on VPS

## 🚀 Quick Setup

### Step 1: Setup Local Git Mirror

**Linux/macOS:**
```bash
cd /path/to/FAYO
chmod +x scripts/setup-git-mirror.sh
./scripts/setup-git-mirror.sh
```

This will:
- Add VPS as a git remote
- Create post-commit hook for auto-push
- Test SSH connection

### Step 2: Setup VPS Auto-Deployment

SSH to your VPS and run:
```bash
ssh root@72.62.51.50
cd /root/fayo
chmod +x scripts/setup-vps-auto-deploy.sh
./scripts/setup-vps-auto-deploy.sh
```

This will:
- Configure git repository on VPS
- Create post-receive hook for auto-deployment
- Set up automatic Docker rebuild and restart

## 🔧 Manual Setup (Alternative)

### Local Setup

1. **Add VPS as remote:**
```bash
git remote add vps root@72.62.51.50:/root/fayo
```

2. **Create post-commit hook:**
```bash
# Windows: .git/hooks/post-commit
# Linux/macOS: .git/hooks/post-commit

#!/bin/bash
git push vps HEAD:main 2>&1 || git push vps HEAD:master 2>&1
```

3. **Make it executable (Linux/macOS):**
```bash
chmod +x .git/hooks/post-commit
```

### VPS Setup

1. **SSH to VPS:**
```bash
ssh root@72.62.51.50
cd /root/fayo
```

2. **Initialize git (if not already):**
```bash
git init
git config receive.denyCurrentBranch warn
```

3. **Create post-receive hook:**
```bash
cat > .git/hooks/post-receive << 'EOF'
#!/bin/bash
cd /root/fayo
unset GIT_DIR
git checkout -f

# Rebuild and restart Docker services
docker compose -f docker-compose.prod.yml down --remove-orphans || true
docker compose -f docker-compose.prod.yml build --no-cache || true
docker compose -f docker-compose.prod.yml up -d
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
```bash
# Windows
del .git\hooks\post-commit

# Linux/macOS
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

### Docker Not Restarting

Check if Docker Compose is available:
```bash
ssh root@72.62.51.50 "docker compose version"
```

If not, update the post-receive hook to use `docker-compose` instead.

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
# Example: Run migrations
docker compose exec user-service npm run prisma:migrate

# Example: Clear cache
docker compose exec admin-panel npm run cache:clear
```

## 🔒 Security Notes

- ✅ Uses SSH for secure transfer
- ✅ No passwords in scripts
- ⚠️  Ensure SSH keys are properly secured
- ⚠️  VPS should have firewall configured

## 📊 Comparison: Git Mirror vs GitHub Actions

| Feature | Git Mirror | GitHub Actions |
|---------|-----------|----------------|
| Speed | ⚡ Instant | 🐌 Slower (CI/CD overhead) |
| Setup | Simple | More complex |
| Cost | Free | Free (with limits) |
| Visibility | Local only | GitHub UI |
| Dependencies | SSH only | GitHub + SSH |

## 🎉 Benefits

1. **Faster Deployment** - Direct push, no CI/CD queue
2. **Simpler Setup** - No GitHub secrets needed
3. **More Control** - Full control over deployment process
4. **Offline Capable** - Works without internet (after initial setup)
5. **Cost Effective** - No GitHub Actions minutes used

## 📚 Additional Resources

- [Git Hooks Documentation](https://git-scm.com/docs/githooks)
- [SSH Key Setup Guide](./SSH_SETUP_QUICK.md)
- [VPS Deployment Guide](./MIGRATE_VPS.md)

