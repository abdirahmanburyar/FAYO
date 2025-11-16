## FAYO Call Service

This NestJS microservice issues Agora RTC tokens, tracks voice/video call sessions, and broadcasts real-time updates over WebSockets, Kafka, and RabbitMQ.

### Features

- Create/join/cancel call sessions with REST endpoints (`/api/v1/calls/...`)
- Issue short-lived Agora tokens for each participant
- WebSocket gateway (`/ws/calls`) for invitations, status, and control events
- Kafka producer for analytic streams (`calls.events`)
- RabbitMQ publisher/subscriber for command bus integration
- Prisma/PostgreSQL persistence with dedicated `call` schema

### Getting Started

```bash
cd services/call-service
npm install
npx prisma migrate dev
npm run start:dev
```

Configure environment variables via `env.example` (copy to `.env`). At minimum set:

- `DATABASE_URL`
- `JWT_SECRET`
- `AGORA_APP_ID` / `AGORA_APP_CERTIFICATE`
- `KAFKA_BROKERS`
- `RABBITMQ_URI`

### Testing WebSocket

Connect to `ws://localhost:3010/ws/calls?token=<JWT>` and listen for:

- `call_invitation`
- `call_status`
- `call_command`

Emit events:

- `join_call` `{ sessionId }`
- `request_token` `{ sessionId, role }`
- `call_status` `{ sessionId, status }`

