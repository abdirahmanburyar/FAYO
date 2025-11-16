# FAYO AI Shared Service

A microservice for managing common data across the FAYO AI healthcare platform, including medical specialties, categories, and system settings.

## Overview

The Shared Service provides centralized management of data that is used across multiple microservices in the FAYO AI ecosystem. This includes:

- **Medical Specialties**: Comprehensive list of medical specialties with categories
- **Categories**: Organizational groupings for specialties and other data
- **System Settings**: Common configuration and settings
- **Reference Data**: Standardized data used across the platform

## Features

### 🏥 Medical Specialties Management
- **Comprehensive Database**: 40+ medical specialties across multiple categories
- **Categorized Organization**: Specialties grouped by medical fields (Internal Medicine, Surgery, Pediatrics, etc.)
- **Active/Inactive Status**: Enable/disable specialties as needed
- **Search and Filter**: Advanced filtering by category and status
- **API Endpoints**: RESTful API for all CRUD operations

### 📊 Categories Management
- **Dynamic Categories**: Manage specialty categories
- **Hierarchical Organization**: Support for nested category structures
- **Status Management**: Enable/disable categories

### 🔧 System Features
- **RESTful API**: Complete CRUD operations for all entities (HTTP-only, no message queue)
- **Swagger Documentation**: Interactive API documentation
- **Rate Limiting**: Built-in protection against abuse
- **Security**: JWT authentication and CORS protection
- **Health Checks**: Monitoring and health status endpoints
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis integration for performance
- **Simple Architecture**: HTTP-based communication for easy integration

## API Endpoints

### Specialties

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/specialties` | Get all specialties |
| `GET` | `/api/v1/specialties?category=Internal Medicine` | Get specialties by category |
| `GET` | `/api/v1/specialties?includeInactive=true` | Include inactive specialties |
| `GET` | `/api/v1/specialties/categories` | Get all categories |
| `GET` | `/api/v1/specialties/stats` | Get specialty statistics |
| `GET` | `/api/v1/specialties/:id` | Get specialty by ID |
| `POST` | `/api/v1/specialties` | Create new specialty |
| `PATCH` | `/api/v1/specialties/:id` | Update specialty |
| `DELETE` | `/api/v1/specialties/:id` | Delete specialty |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/categories` | Get all active categories |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Health check endpoint |

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Installation

1. **Clone and navigate to the service:**
   ```bash
   cd services/shared-service
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database:**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed initial data
   npm run db:seed
   ```

5. **Start the service:**
   ```bash
   # Development
   npm run start:dev
   
   # Production
   npm run start:prod
   ```

### Docker

```bash
# Build the image
docker build -t fayo-shared-service .

# Run the container
docker run -p 3004:3004 \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/fayo_shared" \
  -e REDIS_HOST="host.docker.internal" \
  fayo-shared-service
```

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fayo_shared?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=1h

# Server
PORT=3004
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Database Schema

### Specialties Table

```sql
CREATE TABLE specialties (
  id          TEXT PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  description TEXT,
  category    TEXT NOT NULL,
  isActive    BOOLEAN DEFAULT true,
  createdAt   TIMESTAMP DEFAULT NOW(),
  updatedAt   TIMESTAMP DEFAULT NOW()
);
```

### Categories Table

```sql
CREATE TABLE categories (
  id          TEXT PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  description TEXT,
  isActive    BOOLEAN DEFAULT true,
  createdAt   TIMESTAMP DEFAULT NOW(),
  updatedAt   TIMESTAMP DEFAULT NOW()
);
```

## Usage Examples

### Get All Specialties

```bash
curl -X GET "http://localhost:3004/api/v1/specialties" \
  -H "Content-Type: application/json"
```

### Get Specialties by Category

```bash
curl -X GET "http://localhost:3004/api/v1/specialties?category=Internal Medicine" \
  -H "Content-Type: application/json"
```

### Create New Specialty

```bash
curl -X POST "http://localhost:3004/api/v1/specialties" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Cardiothoracic Surgery",
    "description": "Surgery of the heart and chest",
    "category": "Surgery",
    "isActive": true
  }'
```

### Get Categories

```bash
curl -X GET "http://localhost:3004/api/v1/specialties/categories" \
  -H "Content-Type: application/json"
```

## Frontend Integration

### Next.js Admin Panel

The shared service is integrated with the Next.js admin panel:

