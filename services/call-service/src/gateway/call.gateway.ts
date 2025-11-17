import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { CallsService } from '../calls/calls.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CallStatus } from '@prisma/client';
import { UpdateCallStatusDto } from '../calls/dto/update-call-status.dto';
import { RequestCallTokenDto } from '../calls/dto/request-call-token.dto';

interface AuthedSocket extends Socket {
  user?: {
    id: string;
    role?: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/ws/calls',
})
export class CallGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly callsService: CallsService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.registerEventListeners();
  }

  async handleConnection(client: AuthedSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        throw new Error('Missing auth token');
      }
      const payload = await this.jwtService.verifyAsync(token);
      client.user = { id: payload.sub ?? payload.id, role: payload.role };
      client.join(`user:${client.user.id}`);
      client.emit('connected', { message: 'Connected to call service' });
    } catch (error) {
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthedSocket) {
    if (client.user) {
      client.leave(`user:${client.user.id}`);
    }
  }

  @SubscribeMessage('join_call')
  async handleJoinCall(@ConnectedSocket() client: AuthedSocket, @MessageBody() payload: { sessionId: string }) {
    if (!client.user) return;
    const session = await this.callsService.getSessionForUser(payload.sessionId, client.user.id);
    client.join(`call:${session.id}`);
    client.emit('call_joined', { sessionId: session.id });
  }

  @SubscribeMessage('call_status')
  async handleStatusUpdate(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: UpdateCallStatusDto & { sessionId: string },
  ) {
    if (!client.user) return;
    const result = await this.callsService.updateStatus(payload.sessionId, client.user.id, payload.status);
    this.server.to(`call:${payload.sessionId}`).emit('call_status', result.session);
  }

  @SubscribeMessage('request_token')
  async handleTokenRequest(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { sessionId: string } & RequestCallTokenDto,
  ) {
    if (!client.user) return;
    const response = await this.callsService.issueToken(payload.sessionId, client.user.id, payload.role);
    client.emit('token_issued', response);
  }

  private registerEventListeners() {
    this.eventEmitter.on('call.session.created', (data: { session: any; credential?: any }) => {
      const { session } = data;
      if (session.recipientId) {
        // Emit to the recipient's user room
        this.server.to(`user:${session.recipientId}`).emit('call_invitation', session);
      }
    });

    this.eventEmitter.on('call.session.updated', (session) => {
      this.server.to(`call:${session.id}`).emit('call_status', session);
      if (session.status === CallStatus.COMPLETED || session.status === CallStatus.CANCELLED) {
        this.server.in(`call:${session.id}`).socketsLeave(`call:${session.id}`);
      }
    });

    this.eventEmitter.on('call.command', (command) => {
      this.server.emit('call_command', command);
    });
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      return auth.substring(7);
    }
    if (client.handshake.query?.token) {
      return String(client.handshake.query.token);
    }
    return null;
  }
}

