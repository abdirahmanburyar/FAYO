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
      
      // Send connection confirmation
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

  // Broadcast appointment events to all connected clients
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

  // Call-related broadcasts
  broadcastCallInvitation(data: {
    appointmentId: string;
    patientId: string;
    channelName: string;
    callSession: any;
    credentials: any;
  }) {
    const message = {
      type: 'call.invitation',
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      channelName: data.channelName,
      callSession: data.callSession,
      credentials: data.credentials,
      timestamp: new Date().toISOString(),
    };
    
    // Broadcast to all clients in appointment_updates room
    this.server.to('appointment_updates').emit('call.invitation', message);
    
    // Also send to a specific patient room if they're connected
    this.server.to(`patient_${data.patientId}`).emit('call.invitation', message);
    
    this.logger.log(`📞 Broadcasted call.invitation for appointment: ${data.appointmentId} to patient: ${data.patientId}`);
  }

  broadcastCallCreated(callSession: any) {
    const message = {
      type: 'call.created',
      callSession,
      sessionId: callSession.id,
      appointmentId: callSession.appointmentId,
      timestamp: new Date().toISOString(),
    };
    this.server.to('appointment_updates').emit('call.created', message);
    this.logger.log(`📞 Broadcasted call.created: ${callSession.id}`);
  }

  broadcastCallEnded(callSession: any) {
    const message = {
      type: 'call.ended',
      callSession,
      sessionId: callSession.id,
      appointmentId: callSession.appointmentId,
      timestamp: new Date().toISOString(),
    };
    this.server.to('appointment_updates').emit('call.ended', message);
    this.logger.log(`📞 Broadcasted call.ended: ${callSession.id}`);
  }

  // Handle call acceptance from patient
  @SubscribeMessage('call.accepted')
  handleCallAccepted(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { appointmentId: string; channelName: string; patientId: string },
  ) {
    this.logger.log(`📞 Call accepted by patient ${data.patientId} for appointment ${data.appointmentId}`);
    
    const message = {
      type: 'call.accepted',
      appointmentId: data.appointmentId,
      channelName: data.channelName,
      patientId: data.patientId,
      timestamp: new Date().toISOString(),
    };
    
    // Broadcast to appointment_updates room (admin panel listens here)
    this.server.to('appointment_updates').emit('call.accepted', message);
    
    // Also send to patient room
    this.server.to(`patient_${data.patientId}`).emit('call.accepted', message);
  }

  // Handle call started event (when admin joins)
  @SubscribeMessage('call.started')
  handleCallStarted(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { appointmentId: string; channelName: string; hostId: string },
  ) {
    this.logger.log(`📞 Call started by host ${data.hostId} for appointment ${data.appointmentId}`);
    
    const message = {
      type: 'call.started',
      appointmentId: data.appointmentId,
      channelName: data.channelName,
      hostId: data.hostId,
      timestamp: new Date().toISOString(),
    };
    
    // Broadcast to appointment_updates room
    this.server.to('appointment_updates').emit('call.started', message);
  }

  // Broadcast call accepted event (called from service)
  broadcastCallAccepted(data: {
    appointmentId: string;
    channelName: string;
    patientId: string;
  }) {
    const message = {
      type: 'call.accepted',
      appointmentId: data.appointmentId,
      channelName: data.channelName,
      patientId: data.patientId,
      timestamp: new Date().toISOString(),
    };
    
    this.server.to('appointment_updates').emit('call.accepted', message);
    this.server.to(`patient_${data.patientId}`).emit('call.accepted', message);
    
    this.logger.log(`📞 Broadcasted call.accepted for appointment: ${data.appointmentId}`);
  }

  // Broadcast call started event (called from service)
  broadcastCallStarted(data: {
    appointmentId: string;
    channelName: string;
    hostId: string;
  }) {
    const message = {
      type: 'call.started',
      appointmentId: data.appointmentId,
      channelName: data.channelName,
      hostId: data.hostId,
      timestamp: new Date().toISOString(),
    };
    
    this.server.to('appointment_updates').emit('call.started', message);
    
    this.logger.log(`📞 Broadcasted call.started for appointment: ${data.appointmentId}`);
  }
}

