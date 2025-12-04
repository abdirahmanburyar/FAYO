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
import { Ad } from '@prisma/client';

@WebSocketGateway({
  path: '/ws/ads',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
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

  handleConnection(client: Socket) {
    try {
      this.logger.log(`🔌 Client connected: ${client.id}`);
      
      // Send connection confirmation
      client.emit('connected', {
        type: 'connected',
        message: 'Connected to ads updates',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('❌ Error handling WebSocket connection:', error);
    }
  }

  handleDisconnect(client: Socket) {
    try {
      this.logger.log(`🔌 Client disconnected: ${client.id}`);
    } catch (error) {
      this.logger.error('❌ Error handling WebSocket disconnection:', error);
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
    this.logger.log(`Client ${client.id} joined ads_updates room`);
  }

  // Listen to ad.created event
  @OnEvent('ad.created')
  handleAdCreated(ad: Ad) {
    this.logger.log(`📢 Broadcasting ad.created event for ad: ${ad.id}`);
    this.server.to('ads_updates').emit('ad.created', {
      type: 'ad.created',
      ad,
      timestamp: new Date().toISOString(),
    });
  }

  // Listen to ad.updated event
  @OnEvent('ad.updated')
  handleAdUpdated(ad: Ad) {
    this.logger.log(`📢 Broadcasting ad.updated event for ad: ${ad.id}`);
    this.server.to('ads_updates').emit('ad.updated', {
      type: 'ad.updated',
      ad,
      timestamp: new Date().toISOString(),
    });
  }

  // Listen to ad.deleted event
  @OnEvent('ad.deleted')
  handleAdDeleted(data: { id: string }) {
    this.logger.log(`📢 Broadcasting ad.deleted event for ad: ${data.id}`);
    this.server.to('ads_updates').emit('ad.deleted', {
      type: 'ad.deleted',
      adId: data.id,
      timestamp: new Date().toISOString(),
    });
  }

  // Listen to ad.clicked event
  @OnEvent('ad.clicked')
  handleAdClicked(ad: Ad) {
    this.logger.log(`📢 Broadcasting ad.clicked event for ad: ${ad.id}`);
    this.server.to('ads_updates').emit('ad.clicked', {
      type: 'ad.clicked',
      ad,
      timestamp: new Date().toISOString(),
    });
  }
}

