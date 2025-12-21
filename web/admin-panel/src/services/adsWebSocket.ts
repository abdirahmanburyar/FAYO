import { io, Socket } from 'socket.io-client';
import { Ad } from './adsApi';

export interface AdsWebSocketEvent {
  type: 'ad.created' | 'ad.updated' | 'ad.deleted' | 'ad.clicked' | 'connected' | 'pong' | 'joined_ads_updates';
  ad?: Ad;
  adId?: string;
  timestamp?: string;
  message?: string;
}

export class AdsWebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private listeners: Map<string, Set<(event: AdsWebSocketEvent) => void>> = new Map();
  private isConnecting = false;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private getSocketUrl(): string {
    if (typeof window !== 'undefined') {
      // Use unified API service URL
      // Next.js bakes NEXT_PUBLIC_* vars into the bundle at build time
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (apiUrl) {
        // Remove /api/v1 suffix if present for WebSocket URL
        const baseUrl = apiUrl.replace('/api/v1', '').replace(/\/$/, '');
        console.log('[AdsWebSocket] Using NEXT_PUBLIC_API_URL:', baseUrl);
        return baseUrl;
      }
      // Fallback: construct from current location (for production)
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        // Production: use same hostname with port 3001
        const url = `http://${hostname}:3001`;
        console.log('[AdsWebSocket] Using constructed URL (production):', url);
        return url;
      }
      // Development: localhost
      const url = 'http://localhost:3001';
      console.log('[AdsWebSocket] Using constructed URL (development):', url);
      return url;
    }
    return 'http://api-service:3001';
  }

  connect() {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      return;
    }

    this.isConnecting = true;
    const url = this.getSocketUrl();
    console.log('🔌 [AdsWebSocket] Connecting to:', url);

    try {
      this.socket = io(url, {
        path: '/api/v1/ws/ads',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 3000,
      });

      this.socket.on('connect', () => {
        console.log('✅ [AdsWebSocket] Connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Join ads updates room
        this.socket?.emit('join_ads_updates');

        // Send ping to keep connection alive
        this.pingInterval = setInterval(() => {
          if (this.socket && this.socket.connected) {
            this.socket.emit('ping');
          }
        }, 30000); // Every 30 seconds

        this.emit('connected', {
          type: 'connected',
          message: 'Connected to ads updates',
          timestamp: new Date().toISOString(),
        });
      });

      this.socket.on('connected', (data: any) => {
        console.log('📥 [AdsWebSocket] Server confirmed connection:', data);
        this.emit('connected', {
          type: 'connected',
          ...data,
        });
      });

      this.socket.on('joined_ads_updates', (data: any) => {
        console.log('📥 [AdsWebSocket] Joined ads updates room:', data);
        this.emit('joined_ads_updates', {
          type: 'joined_ads_updates',
          ...data,
        });
      });

      this.socket.on('pong', (data: any) => {
        console.log('📥 [AdsWebSocket] Received pong:', data);
        this.emit('pong', {
          type: 'pong',
          ...data,
        });
      });

      // Listen for ad events
      this.socket.on('ad.created', (data: any) => {
        console.log('📥 [AdsWebSocket] Ad created:', data);
        this.emit('ad.created', data);
      });

      this.socket.on('ad.updated', (data: any) => {
        console.log('📥 [AdsWebSocket] Ad updated:', data);
        this.emit('ad.updated', data);
      });

      this.socket.on('ad.deleted', (data: any) => {
        console.log('📥 [AdsWebSocket] Ad deleted:', data);
        this.emit('ad.deleted', data);
      });

      this.socket.on('ad.clicked', (data: any) => {
        console.log('📥 [AdsWebSocket] Ad clicked:', data);
        this.emit('ad.clicked', data);
      });

      this.socket.on('disconnect', (reason: string) => {
        console.log('🔌 [AdsWebSocket] Disconnected:', reason);
        this.isConnecting = false;
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('❌ [AdsWebSocket] Connection error:', error);
        this.isConnecting = false;
      });
    } catch (error) {
      console.error('❌ [AdsWebSocket] Connection error:', error);
      this.isConnecting = false;
    }
  }

  send(event: string, data: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️ [AdsWebSocket] Cannot send message, Socket.IO not connected');
    }
  }

  on(eventType: string, callback: (event: AdsWebSocketEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
    console.log(`📝 [AdsWebSocket] Registered listener for: ${eventType}, total listeners: ${this.listeners.get(eventType)!.size}`);
  }

  off(eventType: string, callback: (event: AdsWebSocketEvent) => void) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emit(eventType: string, event: AdsWebSocketEvent) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      console.log(`📤 [AdsWebSocket] Emitting ${eventType} to ${callbacks.size} listener(s)`);
      callbacks.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error(`❌ [AdsWebSocket] Error in callback for ${eventType}:`, error);
        }
      });
    } else {
      console.warn(`⚠️ [AdsWebSocket] No listeners registered for ${eventType}`);
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
let wsServiceInstance: AdsWebSocketService | null = null;

export const getAdsWebSocketService = (): AdsWebSocketService => {
  if (!wsServiceInstance) {
    wsServiceInstance = new AdsWebSocketService();
  }
  return wsServiceInstance;
};

