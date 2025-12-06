# FAYO AI - Healthcare Management System

A comprehensive microservices-based healthcare management system built with NestJS, Next.js, and Flutter.

## 🏗️ Architecture

### Infrastructure Services (Docker Compose)
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage
- **RabbitMQ** - Message queuing and event streaming

### Application Services (Dockerfiles)
Each service has its own Dockerfile and can be built/run independently:

| Service | Port | Description | Dockerfile |
|---------|------|-------------|------------|
| **user-service** | 3001 | User management, authentication, OTP | ✅ |
| **hospital-service** | 3002 | Hospital and clinic management | ✅ |
| **doctor-service** | 3003 | Doctor profiles and specialties | ✅ |
| **admin-panel** | 3000 | Next.js web admin interface | ✅ |

### Mobile App
- **Flutter App** - Cross-platform mobile application

## 🚀 Quick Start

### 1. Start Infrastructure
```bash
# Start databases and message queues
docker-compose up -d
```

### 2. Build All Services
```bash
# Linux/Mac
./scripts/build-services.sh

# Windows
scripts\build-services.bat
```

### 3. Run Individual Services
```bash
# User Service
docker run -p 3001:3001 fayo-user-service

# Hospital Service
docker run -p 3002:3002 fayo-hospital-service

# Doctor Service
docker run -p 3003:3003 fayo-doctor-service

# Admin Panel
docker run -p 3000:3000 fayo-admin-panel
```

## 🛠️ Development

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Flutter SDK (for mobile development)

### Service Development
Each service can be developed independently:

```bash
# Navigate to service directory
cd services/user-service

# Install dependencies
npm install

# Run migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

### Database Setup
Each service has its own database:
- `user_service` - User data
- `hospital_service` - Hospital data
- `doctor_service` - Doctor data
- `shared_service` - Categories and utilities

## 📁 Project Structure

```
FAYO AI - APP/
├── services/                 # Backend microservices
│   ├── user-service/        # User management
│   ├── hospital-service/    # Hospital management
│   ├── doctor-service/      # Doctor management
├── web/
│   └── admin-panel/         # Next.js admin interface
├── mobile/
│   └── flutter_app/         # Flutter mobile app
├── scripts/                 # Build and deployment scripts
├── docker-compose.yml       # Infrastructure services
└── README.md
```

## 🔧 Configuration

### Environment Variables
Each service has its own `.env.example` file with required configuration.

### Database URLs
- User Service: `postgresql://postgres:postgres@localhost:5432/user_service`
- Hospital Service: `postgresql://postgres:postgres@localhost:5432/hospital_service`
- Doctor Service: `postgresql://postgres:postgres@localhost:5432/doctor_service`
- Shared Service: `postgresql://postgres:postgres@localhost:5432/shared_service`

## 🚀 Deployment

### Production Build
```bash
# Build all services
./scripts/build-services.sh

# Deploy with Docker Swarm or Kubernetes
docker stack deploy -c docker-compose.yml fayo-ai
```

### Individual Service Deployment
```bash
# Build specific service
docker build -t fayo-user-service ./services/user-service

# Run with environment variables
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  fayo-user-service
```

## 📚 API Documentation

### Service Endpoints
- **User Service**: `http://72.62.51.50:3001/api/v1`
- **Hospital Service**: `http://localhost:3002/api/v1`
- **Doctor Service**: `http://localhost:3003/api/v1`
- **Shared Service**: `http://localhost:3004/api/v1`
- **Call Service**: `http://localhost:3010/api/v1`
- **Admin Panel**: `http://localhost:3000`

### Health Checks
- User Service: `http://72.62.51.50:3001/health`
- Hospital Service: `http://localhost:3002/health`
- Doctor Service: `http://localhost:3003/health`
- Shared Service: `http://localhost:3004/health`
- Call Service: `http://localhost:3010/health`

## 📞 Agora Video Calling

### Documentation
- **Implementation Guide**: [`docs/AGORA_VIDEO_CALLING_GUIDE.md`](docs/AGORA_VIDEO_CALLING_GUIDE.md)
- **Usage Monitoring**: [`docs/AGORA_USAGE_MONITORING.md`](docs/AGORA_USAGE_MONITORING.md)
- **Premium Features**: [`docs/AGORA_PREMIUM_FEATURES.md`](docs/AGORA_PREMIUM_FEATURES.md)
- **Upgrade Checklist**: [`docs/AGORA_UPGRADE_CHECKLIST.md`](docs/AGORA_UPGRADE_CHECKLIST.md)
- **Quick Reference**: [`docs/AGORA_QUICK_REFERENCE.md`](docs/AGORA_QUICK_REFERENCE.md)

### Quick Links
- **Agora Console**: https://console.agora.io/
- **Usage Dashboard**: Check usage & billing in console
- **Free Tier**: 10,000 minutes/month (video or voice)
- **Pricing**: $3.99/1,000 min (video) or $0.99/1,000 min (voice) after free tier

## 🤝 Contributing

1. Each service is independent - work on one at a time
2. Follow the existing code structure and patterns
3. Add tests for new features
4. Update documentation as needed

## 📄 License

This project is proprietary software for FAYO AI.
