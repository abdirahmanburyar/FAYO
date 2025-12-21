                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    import { io, Socket } from 'socket.io-client';

export interface AppointmentWebSocketEvent {
  type: 'appointment.created' | 'appointment.updated' | 'appointment.cancelled' | 'appointment.confirmed' | 'connected' | 'pong' | 'call.invitation' | 'call.accepted' | 'call.started' | 'call.ended';
  appointment?: any;
  appointmentId?: string;
  timestamp?: string;
  message?: string;
  sessionName?: string;
  patientId?: string;
  hostId?: string;
  callSession?: any;
}

export class AppointmentWebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private listeners: Map<string, Set<(event: AppointmentWebSocketEvent) => void>> = new Map();
  private isConnecting = false;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private getSocketUrl(): string {
    // Force HTTP for development - HTTPS disabled
    if (typeof window !== 'undefined') {
      // Use unified API service URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (apiUrl) {
        return apiUrl.replace('/api/v1', '');
      }
      // Fallback: construct from current location
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return `http://${window.location.hostname}:3001`;
      }
      return 'http://localhost:3001';
    }
    return 'http://api-service:3001';
  }

  connect() {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      return;
    }

    this.isConnecting = true;
    const url = this.getSocketUrl();
    console.log('🔌 [AppointmentWebSocket] Connecting to:', url);

    try {
      this.socket = io(url, {
        path: '/api/v1/ws/appointments',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 3000,
      });

      this.socket.on('connect', () => {
        console.log('✅ [AppointmentWebSocket] Connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Join appointment updates room
        this.socket?.emit('join_appointment_updates');

        // Send ping to keep connection alive
        this.pingInterval = setInterval(() => {
          if (this.socket && this.socket.connected) {
            this.socket.emit('ping');
          }
        }, 30000); // Every 30 seconds

        this.emit('connected', {
          type: 'connected',
          message: 'Connected to appointment updates',
          timestamp: new Date().toISOString(),
        });
      });

      this.socket.on('connected', (data: any) => {
        console.log('📥 [AppointmentWebSocket] Server confirmed connection:', data);
        this.emit('connected', {
          type: 'connected',
          ...data,
        });
      });

      this.socket.on('joined_appointment_updates', (data: any) => {
        console.log('📥 [AppointmentWebSocket] Joined appointment updates room:', data);
      });

      this.socket.on('pong', (data: any) => {
        console.log('📥 [AppointmentWebSocket] Received pong:', data);
        this.emit('pong', {
          type: 'pong',
          ...data,
        });
      });

      // Listen for appointment events
      this.socket.on('appointment.created', (data: any) => {
        console.log('📥 [AppointmentWebSocket] Appointment created:', data);
        this.emit('appointment.created', data);
      });

      this.socket.on('appointment.updated', (data: any) => {
        console.log('📥 [AppointmentWebSocket] Appointment updated:', data);
        this.emit('appointment.updated', data);
      });

      this.socket.on('appointment.cancelled', (data: any) => {
        console.log('📥 [AppointmentWebSocket] Appointment cancelled:', data);
        this.emit('appointment.cancelled', data);
      });

      this.socket.on('appointment.confirmed', (data: any) => {
        console.log('📥 [AppointmentWebSocket] Appointment confirmed:', data);
        this.emit('appointment.confirmed', data);
      });

      // Listen for call events
      this.socket.on('call.invitation', (data: any) => {
        console.log('📥 [AppointmentWebSocket] Call invitation:', data);
        this.emit('call.invitation', data);
      });

      this.socket.on('call.accepted', (data: any) => {
        console.log('📥 [AppointmentWebSocket] Call accepted:', data);
        // Ensure data is wrapped in the event format
        const event: AppointmentWebSocketEvent = {
          type: 'call.accepted',
          appointmentId: data?.appointmentId || data?.appointment?.id,
          patientId: data?.patientId,
          sessionName: data?.sessionName,
          timestamp: data?.timestamp || new Date().toISOString(),
          ...data
        };
        console.log('📥 [AppointmentWebSocket] Emitting call.accepted event:', event);
        this.emit('call.accepted', event);
      });

      this.socket.on('call.started', (data: any) => {
        console.log('📥 [AppointmentWebSocket] Call started:', data);
        this.emit('call.started', data);
      });

      this.socket.on('call.ended', (data: any) => {
        console.log('📥 [AppointmentWebSocket] Call ended:', data);
        this.emit('call.ended', data);
      });

      this.socket.on('disconnect', (reason: string) => {
        console.log('🔌 [AppointmentWebSocket] Disconnected:', reason);
        this.isConnecting = false;
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('❌ [AppointmentWebSocket] Connection error:', error);
        this.isConnecting = false;
      });
    } catch (error) {
      console.error('❌ [AppointmentWebSocket] Connection error:', error);
      this.isConnecting = false;
    }
  }

  send(event: string, data: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️ [AppointmentWebSocket] Cannot send message, Socket.IO not connected');
    }
  }

  on(eventType: string, callback: (event: AppointmentWebSocketEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
    console.log(`📝 [AppointmentWebSocket] Registered listener for: ${eventType}, total listeners: ${this.listeners.get(eventType)!.size}`);
  }

  off(eventType: string, callback: (event: AppointmentWebSocketEvent) => void) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emit(eventType: string, event: AppointmentWebSocketEvent) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      console.log(`📤 [AppointmentWebSocket] Emitting ${eventType} to ${callbacks.size} listener(s)`);
      callbacks.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error(`❌ [AppointmentWebSocket] Error in callback for ${eventType}:`, error);
        }
      });
    } else {
      console.warn(`⚠️ [AppointmentWebSocket] No listeners registered for ${eventType}`);
    }
  }

  disconnect() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }
}

// Singleton instance
let wsServiceInstance: AppointmentWebSocketService | null = null;

export const getAppointmentWebSocketService = (): AppointmentWebSocketService => {
  if (!wsServiceInstance) {
    wsServiceInstance = new AppointmentWebSocketService();
  }
  return wsServiceInstance;
};
