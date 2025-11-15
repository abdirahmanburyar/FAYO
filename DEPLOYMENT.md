# FAYO System - Deployment Guide

This guide explains how to deploy the FAYO system to the production VPS using Docker and GitHub Actions.

## 🚀 Quick Start

### Prerequisites

- GitHub repository with the FAYO codebase
- Access to the VPS (31.97.58.62)
- SSH access to the VPS

## 📋 Deployment Methods

### Method 1: GitHub Actions (Recommended)

GitHub Actions will automatically deploy to the VPS when you push to the `main` or `master` branch.

#### Step 1: Set up SSH Key for GitHub Actions

**On Linux/macOS:**
```bash
chmod +x scripts/setup-ssh-key.sh
./scripts/setup-ssh-key.sh
```

**On Windows:**
```powershell
.\scripts\setup-ssh-key.ps1
```

This script will:
- Generate an SSH key pair
- Copy the public key to the VPS
- Display the private key that you need to add to GitHub Secrets

#### Step 2: Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Name: `VPS_SSH_PRIVATE_KEY`
5. Value: Paste the entire private key content (from the setup script output)
6. Click **Add secret**

#### Step 3: Deploy

Simply push to the `main` or `master` branch:

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

GitHub Actions will automatically:
- Build and test the code
- Copy files to the VPS
- Build Docker images
- Deploy all services
- Verify service health

### Method 2: Manual Deployment

If you prefer to deploy manually or for initial setup:

**On Linux/macOS:**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**On Windows:**
You can use Git Bash or WSL to run the deploy script, or manually execute the commands.

## 🐳 Docker Services

The system consists of the following services:

### Infrastructure Services
- **PostgreSQL** (Port 5432) - Database
- **Redis** (Port 6379) - Caching
- **RabbitMQ** (Ports 5672, 15672) - Message Queue
- **Kafka** (Port 9092) - Event Streaming
- **Zookeeper** (Port 2181) - Kafka coordination

### Application Services
- **Admin Panel** (Port 3000) - Next.js web interface
- **Gateway** (Port 3006) - API Gateway
- **User Service** (Port 3001) - User management
- **Hospital Service** (Port 3002) - Hospital management
- **Doctor Service** (Port 3003) - Doctor management
- **Shared Service** (Port 3004) - Categories and utilities
- **Appointment Service** (Port 3005) - Appointment scheduling
- **Notification Worker** (Port 3007) - Background notifications

## 🌐 Production URLs

After deployment, services are available at:

- **Admin Panel**: http://31.97.58.62:3000
- **API Gateway**: http://31.97.58.62:3006
- **User Service**: http://31.97.58.62:3001
- **Hospital Service**: http://31.97.58.62:3002
- **Doctor Service**: http://31.97.58.62:3003
- **Shared Service**: http://31.97.58.62:3004
- **Appointment Service**: http://31.97.58.62:3005
- **Notification Worker**: http://31.97.58.62:3007

## ⚙️ Configuration

### Environment Variables

The deployment creates a `.env` file at `/opt/fayo/.env` on the VPS. You should update this file with production values:

```bash
ssh root@31.97.58.62
cd /opt/fayo
nano .env
```

Important variables to configure:
- `JWT_SECRET` - Change to a strong secret
- `POSTGRES_PASSWORD` - Change the database password
- `EMAIL_USER` and `EMAIL_PASS` - Email service credentials
- `SMS_API_KEY` and `SMS_API_URL` - SMS service credentials
- `KEYCLOAK_*` - Keycloak configuration if using

After updating `.env`, restart the services:

```bash
cd /opt/fayo
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Management Commands

### View Logs

```bash
ssh root@31.97.58.62
cd /opt/fayo

# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f user-service
```

### Restart Services

```bash
ssh root@31.97.58.62
cd /opt/fayo
docker-compose -f docker-compose.prod.yml restart
```

### Stop Services

```bash
ssh root@31.97.58.62
cd /opt/fayo
docker-compose -f docker-compose.prod.yml down
```

### Start Services

```bash
ssh root@31.97.58.62
cd /opt/fayo
docker-compose -f docker-compose.prod.yml up -d
```

### Check Service Status

```bash
ssh root@31.97.58.62
cd /opt/fayo
docker-compose -f docker-compose.prod.yml ps
```

### View Resource Usage

```bash
ssh root@31.97.58.62
docker stats
```

## 🔄 Updating Services

### Automatic (via GitHub Actions)

Just push to the main branch - GitHub Actions will handle the deployment.

### Manual Update

1. Pull latest code on your local machine
2. Run the deploy script again:
   ```bash
   ./scripts/deploy.sh
   ```

Or manually:

```bash
# SSH to VPS
ssh root@31.97.58.62

# Navigate to deployment directory
cd /opt/fayo

# Pull latest code (if using git) or copy files manually
# Then rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## 🗄️ Database Management

### Backup Database

```bash
ssh root@31.97.58.62
docker exec fayo-postgres pg_dump -U postgres fayo > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database

```bash
ssh root@31.97.58.62
docker exec -i fayo-postgres psql -U postgres fayo < backup_file.sql
```

## 🔍 Troubleshooting

### Services not starting

1. Check logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs
   ```

2. Check if ports are already in use:
   ```bash
   netstat -tulpn | grep -E '3000|3001|3002|3003|3004|3005|3006|3007|5432|6379'
   ```

3. Check Docker resources:
   ```bash
   docker system df
   docker system prune  # Clean up if needed
   ```

### Connection issues

1. Verify firewall settings on the VPS
2. Check that required ports are open
3. Verify service health endpoints:
   ```bash
   curl http://31.97.58.62:3001/api/v1/health
   ```

### Database connection errors

1. Ensure PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   ```

2. Check database logs:
   ```bash
   docker logs fayo-postgres
   ```

3. Verify DATABASE_URL in .env file

## 📝 Notes

- The VPS IP is hardcoded as `31.97.58.62` in the configuration files
- All services run in Docker containers
- Data persistence is handled via Docker volumes
- Services automatically restart on failure (restart: unless-stopped)
- Health checks are configured for all services

## 🔐 Security Recommendations

1. **Change default passwords** in the `.env` file
2. **Use strong JWT_SECRET** - generate a random string
3. **Configure firewall** to only allow necessary ports
4. **Set up SSL/TLS** certificates (consider using Nginx as reverse proxy)
5. **Regular backups** of the database
6. **Monitor logs** for suspicious activity
7. **Keep Docker and system updated**

## 📞 Support

For issues or questions, check:
- Service logs: `docker-compose logs`
- GitHub Actions logs: Repository > Actions tab
- System resources: `docker stats`

