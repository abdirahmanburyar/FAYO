import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {

  @Get()
  check() {
    // Get WebSocket server instance from global variable
    const webSocketServer = (global as any).webSocketServer;
    
    return {
      status: 'ok',
      service: 'hospital-service',
      timestamp: new Date().toISOString(),
      websocket: {
        status: 'running',
        connectedClients: webSocketServer?.getConnectedClientsCount?.() || 0,
        note: 'WebSocket server initialized after HTTP server startup',
      },
    };
  }

  @Get('websocket')
  checkWebSocket() {
    // Get WebSocket server instance from global variable
    const webSocketServer = (global as any).webSocketServer;
    
    return {
      status: 'ok',
      websocket: {
        status: 'running',
        connectedClients: webSocketServer?.getConnectedClientsCount?.() || 0,
        clients: webSocketServer?.getConnectedClients?.() || [],
        note: 'WebSocket server initialized after HTTP server startup',
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('test-broadcast')
  testBroadcast() {
    // Get WebSocket server instance from global variable
    const webSocketServer = (global as any).webSocketServer;
    
    if (webSocketServer) {
      // Send a test message to all connected clients
      webSocketServer.broadcastToAllClients({
        type: 'test.broadcast',
        message: 'Test broadcast message',
        timestamp: new Date().toISOString(),
      });
      
      return {
        status: 'ok',
        message: 'Test broadcast sent',
        connectedClients: webSocketServer.getConnectedClientsCount(),
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        status: 'error',
        message: 'WebSocket server not available',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('test-hospital-events')
  testHospitalEvents() {
    // Get WebSocket server instance from global variable
    const webSocketServer = (global as any).webSocketServer;
    
    if (webSocketServer) {
      const testHospital = {
        id: 'test-hospital-123',
        name: 'Test Hospital',
        type: 'HOSPITAL',
        address: 'Test Address',
        city: 'Test City',
        phone: '+1234567890',
        email: 'test@hospital.com',
        website: 'https://test-hospital.com',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        specialties: [],
        departments: [],
        services: []
      };

      // Test hospital.created event
      webSocketServer.broadcastHospitalCreated(testHospital);
      
      // Test hospital.updated event (after 1 second)
      setTimeout(() => {
        webSocketServer.broadcastHospitalUpdated({
          ...testHospital,
          name: 'Updated Test Hospital',
          updatedAt: new Date().toISOString()
        });
      }, 1000);
      
      // Test hospital.deleted event (after 2 seconds)
      setTimeout(() => {
        webSocketServer.broadcastHospitalDeleted(testHospital.id);
      }, 2000);
      
      return {
        status: 'ok',
        message: 'Hospital test events scheduled',
        events: ['hospital.created', 'hospital.updated', 'hospital.deleted'],
        connectedClients: webSocketServer.getConnectedClientsCount(),
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        status: 'error',
        message: 'WebSocket server not available',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
