import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export class WebSocketServerService {
  private wss: WebSocketServer;
  private readonly logger = new Logger(WebSocketServerService.name);
  private connectedClients = new Map<string, WebSocket>();
  private eventEmitter: EventEmitter2 | null = null;

  constructor(
    private readonly server: Server,
  ) {
    this.initializeWebSocketServer();
  }

  public setEventEmitter(eventEmitter: EventEmitter2) {
    this.eventEmitter = eventEmitter;
    this.setupEventListeners();
  }

  private initializeWebSocketServer() {
    this.wss = new WebSocketServer({
      server: this.server,
      path: '/api/v1/ws',
    });

    this.wss.on('connection', (ws: WebSocket, request) => {
      this.handleConnection(ws, request);
    });
  }

  private setupEventListeners() {
    if (!this.eventEmitter) {
      this.logger.warn('EventEmitter2 not set, skipping event listener setup');
      return;
    }

    // Listen for hospital events
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

  private handleConnection(ws: WebSocket, request: any) {
    try {
      const clientId = this.generateClientId();
      this.connectedClients.set(clientId, ws);

      // Send connection confirmation
      this.sendMessage(ws, {
        type: 'connected',
        message: 'Connected to hospital updates',
        timestamp: new Date().toISOString(),
      });

      // Set up message handler
      ws.on('message', (data) => {
        this.handleMessage(ws, data.toString());
      });

      // Set up error handler
      ws.on('error', (error) => {
        this.handleDisconnection(ws);
      });

      // Set up close handler
      ws.on('close', () => {
        this.connectedClients.delete(clientId);
      });

    } catch (error) {
      this.logger.error('Error handling WebSocket connection:', error);
    }
  }

  private handleMessage(ws: WebSocket, message: string) {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'ping':
          this.sendMessage(ws, {
            type: 'pong',
            message: 'Hello from server',
            timestamp: new Date().toISOString(),
          });
          break;

        case 'test':
          this.sendMessage(ws, {
            type: 'test_response',
            message: 'Test message received',
            data: data.data,
            timestamp: new Date().toISOString(),
          });
          break;

        case 'join_hospital_updates':
          this.sendMessage(ws, {
            type: 'joined_hospital_updates',
            message: 'Joined hospital updates room',
            timestamp: new Date().toISOString(),
          });
          break;

        case 'leave_hospital_updates':
          this.sendMessage(ws, {
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

  private sendMessage(ws: WebSocket, message: any) {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    } catch (error) {
      this.logger.error('Error sending WebSocket message:', error);
    }
  }

  private handleDisconnection(ws: WebSocket) {
    try {
      // Find and remove the client
      for (const [clientId, clientWs] of this.connectedClients.entries()) {
        if (clientWs === ws) {
          this.connectedClients.delete(clientId);
          break;
        }
      }
    } catch (error) {
      // Silently handle disconnection errors
    }
  }

  private generateClientId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // Broadcast hospital created event
  async broadcastHospitalCreated(hospital: any) {
    try {
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

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Get connected clients (for health check)
  getConnectedClients(): string[] {
    return Array.from(this.connectedClients.keys());
  }

  // Public method to broadcast to all clients (for testing)
  broadcastToAllClients(message: any) {
    for (const client of this.connectedClients.values()) {
      this.sendMessage(client, message);
    }
  }
}
