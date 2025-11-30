# CI/CD Setup Guide

This guide explains how to set up automated deployment to your VPS using GitHub Actions and Docker Compose.

## Prerequisites

1. ✅ VPS with SSH access
2. ✅ VPS password ready to add to GitHub Secrets

## Step 1: Add GitHub Secrets

Go to your GitHub repository and add the following secrets:

**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Required Secrets:

1. **`VPS_PASSWORD`**
   - Value: Your VPS root password (e.g., `Buryar@2020#`)

2. **`VPS_HOST`**
   - Value: Your VPS IP address (e.g., `72.62.51.50`)

## Step 2: Prepare VPS

On your VPS, ensure Docker and Docker Compose are installed:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

## Step 3: Create .env File on VPS

SSH to your VPS and create the `.env` file:

```bash
ssh root@72.62.51.50
mkdir -p /root/fayo
cd /root/fayo
nano .env
```

Add your environment variables (database passwords, JWT secrets, etc.). You can use `env.stack.example` as a reference (if it still exists) or create from scratch.

## Step 4: Test the Workflow

1. Push your code to the `main` or `master` branch
2. Go to **Actions** tab in GitHub
3. The workflow will automatically trigger
4. Monitor the deployment progress

## Manual Trigger

You can also manually trigger the workflow:
- Go to **Actions** → **Deploy to VPS** → **Run workflow**

## What the Workflow Does

1. ✅ Checks out your code
2. ✅ Sets up SSH connection to VPS
3. ✅ Copies files to VPS (excluding `.git`, `node_modules`, `dist`, `mobile`)
4. ✅ Builds Docker images using `docker-compose.prod.yml`
5. ✅ Starts all services
6. ✅ Runs database migrations
7. ✅ Cleans up unused Docker images
8. ✅ Verifies deployment

## Troubleshooting

### SSH Connection Fails
- Verify `VPS_PASSWORD` secret is correct
- Test SSH connection manually: `ssh root@YOUR_VPS_IP`
- Ensure password authentication is enabled on the VPS

### Build Fails
- Check Docker is installed on VPS
- Verify `.env` file exists on VPS
- Check service logs: `docker-compose -f docker-compose.prod.yml logs`

### Migration Fails
- Ensure database is running
- Check database connection string in `.env`
- Run migrations manually: `docker-compose -f docker-compose.prod.yml exec user-service npx prisma migrate deploy`

## Viewing Logs

SSH to your VPS and check logs:

```bash
# All services
docker-compose -f /root/fayo/docker-compose.prod.yml logs -f

# Specific service
docker-compose -f /root/fayo/docker-compose.prod.yml logs -f user-service
```

## Updating Services

Simply push to `main` or `master` branch - the workflow will automatically:
- Copy new code
- Rebuild images
- Restart services
- Run migrations if needed