```typescript
import { specialtiesApi } from '@/services/specialtiesApi';

// Get specialties for select dropdown
const specialties = await specialtiesApi.getSpecialtiesForSelect();

// Get specialties by category
const cardiologySpecialties = await specialtiesApi.getSpecialties('Internal Medicine');

// Get all categories
const categories = await specialtiesApi.getCategories();
```

### Searchable Select Component

```tsx
import { SearchableSelect } from '@/components/ui';

<SearchableSelect
  options={specialties}
  value={selectedSpecialty}
  onChange={setSelectedSpecialty}
  placeholder="Select specialty..."
  searchPlaceholder="Search specialties..."
  loading={loading}
  allowClear
/>
```

## Medical Specialties Included

### Internal Medicine
- Cardiology
- Neurology
- Gastroenterology
- Endocrinology
- Pulmonology
- Nephrology
- Rheumatology
- Hematology
- Oncology
- Infectious Diseases

### Surgery
- General Surgery
- Cardiothoracic Surgery
- Neurosurgery
- Orthopedic Surgery
- Plastic Surgery
- Pediatric Surgery
- Vascular Surgery
- Urological Surgery
- Gynecological Surgery
- Ophthalmological Surgery

### Pediatrics
- Pediatric Cardiology
- Pediatric Neurology
- Neonatology
- Pediatric Endocrinology
- Pediatric Gastroenterology
- Pediatric Oncology
- Pediatric Pulmonology
- Adolescent Medicine

### Emergency Medicine
- Emergency Medicine
- Critical Care Medicine
- Trauma Surgery
- Anesthesiology

### Mental Health
- Psychiatry
- Child Psychiatry
- Geriatric Psychiatry

### Diagnostic
- Radiology
- Pathology
- Laboratory Medicine

### Other Specialties
- Dermatology
- Ophthalmology
- Otolaryngology
- Obstetrics and Gynecology
- Urology
- Physical Medicine and Rehabilitation
- Family Medicine
- Internal Medicine

## Development

### Project Structure

```
src/
├── common/
│   └── prisma/
│       ├── prisma.service.ts
│       └── prisma.module.ts
├── specialties/
│   ├── dto/
│   │   ├── create-specialty.dto.ts
│   │   ├── update-specialty.dto.ts
│   │   └── index.ts
│   ├── entities/
│   │   └── specialty.entity.ts
│   ├── specialties.controller.ts
│   ├── specialties.service.ts
│   └── specialties.module.ts
├── categories/
│   ├── categories.controller.ts
│   ├── categories.service.ts
│   └── categories.module.ts
├── health/
│   ├── health.controller.ts
│   └── health.module.ts
├── app.module.ts
└── main.ts
```

### Available Scripts

```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debug mode

# Building
npm run build              # Build for production
npm run start:prod         # Start production build

# Database
npm run db:generate        # Generate Prisma client
npm run db:push           # Push schema to database
npm run db:migrate        # Run migrations
npm run db:seed           # Seed initial data

# Testing
npm run test              # Run unit tests
npm run test:watch        # Run tests in watch mode
npm run test:cov          # Run tests with coverage
npm run test:e2e          # Run end-to-end tests

# Code Quality
npm run lint              # Run ESLint
npm run format            # Format code with Prettier
```

## API Documentation

Once the service is running, visit:
- **Swagger UI**: http://localhost:3004/api/docs
- **Health Check**: http://localhost:3004/api/v1/health

## Monitoring and Health Checks

The service includes comprehensive health monitoring:

- **Health Endpoint**: `/api/v1/health`
- **Database Connectivity**: Automatic health checks
- **Redis Connectivity**: Cache health monitoring
- **Rate Limiting**: Built-in protection
- **Error Handling**: Comprehensive error responses

## Security

- **JWT Authentication**: Secure API access
- **CORS Protection**: Configurable cross-origin requests
- **Rate Limiting**: 100 requests per minute per IP
- **Input Validation**: Comprehensive request validation
- **Helmet**: Security headers

## Performance

- **Redis Caching**: High-performance data caching
- **Database Indexing**: Optimized queries
- **Connection Pooling**: Efficient database connections
- **Compression**: Response compression
- **Rate Limiting**: Prevents abuse

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is part of the FAYO AI healthcare platform and is proprietary software.

## Support

For support and questions:
- Create an issue in the repository
- Contact the FAYO AI development team
- Check the API documentation at `/api/docs`