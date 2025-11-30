# VPS Migration Guide (Migrating to 72.62.51.50)

This guide outlines the steps to deploy FAYO Healthcare to your new VPS at `72.62.51.50`.

## 1. Codebase Updated
Your local codebase has already been updated with the new IP address (`72.62.51.50`) in all configuration files, including:
- `docker-compose.prod.yml`
- `scripts/setup-https.sh`
- `mobile/kmp/.../AppModule.kt`
- `web/admin-panel` configuration files

## 2. Connect to New VPS
Open your terminal and SSH into the new server:
```bash
ssh root@72.62.51.50
# Enter your password when prompted
```

## 3. Install Dependencies (If new server)
If this is a fresh server, run these commands to install Docker and Git:

```bash
# Update system
yum update -y  # For CentOS
# OR
apt update && apt upgrade -y # For Ubuntu/Debian

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Git
yum install -y git # CentOS
# OR
apt install -y git # Ubuntu
```

## 4. Transfer Files
You need to upload your updated code to the new VPS.
**From your local machine (Git Bash):**

```bash
# Option A: Using SCP (Copy files directly)
# Run this from your local project root (C:\FAYO)
scp -r . root@72.62.51.50:/root/fayo

# Option B: Using Git (If you pushed changes to a repo)
# ssh root@72.62.51.50
# git clone <your-repo-url> /root/fayo
```

## 5. Deploy Services
On the VPS (`ssh root@72.62.51.50`):

```bash
cd /root/fayo

# 1. Create Swap Memory (Prevents build crashes)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 2. Build and Start Services
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Setup Nginx & HTTPS (Optional, for SSL)
# ./scripts/setup-https.sh
```

## 6. Mobile App
Rebuild your mobile app to apply the new IP address:
```bash
# On local machine
./gradlew :androidApp:installDebug
```

