# Monolithic Migration Guide

## Overview
Converting from microservices architecture to a monolithic NestJS application.

## Current Services
1. user-service (port 3001)
2. hospital-service (port 3002)
3. doctor-service (port 3003)
4. specialty-service (port 3004)
5. appointment-service (port 3005)
6. payment-service (port 3006)
7. ads-service (port 3007)

## New Structure
Single `api-service` that combines all modules:
- All modules in one application
- Single port (3001)
- Direct imports instead of HTTP calls
- Shared database connections
- Unified configuration

## Migration Steps

### Phase 1: Create Base Structure ✅
- [x] Create api-service directory
- [x] Set up base NestJS configuration
- [x] Create main.ts with unified bootstrap

### Phase 2: Migrate Modules
- [ ] Migrate user-service modules
- [ ] Migrate hospital-service modules
- [ ] Migrate doctor-service modules
- [ ] Migrate specialty-service modules
- [ ] Migrate appointment-service modules
- [ ] Migrate payment-service modules
- [ ] Migrate ads-service modules

### Phase 3: Update Dependencies
- [ ] Merge all package.json dependencies
- [ ] Update Prisma schemas (combine or keep separate)
- [ ] Update database connections

### Phase 4: Remove Inter-Service Communication
- [ ] Replace HTTP calls with direct service imports
- [ ] Update service dependencies
- [ ] Remove RabbitMQ inter-service messaging (keep for external)

### Phase 5: Update Infrastructure
- [ ] Update docker-compose.yml
- [ ] Create new Dockerfile
- [ ] Update environment variables
- [ ] Update admin-panel service URLs

## Benefits
- ✅ Reduced memory usage (single process)
- ✅ Simpler deployment
- ✅ No network latency between services
- ✅ Easier debugging
- ✅ Single codebase

## Considerations
- All services share same process (if one crashes, all crash)
- Larger codebase
- Need to handle database connections carefully
- WebSocket connections need to be unified

