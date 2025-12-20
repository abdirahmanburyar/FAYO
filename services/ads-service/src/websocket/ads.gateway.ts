import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';

@WebSocketGateway({
  path: '/ws/ads',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 1e6, // 1MB max message size
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
  transports: ['websocket', 'polling'],
})
export class AdsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, OnModuleInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AdsGateway.name);

  afterInit(server: Server) {
    this.logger.log('✅ Ads WebSocket Gateway initialized');
  }

  onModuleInit() {
    this.logger.log('Ads Gateway module initialized');
  }

  private readonly maxConnections = 1000; // Limit concurrent connections
  private connectionCount = 0;

  handleConnection(client: Socket) {
    try {
      // Check connection limit
      if (this.connectionCount >= this.maxConnections) {
        this.logger.warn(`Connection limit reached (${this.maxConnections}), rejecting client: ${client.id}`);
        client.emit('error', {
          type: 'error',
          message: 'Server at capacity, please try again later',
        });
        client.disconnect(true);
        return;
      }

      this.connectionCount++;
      // Only log in development to reduce overhead in production
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`🔌 Client connected: ${client.id} (Total: ${this.connectionCount})`);
      }
      
      // Send connection confirmation
      client.emit('connected', {
        type: 'connected',
        message: 'Connected to ads updates',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('❌ Error handling WebSocket connection:', error);
      this.connectionCount = Math.max(0, this.connectionCount - 1);
    }
  }

  handleDisconnect(client: Socket) {
    try {
      this.connectionCount = Math.max(0, this.connectionCount - 1);
      // Only log in development to reduce overhead in production
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`🔌 Client disconnected: ${client.id} (Total: ${this.connectionCount})`);
      }
    } catch (error) {
      this.logger.error('❌ Error handling WebSocket disconnection:', error);
      this.connectionCount = Math.max(0, this.connectionCount - 1);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', {
      type: 'pong',
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('join_ads_updates')
  handleJoinAdsUpdates(@ConnectedSocket() client: Socket) {
    client.join('ads_updates');
    client.emit('joined_ads_updates', {
      type: 'joined_ads_updates',
      message: 'Joined ads updates room',
      timestamp: new Date().toISOString(),
    });
    // Only log in development to reduce overhead
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`Client ${client.id} joined ads_updates room`);
    }
  }

  // Listen to ad.created event
  @OnEvent('ad.created')
  handleAdCreated(ad: Prisma.AdGetPayload<{}>) {
    // Only log in development to reduce overhead
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`📢 Broadcasting ad.created event for ad: ${ad.id}`);
    }
    this.server.to('ads_updates').emit('ad.created', {
      type: 'ad.created',
      ad,
      timestamp: new Date().toISOString(),
    });
  }

  // Listen to ad.updated event
  @OnEvent('ad.updated')
  handleAdUpdated(ad: Prisma.AdGetPayload<{}>) {
    // Only log in development to reduce overhead
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`📢 Broadcasting ad.updated event for ad: ${ad.id}`);
    }
    this.server.to('ads_updates').emit('ad.updated', {
      type: 'ad.updated',
      ad,
      timestamp: new Date().toISOString(),
    });
  }

  // Listen to ad.deleted event
  @OnEvent('ad.deleted')
  handleAdDeleted(data: { id: string }) {
    // Only log in development to reduce overhead
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`📢 Broadcasting ad.deleted event for ad: ${data.id}`);
    }
    this.server.to('ads_updates').emit('ad.deleted', {
      type: 'ad.deleted',
      adId: data.id,
      timestamp: new Date().toISOString(),
    });
  }

  // Listen to ad.clicked event
  @OnEvent('ad.clicked')
  handleAdClicked(ad: Prisma.AdGetPayload<{}>) {
    // Only log in development to reduce overhead
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`📢 Broadcasting ad.clicked event for ad: ${ad.id}`);
    }
    this.server.to('ads_updates').emit('ad.clicked', {
      type: 'ad.clicked',
      ad,
      timestamp: new Date().toISOString(),
    });
  }
}

