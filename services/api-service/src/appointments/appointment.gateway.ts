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
  path: '/api/v1/ws/appointments',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class AppointmentGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, OnModuleInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppointmentGateway.name);

  afterInit(server: Server) {
    this.logger.log('✅ Appointment WebSocket Gateway initialized');
  }

  onModuleInit() {
    this.logger.log('Appointment Gateway module initialized');
  }

  handleConnection(client: Socket) {
    try {
      this.logger.log(`🔌 Client connected: ${client.id}`);
      
      client.emit('connected', {
        type: 'connected',
        message: 'Connected to appointment updates',
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

  @SubscribeMessage('join_appointment_updates')
  handleJoinAppointmentUpdates(@ConnectedSocket() client: Socket) {
    client.join('appointment_updates');
    client.emit('joined_appointment_updates', {
      type: 'joined_appointment_updates',
      message: 'Joined appointment updates room',
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('join_patient_room')
  handleJoinPatientRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { patientId: string },
  ) {
    const roomName = `patient_${data.patientId}`;
    client.join(roomName);
    this.logger.log(`📞 Patient ${data.patientId} joined room: ${roomName}`);
    client.emit('joined_patient_room', {
      type: 'joined_patient_room',
      patientId: data.patientId,
      message: `Joined patient room for ${data.patientId}`,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastAppointmentCreated(appointment: any) {
    const message = {
      type: 'appointment.created',
      appointment,
      timestamp: new Date().toISOString(),
    };
    this.server.to('appointment_updates').emit('appointment.created', message);
    this.logger.log(`📤 Broadcasted appointment.created: ${appointment.id}`);
  }

  broadcastAppointmentUpdated(appointment: any) {
    const message = {
      type: 'appointment.updated',
      appointment,
      timestamp: new Date().toISOString(),
    };
    this.server.to('appointment_updates').emit('appointment.updated', message);
    this.logger.log(`📤 Broadcasted appointment.updated: ${appointment.id}`);
  }

  broadcastAppointmentCancelled(appointmentId: string, data: any) {
    const message = {
      type: 'appointment.cancelled',
      appointmentId,
      ...data,
      timestamp: new Date().toISOString(),
    };
    this.server.to('appointment_updates').emit('appointment.cancelled', message);
    this.logger.log(`📤 Broadcasted appointment.cancelled: ${appointmentId}`);
  }

  broadcastAppointmentConfirmed(appointmentId: string, appointment: any) {
    const message = {
      type: 'appointment.confirmed',
      appointmentId,
      appointment,
      timestamp: new Date().toISOString(),
    };
    this.server.to('appointment_updates').emit('appointment.confirmed', message);
    this.logger.log(`📤 Broadcasted appointment.confirmed: ${appointmentId}`);
  }
}

