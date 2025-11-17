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
            console.warn(`⚠️ [GATEWAY] Missing auth token for connection`);
            throw new Error('Missing auth token');
          }
          const payload = await this.jwtService.verifyAsync(token);
          const userId = payload.sub ?? payload.id;
          if (!userId) {
            console.warn(`⚠️ [GATEWAY] Missing user ID in token payload`);
            throw new Error('Invalid token: missing user ID');
          }
          
          // Disconnect any existing connections for this user to ensure uniqueness
          const userRoom = `user:${userId}`;
          const existingSockets = await this.server.in(userRoom).fetchSockets();
          if (existingSockets.length > 0) {
            console.log(`🔄 [GATEWAY] Disconnecting ${existingSockets.length} existing socket(s) for user ${userId}`);
            existingSockets.forEach((socket) => {
              if (socket.id !== client.id) {
                socket.emit('disconnected', { reason: 'New connection established' });
                socket.disconnect(true);
              }
            });
          }
          
          client.user = { id: userId, role: payload.role };
          client.join(userRoom);
          console.log(`✅ [GATEWAY] User ${userId} connected with socket ${client.id} and joined room: ${userRoom}`);
          client.emit('connected', { message: 'Connected to call service', userId });
        } catch (error) {
          console.error(`❌ [GATEWAY] Connection error:`, error);
          client.emit('error', { message: 'Unauthorized' });
          client.disconnect(true);
        }
      }

  async handleDisconnect(client: AuthedSocket) {
    if (client.user) {
      const userRoom = `user:${client.user.id}`;
      client.leave(userRoom);
      console.log(`👋 [GATEWAY] User ${client.user.id} disconnected from room: ${userRoom}`);
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
        const recipientRoom = `user:${session.recipientId}`;
        console.log(`📞 [GATEWAY] Emitting call_invitation to room: ${recipientRoom}`);
        console.log(`📞 [GATEWAY] Session details:`, {
          id: session.id,
          channelName: session.channelName,
          initiatorId: session.initiatorId,
          recipientId: session.recipientId,
          status: session.status,
        });
        
        // Check if anyone is in the recipient room
        const room = this.server.sockets.adapter.rooms.get(recipientRoom);
        if (room && room.size > 0) {
          console.log(`✅ [GATEWAY] Found ${room.size} socket(s) in room ${recipientRoom}`);
          this.server.to(recipientRoom).emit('call_invitation', session);
        } else {
          console.warn(`⚠️ [GATEWAY] No sockets found in room ${recipientRoom}. Recipient may not be connected.`);
        }
      } else {
        console.warn(`⚠️ [GATEWAY] Call session created without recipientId: ${session.id}`);
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
    // Try Authorization header first
    const auth = client.handshake.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      return auth.substring(7);
    }
    // Fallback to auth object (Socket.IO auth)
    const authToken = client.handshake.auth?.token;
    if (authToken && typeof authToken === 'string') {
      return authToken;
    }
    // Fallback to query parameter (for compatibility)
    const queryToken = client.handshake.query?.token;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }
    return null;
  }
}

