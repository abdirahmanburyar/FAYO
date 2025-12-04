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

@WebSocketGateway({
  path: '/api/v1/ws/payments',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class WaafipayGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, OnModuleInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WaafipayGateway.name);

  afterInit(server: Server) {
    this.logger.log('✅ Waafipay WebSocket Gateway initialized');
  }

  onModuleInit() {
    this.logger.log('Waafipay Gateway module initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`🔌 Client connected: ${client.id}`);
    client.emit('connected', {
      type: 'connected',
      message: 'Connected to payment updates',
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_payment_updates')
  handleJoinPaymentUpdates(@ConnectedSocket() client: Socket) {
    client.join('payment_updates');
    client.emit('joined_payment_updates', {
      type: 'joined_payment_updates',
      message: 'Joined payment updates room',
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`📥 Client ${client.id} joined payment_updates room`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', {
      type: 'pong',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast payment initiated event
   */
  broadcastPaymentInitiated(payment: any) {
    const message = {
      type: 'payment.initiated',
      payment,
      timestamp: new Date().toISOString(),
    };
    this.server.to('payment_updates').emit('payment.initiated', message);
    this.logger.log(`📤 Broadcasted payment.initiated: ${payment.id || payment.transactionId}`);
  }

  /**
   * Broadcast payment status update
   */
  broadcastPaymentStatusUpdate(payment: any, status: string) {
    const message = {
      type: `payment.${status.toLowerCase()}`,
      payment,
      status,
      timestamp: new Date().toISOString(),
    };
    this.server.to('payment_updates').emit(`payment.${status.toLowerCase()}`, message);
    this.logger.log(`📤 Broadcasted payment.${status.toLowerCase()}: ${payment.id || payment.transactionId}`);
  }

  /**
   * Broadcast payment completed
   */
  broadcastPaymentCompleted(payment: any) {
    const message = {
      type: 'payment.completed',
      payment,
      timestamp: new Date().toISOString(),
    };
    this.server.to('payment_updates').emit('payment.completed', message);
    this.logger.log(`📤 Broadcasted payment.completed: ${payment.id || payment.transactionId}`);
  }

  /**
   * Broadcast payment failed
   */
  broadcastPaymentFailed(payment: any, error?: string) {
    const message = {
      type: 'payment.failed',
      payment,
      error,
      timestamp: new Date().toISOString(),
    };
    this.server.to('payment_updates').emit('payment.failed', message);
    this.logger.log(`📤 Broadcasted payment.failed: ${payment.id || payment.transactionId}`);
  }
}

