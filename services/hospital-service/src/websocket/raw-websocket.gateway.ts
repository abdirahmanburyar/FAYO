import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IncomingMessage } from 'http';

@WebSocketGateway({
  path: '/api/v1/ws',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class RawWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RawWebSocketGateway.name);
  private connectedClients = new Map<string, WebSocket>();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  afterInit(server: Server) {
    this.logger.log('Raw WebSocket Gateway initialized');
  }

  onModuleInit() {
    // Listen for hospital events and broadcast them via WebSocket
    this.eventEmitter.on('hospital.created', (hospital) => {
      this.broadcastHospitalCreated(hospital);
    });

    this.eventEmitter.on('hospital.updated', (hospital) => {
      this.broadcastHospitalUpdated(hospital);
    });

    this.eventEmitter.on('hospital.deleted', (data) => {
      this.broadcastHospitalDeleted(data.hospitalId);
    });
  }

  handleConnection(client: WebSocket, request: IncomingMessage) {
    try {
      const clientId = this.generateClientId();
      this.logger.log(`Client connected: ${clientId}`);
      this.connectedClients.set(clientId, client);

      // Send connection confirmation
      this.sendMessage(client, {
        type: 'connected',
        message: 'Connected to hospital updates',
        timestamp: new Date().toISOString(),
      });

      // Set up message handler
      client.on('message', (data) => {
        this.handleMessage(client, data.toString());
      });

      // Set up error handler
      client.on('error', (error) => {
        this.logger.error(`WebSocket error for client ${clientId}:`, error);
        this.handleDisconnect(client);
      });

      // Set up close handler
      client.on('close', () => {
        this.logger.log(`Client disconnected: ${clientId}`);
        this.connectedClients.delete(clientId);
      });

    } catch (error) {
      this.logger.error('Error handling WebSocket connection:', error);
    }
  }

  handleDisconnect(client: WebSocket) {
    try {
      // Find and remove the client
      for (const [clientId, ws] of this.connectedClients.entries()) {
        if (ws === client) {
          this.logger.log(`Client disconnected: ${clientId}`);
          this.connectedClients.delete(clientId);
          break;
        }
      }
    } catch (error) {
      this.logger.error('Error handling WebSocket disconnection:', error);
    }
  }

  private handleMessage(client: WebSocket, message: string) {
    try {
      const data = JSON.parse(message);
      this.logger.log(`Received message: ${data.type}`);

      switch (data.type) {
        case 'ping':
          this.sendMessage(client, {
            type: 'pong',
            message: 'Hello from server',
            timestamp: new Date().toISOString(),
          });
          break;

        case 'test':
          this.sendMessage(client, {
            type: 'test_response',
            message: 'Test message received',
            data: data.data,
            timestamp: new Date().toISOString(),
          });
          break;

        case 'join_hospital_updates':
          this.sendMessage(client, {
            type: 'joined_hospital_updates',
            message: 'Joined hospital updates room',
            timestamp: new Date().toISOString(),
          });
          break;

        case 'leave_hospital_updates':
          this.sendMessage(client, {
            type: 'left_hospital_updates',
            message: 'Left hospital updates room',
            timestamp: new Date().toISOString(),
          });
          break;

        default:
          this.logger.warn(`Unknown message type: ${data.type}`);
      }
    } catch (error) {
      this.logger.error('Error handling WebSocket message:', error);
    }
  }

  private sendMessage(client: WebSocket, message: any) {
    try {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    } catch (error) {
      this.logger.error('Error sending WebSocket message:', error);
    }
  }

  private generateClientId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // Broadcast hospital created event
  async broadcastHospitalCreated(hospital: any) {
    try {
      this.logger.log('Broadcasting hospital created event');
      const message = {
        type: 'hospital.created',
        hospital,
        timestamp: new Date().toISOString(),
      };
      this.broadcastToAllClients(message);
    } catch (error) {
      this.logger.error('Error broadcasting hospital created event:', error);
    }
  }

  // Broadcast hospital updated event
  async broadcastHospitalUpdated(hospital: any) {
    try {
      this.logger.log('Broadcasting hospital updated event');
      const message = {
        type: 'hospital.updated',
        hospital,
        timestamp: new Date().toISOString(),
      };
      this.broadcastToAllClients(message);
    } catch (error) {
      this.logger.error('Error broadcasting hospital updated event:', error);
    }
  }

  // Broadcast hospital deleted event
  async broadcastHospitalDeleted(hospitalId: string) {
    try {
      this.logger.log('Broadcasting hospital deleted event');
      const message = {
        type: 'hospital.deleted',
        hospitalId,
        timestamp: new Date().toISOString(),
      };
      this.broadcastToAllClients(message);
    } catch (error) {
      this.logger.error('Error broadcasting hospital deleted event:', error);
    }
  }

  // Broadcast hospital status changed event
  async broadcastHospitalStatusChanged(hospital: any) {
    try {
      this.logger.log('Broadcasting hospital status changed event');
      const message = {
        type: 'hospital.status_changed',
        hospital,
        timestamp: new Date().toISOString(),
      };
      this.broadcastToAllClients(message);
    } catch (error) {
      this.logger.error('Error broadcasting hospital status changed event:', error);
    }
  }

  private broadcastToAllClients(message: any) {
    for (const client of this.connectedClients.values()) {
      this.sendMessage(client, message);
    }
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Get connected clients (for health check)
  getConnectedClients(): string[] {
    return Array.from(this.connectedClients.keys());
  }
}
