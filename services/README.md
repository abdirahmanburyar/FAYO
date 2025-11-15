# FAYO Healthcare App - Microservices Architecture

## Phase 1 Implementation Status

### ✅ Completed Services

#### 1. User Service (`services/user-service/`)
- **Purpose**: Manages users/doctors, OTP authentication
- **Tech Stack**: NestJS, Prisma, PostgreSQL, Redis, JWT
- **Features**:
  - User CRUD operations
  - OTP generation and verification
  - JWT authentication
  - Redis caching for OTP
  - Role-based access (Patient, Doctor, Admin)
  - Doctor specialty management

#### 2. Infrastructure (Docker Compose)
- **Services**: PostgreSQL, Redis, RabbitMQ, Kafka, Zookeeper
- **Network**: Custom bridge network for service communication
- **Status**: All services configured and working

### 🚧 In Progress / To Complete

#### 3. Appointment Service (`services/appointment-service/`)
- **Purpose**: Manage appointments, publish events to Kafka
- **Status**: Basic structure created, needs completion
- **Required Features**:
  - Appointment CRUD operations
  - Kafka event publishing
  - Integration with User Service
  - Triage integration

#### 4. Triage Service (`services/triage-service/`)
- **Purpose**: Accept patient text, predict specialty, publish events
- **Status**: Needs creation
- **Required Features**:
  - Text analysis for symptom detection
  - Specialty prediction algorithm
  - Kafka event publishing
  - Integration with AI/ML models

#### 5. Gateway/BFF (`services/gateway/`)
- **Purpose**: Proxy requests, handle JWT authentication
- **Status**: Needs creation
- **Required Features**:
  - API Gateway functionality
  - JWT authentication
  - Token validation
  - Request routing
  - Rate limiting

#### 7. Flutter App (`mobile/flutter-app/`)
- **Purpose**: Mobile client with OTP login
- **Status**: Needs creation
- **Required Features**:
  - OTP login screens
  - Appointment booking
  - Doctor search
  - Profile management

#### 8. React App (`web/react-app/`)
- **Purpose**: Web client with JWT authentication
- **Status**: Needs creation
- **Required Features**:
  - JWT authentication
  - Admin dashboard
  - Doctor management
  - Analytics

## Quick Start

### 1. Start Infrastructure
```bash
docker-compose up -d
```

### 2. Setup User Service
```bash
cd services/user-service
cp env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### 3. Access Services
- **RabbitMQ**: http://localhost:15672 (guest/guest)
- **User Service**: http://localhost:3001
- **PostgreSQL**: localhost:5432 (postgres/postgres)
- **Redis**: localhost:6379
- **Kafka**: localhost:9092

## API Endpoints (User Service)

### Authentication
- `POST /api/v1/auth/login/otp` - Login with OTP
- `POST /api/v1/auth/register` - Register with OTP
- `POST /api/v1/auth/refresh` - Refresh token

### OTP Management
- `POST /api/v1/otp/generate` - Generate OTP
- `POST /api/v1/otp/verify` - Verify OTP
- `GET /api/v1/otp/status/:phone` - Check OTP status

### User Management
- `GET /api/v1/users` - List users
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create user
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user
- `GET /api/v1/users/doctors/:specialty` - Get doctors by specialty
- `GET /api/v1/users/profile/me` - Get current user profile

### Health Check
- `GET /api/v1/health` - Service health status

## Next Steps

1. Complete Appointment Service implementation
2. Create Triage Service with AI integration
3. Implement Gateway with JWT authentication
5. Create Flutter mobile app
6. Build React web dashboard
7. Add comprehensive testing
8. Implement monitoring and logging
9. Add CI/CD pipelines
10. Production deployment configuration

## Architecture Notes

- **Database**: Each service has its own database schema
- **Communication**: HTTP for sync, Kafka for async events, RabbitMQ for queues
- **Authentication**: JWT for all clients
- **Caching**: Redis for session and OTP storage
- **Monitoring**: Health checks implemented
- **Security**: Input validation, CORS, rate limiting ready
