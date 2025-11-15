# Quick Start - Deployment Guide

## 🚀 Fastest Way to Deploy

### Step 1: Set up SSH Key (One-time setup)

**Linux/macOS:**
```bash
./scripts/setup-ssh-key.sh
```

**Windows:**
```powershell
.\scripts\setup-ssh-key.ps1
```

This will generate an SSH key and display the private key. Copy it.

### Step 2: Add GitHub Secret

1. Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`
2. Click **"New repository secret"**
3. Name: `VPS_SSH_PRIVATE_KEY`
4. Value: Paste the private key from Step 1
5. Click **"Add secret"**

### Step 3: Deploy!

Just push to main branch:
```bash
git push origin main
```

GitHub Actions will automatically deploy everything! 🎉

---

## 📋 What Gets Deployed

- ✅ All microservices (8 services)
- ✅ Infrastructure (PostgreSQL, Redis, RabbitMQ, Kafka)
- ✅ Admin Panel (Next.js)
- ✅ API Gateway

## 🌐 Access Your Services

After deployment, visit:
- **Admin Panel**: http://31.97.58.62:3000
- **API Gateway**: http://31.97.58.62:3006

## ⚙️ Configure Production Settings

SSH to your VPS and edit the environment file:

```bash
ssh root@31.97.58.62
cd /opt/fayo
nano .env
```

**Important:** Change these values:
- `JWT_SECRET` - Use a strong random string
- `POSTGRES_PASSWORD` - Change database password
- `EMAIL_USER` and `EMAIL_PASS` - Your email credentials
- `SMS_API_KEY` - Your SMS service key

Then restart:
```bash
docker-compose -f docker-compose.prod.yml restart
```

## 🔍 Check Deployment Status

View GitHub Actions: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`

Or check services on VPS:
```bash
ssh root@31.97.58.62
cd /opt/fayo
docker-compose -f docker-compose.prod.yml ps
```

## 📚 Full Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed information.

