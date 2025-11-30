# FAYO Healthcare App - Complete Setup Guide

## 🚀 Phase 1 Implementation Complete!

This guide will help you set up and run the complete FAYO Healthcare microservices architecture.

## 📋 Prerequisites

- **Node.js**: v22.17.1 (use `.nvmrc` file)
- **Docker & Docker Compose**: Latest version
- **Flutter**: >=3.0.0 (for mobile app)
- **Git**: For version control

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Flutter App   │    │   React Web     │
│   (Mobile)      │    │   (Admin)       │    │   (Port 3000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  User Service   │    │ Appointment     │    │ Notification    │
│  (Port 3001)    │    │ Service         │    │ Worker          │
│                 │    │ (Port 3002)     │    │ (Port 3004)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     Redis       │    │   RabbitMQ      │
│   (Port 5432)   │    │   (Port 6379)   │    │  (Port 5672)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐
│     Kafka       │    │   Zookeeper     │
│   (Port 9092)   │    │  (Port 2181)    │
└─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Start Infrastructure Services

```bash
# Start all infrastructure services
docker-compose up -d

# Check service status
docker-compose ps
```

### 2. Setup User Service

```bash
cd services/user-service

# Copy environment file
cp env.example .env

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start the service
npm run start:dev
```

### 3. Setup Appointment Service

```bash
cd services/appointment-service

# Copy environment file
cp env.example .env

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start the service
npm run start:dev
```

### 4. Setup Notification Worker

```bash
cd services/notification-worker

# Copy environment file
cp env.example .env

# Install dependencies
npm install

# Start the service
npm run start:dev
```


### 6. Setup Flutter App

```bash
cd mobile/flutter_app

# Install dependencies
flutter pub get

# Run the app
flutter run
```

## 🔧 Service Configuration

### Environment Variables

Each service has its own `.env` file. Key configurations:

#### User Service
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fayo?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
PORT=3001
```

#### Appointment Service
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fayo?schema=public"
KAFKA_BROKER=localhost:9092
PORT=3002
```

```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
USER_SERVICE_URL=http://72.62.51.50:3001
APPOINTMENT_SERVICE_URL=http://localhost:3002
```

## 🧪 Testing the Services

### 1. Test Infrastructure

```bash
# Check PostgreSQL
docker exec -it fayoai-app-postgres-1 psql -U postgres -d fayo -c "SELECT version();"

# Check Redis
docker exec -it fayoai-app-redis-1 redis-cli ping

# Check Kafka
docker exec -it fayoai-app-kafka-1 kafka-topics.sh --bootstrap-server localhost:9092 --list
```

### 2. Test User Service

```bash
# Generate OTP
curl -X POST http://72.62.51.50:3001/api/v1/otp/generate \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'

# Verify OTP
curl -X POST http://72.62.51.50:3001/api/v1/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "code": "123456"}'

# Login with OTP
curl -X POST http://72.62.51.50:3001/api/v1/auth/login/otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "code": "123456"}'
```

### 3. Test Appointment Service

```bash
# Create appointment
curl -X POST http://localhost:3002/api/v1/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "user123",
    "scheduledAt": "2024-01-15T10:00:00Z",
    "specialty": "cardiology"
  }'

# Get appointments
curl http://localhost:3002/api/v1/appointments
```

### 4. Test Services

```bash
# Test health check
curl http://localhost:3000/api/v1/health

# Test user service directly
curl http://localhost:3000/api/v1/users
```

## 📱 Mobile App Testing

1. **Start the Flutter app**:
   ```bash
   cd mobile/flutter_app
   flutter run
   ```

2. **Test OTP Flow**:
   - Enter a phone number
   - Use any 6-digit code (simulation mode)
   - Verify the OTP
   - Access the home screen

## 🔍 Monitoring & Debugging

### Service Health Checks
- **User Service**: http://72.62.51.50:3001/api/v1/health
- **Appointment Service**: http://localhost:3002/api/v1/health
- **Notification Worker**: http://localhost:3004/api/v1/health

### Service Logs
```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f postgres
docker-compose logs -f kafka
```

### Database Access
```bash
# PostgreSQL
docker exec -it fayoai-app-postgres-1 psql -U postgres -d fayo

# Redis
docker exec -it fayoai-app-redis-1 redis-cli
```

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000-3004, 5432, 6379, 9092 are available
2. **Database connection**: Check PostgreSQL is running and accessible
3. **Kafka issues**: Ensure Zookeeper is running before Kafka

### Reset Everything
```bash
# Stop all services
docker-compose down -v

# Remove all containers and volumes
docker system prune -a

# Start fresh
docker-compose up -d
```

## 📊 Service Endpoints

### User Service (Port 3001)
- `POST /api/v1/otp/generate` - Generate OTP
- `POST /api/v1/otp/verify` - Verify OTP
- `POST /api/v1/auth/login/otp` - Login with OTP
- `POST /api/v1/auth/register` - Register user
- `GET /api/v1/users` - List users
- `GET /api/v1/users/:id` - Get user by ID

### Appointment Service (Port 3002)
- `POST /api/v1/appointments` - Create appointment
- `GET /api/v1/appointments` - List appointments
- `GET /api/v1/appointments/:id` - Get appointment by ID
- `POST /api/v1/triage` - Create triage request
- `POST /api/v1/triage/predict` - Predict specialty


## 🎯 Next Steps

1. **Complete React Web App**: Build admin dashboard
2. **Add Authentication**: Implement proper JWT validation
3. **Database Optimization**: Add indexes and constraints
4. **Monitoring**: Add Prometheus and Grafana
5. **Testing**: Add comprehensive test suites
6. **CI/CD**: Set up automated deployment
7. **Security**: Add rate limiting and security headers
8. **Documentation**: Add API documentation with Swagger

## 📞 Support

For issues and questions:
1. Check the service logs
2. Verify environment variables
3. Ensure all dependencies are installed
4. Check network connectivity between services

---

**🎉 Congratulations! You now have a complete microservices healthcare platform running!**
