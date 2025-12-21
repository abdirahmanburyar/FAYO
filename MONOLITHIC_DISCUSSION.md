# Monolithic Migration - Discussion & Planning

## Current Architecture (Microservices)

### Services Overview
```
┌─────────────────┐
│  user-service   │ :3001 - Authentication, Users, OTP
│  hospital-svc   │ :3002 - Hospitals, Services
│  doctor-service │ :3003 - Doctors, Specialties
│  specialty-svc  │ :3004 - Medical Specialties
│  appointment-svc│ :3005 - Appointments, Scheduling
│  payment-service│ :3006 - Payments (Appointments & Ads)
│  ads-service    │ :3007 - Advertisements
└─────────────────┘
```

### Current Communication
- **HTTP/REST**: Services call each other via HTTP (e.g., appointment-service → user-service)
- **RabbitMQ**: Event-driven communication
- **Redis**: Caching, session storage
- **PostgreSQL**: Each service has its own database/schema

### Current Memory Usage
- 7 Node.js processes (one per service)
- ~4.1GB total memory (after optimization)
- Each service: 192MB - 384MB

---

## Proposed Monolithic Architecture

### Single Service
```
┌─────────────────────────────────────┐
│         api-service :3001            │
│  ┌───────────────────────────────┐  │
│  │  All Modules Combined:        │  │
│  │  - UsersModule                │  │
│  │  - HospitalsModule           │  │
│  │  - DoctorsModule             │  │
│  │  - SpecialtiesModule         │  │
│  │  - AppointmentsModule        │  │
│  │  - PaymentsModule            │  │
│  │  - AdsModule                 │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Communication Changes
- **Direct imports**: Services call each other via TypeScript imports
- **Same process**: No network calls between modules
- **Shared instances**: Services can share Prisma clients, Redis, etc.

---

## Key Questions to Answer

### 1. Database Strategy
**Option A: Keep Separate Databases** (Current)
- Each service keeps its own database
- Pros: Data isolation, easier to split later
- Cons: More connections, complex transactions

**Option B: Single Database, Separate Schemas** (Recommended)
- All services in one database, different schemas
- Pros: Easier transactions, single connection pool
- Cons: All data in one place

**Option C: Single Database, Single Schema**
- Merge all tables into one schema
- Pros: Simplest
- Cons: Harder to maintain, potential conflicts

**Which do you prefer?**

### 2. Inter-Service Communication
Currently services call each other via HTTP:
```typescript
// Current (appointment-service calling user-service)
const user = await this.httpService.get('http://user-service:3001/api/v1/users/123')
```

**Proposed: Direct Service Injection**
```typescript
// Monolithic (direct import)
constructor(private usersService: UsersService) {}
const user = await this.usersService.findOne('123')
```

**Questions:**
- Are there any external services that need to call individual services?
- Do we need to maintain backward compatibility with existing API endpoints?

### 3. WebSocket/Real-time
Some services use WebSocket (ads-service, possibly others):
- How should we handle multiple WebSocket namespaces?
- Should we keep separate gateways or merge them?

### 4. Deployment Strategy
**Option A: Big Bang Migration**
- Build everything, deploy all at once
- Pros: Clean cutover
- Cons: High risk

**Option B: Gradual Migration**
- Keep microservices running, gradually migrate modules
- Pros: Lower risk, can rollback
- Cons: Temporary complexity

**Which approach do you prefer?**

### 5. Code Organization
**Option A: Feature-based**
```
src/
  users/
    users.module.ts
    users.service.ts
    users.controller.ts
  hospitals/
    hospitals.module.ts
    ...
```

**Option B: Service-based (then feature)**
```
src/
  user-service/
    users/
    auth/
  hospital-service/
    hospitals/
    services/
```

**Which structure do you prefer?**

---

## Benefits of Monolithic

### ✅ Advantages
1. **Memory Efficiency**: Single process (~512MB-1GB vs 4GB+)
2. **Simpler Deployment**: One container instead of 7
3. **Faster Communication**: No network latency between services
4. **Easier Debugging**: Single codebase, unified logging
5. **Simpler Development**: No need to run multiple services locally
6. **Transaction Support**: Can do cross-service transactions easily
7. **Reduced Complexity**: No service discovery, API gateways needed

### ❌ Disadvantages
1. **Single Point of Failure**: If app crashes, all services down
2. **Scaling**: Can't scale individual services independently
3. **Larger Codebase**: All code in one place (harder to navigate)
4. **Deployment**: Must redeploy entire app for any change
5. **Team Collaboration**: Multiple developers working on same codebase
6. **Technology Lock-in**: All services must use same Node.js version

---

## Migration Complexity

### Easy Parts ✅
- Module structure is already modular
- Services use NestJS (same framework)
- Database schemas are separate (easy to keep)

### Challenging Parts ⚠️
- **HTTP Service Calls**: Need to replace with direct imports
- **Environment Variables**: Consolidate all service configs
- **Docker Setup**: Update docker-compose
- **Admin Panel**: Update all service URLs
- **Testing**: Update test setup
- **Prisma**: Multiple Prisma clients or unified?

---

## Recommended Approach

### Phase 1: Preparation (1-2 days)
1. Create new `api-service` structure
2. Set up base configuration
3. Create unified main.ts

### Phase 2: Module Migration (3-5 days)
1. Start with independent modules (specialty, ads)
2. Migrate dependent modules (doctors, hospitals)
3. Migrate complex modules (appointments, payments)
4. Migrate user-service last (most dependencies)

### Phase 3: Integration (2-3 days)
1. Replace HTTP calls with direct imports
2. Update database connections
3. Merge environment variables
4. Update WebSocket gateways

### Phase 4: Testing & Deployment (2-3 days)
1. Update docker-compose
2. Test all endpoints
3. Update admin-panel URLs
4. Deploy and monitor

**Total Estimated Time: 8-13 days**

---

## Questions for You

1. **Database Strategy**: Keep separate databases or merge?
2. **Migration Approach**: Big bang or gradual?
3. **Code Organization**: Feature-based or service-based?
4. **Timeline**: When do you need this done?
5. **Backward Compatibility**: Do we need to maintain old endpoints?
6. **External Dependencies**: Any external services calling individual endpoints?
7. **WebSocket**: How should we handle real-time features?

---

## Alternative: Hybrid Approach

We could also do a **hybrid approach**:
- Keep critical services separate (user-service, payment-service)
- Merge related services (hospitals + doctors + specialties)
- Merge simple services (ads + specialty)

This gives some benefits of monolithic while maintaining some isolation.

**What do you think about this approach?**

---

## Next Steps

Once we decide on:
1. Database strategy
2. Migration approach
3. Code organization
4. Timeline

I'll create a detailed implementation plan and start the migration.

**What are your thoughts on these questions?**

