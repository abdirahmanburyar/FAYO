import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: '/ws',
})
export class HospitalGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(HospitalGateway.name);
  private connectedClients = new Map<string, Socket>();

  constructor(private readonly eventEmitter: EventEmitter2) {}

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

  handleConnection(client: Socket) {
    try {
      this.logger.log(`Client connected: ${client.id}`);
      this.connectedClients.set(client.id, client);
      
      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to hospital updates',
        timestamp: new Date().toISOString(),
      });
      
      // Join the hospital updates room by default
      client.join('hospital_updates');
      this.logger.log(`Client ${client.id} automatically joined hospital updates room`);
    } catch (error) {
      this.logger.error(`Error handling connection for client ${client.id}:`, error);
    }
  }

  handleDisconnect(client: Socket) {
    try {
      this.logger.log(`Client disconnected: ${client.id}`);
      this.connectedClients.delete(client.id);
      
      // Leave hospital updates room
      client.leave('hospital_updates');
    } catch (error) {
      this.logger.error(`Error handling disconnection for client ${client.id}:`, error);
    }
  }

  @SubscribeMessage('join_hospital_updates')
  handleJoinHospitalUpdates(@ConnectedSocket() client: Socket) {
    client.join('hospital_updates');
    this.logger.log(`Client ${client.id} joined hospital updates`);
    
    client.emit('joined', {
      room: 'hospital_updates',
      message: 'Successfully joined hospital updates',
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('leave_hospital_updates')
  handleLeaveHospitalUpdates(@ConnectedSocket() client: Socket) {
    client.leave('hospital_updates');
    this.logger.log(`Client ${client.id} left hospital updates`);
    
    client.emit('left', {
      room: 'hospital_updates',
      message: 'Left hospital updates',
      timestamp: new Date().toISOString(),
    });
  }

  // Note: Hospital data fetching is handled by the REST API
  // WebSocket is only used for real-time updates

  // Broadcast hospital created event
  async broadcastHospitalCreated(hospital: any) {
    try {
      this.logger.log('Broadcasting hospital created event');
      this.server.to('hospital_updates').emit('hospital.created', {
        hospital,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Error broadcasting hospital created event:', error);
    }
  }

  // Broadcast hospital updated event
  async broadcastHospitalUpdated(hospital: any) {
    try {
      this.logger.log('Broadcasting hospital updated event');
      this.server.to('hospital_updates').emit('hospital.updated', {
        hospital,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Error broadcasting hospital updated event:', error);
    }
  }

  // Broadcast hospital deleted event
  async broadcastHospitalDeleted(hospitalId: string) {
    try {
      this.logger.log('Broadcasting hospital deleted event');
      this.server.to('hospital_updates').emit('hospital.deleted', {
        hospitalId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Error broadcasting hospital deleted event:', error);
    }
  }

  // Broadcast hospital status changed event
  async broadcastHospitalStatusChanged(hospital: any) {
    try {
      this.logger.log('Broadcasting hospital status changed event');
      this.server.to('hospital_updates').emit('hospital.status_changed', {
        hospital,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Error broadcasting hospital status changed event:', error);
    }
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Get all connected clients
  getConnectedClients(): string[] {
    return Array.from(this.connectedClients.keys());
  }
}
