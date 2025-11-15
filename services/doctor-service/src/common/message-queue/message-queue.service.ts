import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';

export interface MessageQueueMessage {
  pattern: string;
  data: any;
  correlationId?: string;
  timestamp?: Date;
}

export interface MessageQueueResponse {
  success: boolean;
  data?: any;
  error?: string;
  correlationId?: string;
}

@Injectable()
export class MessageQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessageQueueService.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private listeners = new Map<string, Function[]>();
  private pendingRequests = new Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>();

  async onModuleInit() {
    this.logger.log('🚀 [KAFKA] Initializing Kafka connection...');
    
    this.kafka = new Kafka({
      clientId: 'doctor-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'doctor-service-group' });

    await this.producer.connect();
    await this.consumer.connect();
    
    // Subscribe to response topics
    await this.consumer.subscribe({ topic: 'doctor-service-responses', fromBeginning: false });
    
    // Start consuming messages
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        await this.handleMessage(topic, message);
      },
    });

    this.logger.log('✅ [KAFKA] Kafka connection established');
  }

  async onModuleDestroy() {
    this.logger.log('🛑 [KAFKA] Disconnecting from Kafka...');
    await this.consumer?.disconnect();
    await this.producer?.disconnect();
    this.logger.log('✅ [KAFKA] Kafka disconnected');
  }

  /**
   * Send a message to a specific topic/pattern
   */
  async sendMessage(pattern: string, data: any, correlationId?: string): Promise<MessageQueueResponse> {
    const message: MessageQueueMessage = {
      pattern,
      data,
      correlationId: correlationId || this.generateCorrelationId(),
      timestamp: new Date(),
    };

    this.logger.log(`📤 [KAFKA] Sending message to pattern: ${pattern}`, {
      correlationId: message.correlationId,
      dataKeys: Object.keys(data),
    });

    try {
      // Send message to Kafka topic
      const topic = this.getTopicFromPattern(pattern);
      await this.producer.send({
        topic,
        messages: [{
          key: message.correlationId,
          value: JSON.stringify(message),
          headers: {
            pattern: pattern,
            correlationId: message.correlationId,
          },
        }],
      });

      // Wait for response
      return await this.waitForResponse(message.correlationId);
    } catch (error) {
      this.logger.error(`❌ [KAFKA] Error sending message: ${error.message}`, {
        pattern,
        correlationId: message.correlationId,
      });
      return {
        success: false,
        error: error.message,
        correlationId: message.correlationId,
      };
    }
  }

  /**
   * Subscribe to a pattern/topic
   */
  subscribe(pattern: string, handler: (data: any) => Promise<any> | any): void {
    if (!this.listeners.has(pattern)) {
      this.listeners.set(pattern, []);
    }
    this.listeners.get(pattern)!.push(handler);
    this.logger.log(`📥 [KAFKA] Subscribed to pattern: ${pattern}`);
  }

  /**
   * Handle incoming Kafka messages
   */
  private async handleMessage(topic: string, message: any): Promise<void> {
    try {
      const messageData = JSON.parse(message.value?.toString() || '{}');
      const pattern = message.headers?.pattern?.toString();
      const correlationId = message.headers?.correlationId?.toString();

      this.logger.log(`📥 [KAFKA] Received message on topic: ${topic}`, {
        pattern,
        correlationId,
      });

      if (topic === 'doctor-service-responses') {
        // Handle response messages
        this.handleResponse(correlationId, messageData);
      } else {
        // Handle request messages
        await this.processMessage(messageData);
      }
    } catch (error) {
      this.logger.error(`❌ [KAFKA] Error handling message: ${error.message}`);
    }
  }

  /**
   * Handle response messages
   */
  private handleResponse(correlationId: string, response: any): void {
    const pendingRequest = this.pendingRequests.get(correlationId);
    if (pendingRequest) {
      clearTimeout(pendingRequest.timeout);
      this.pendingRequests.delete(correlationId);
      pendingRequest.resolve(response);
    }
  }

  /**
   * Wait for a response with timeout
   */
  private async waitForResponse(correlationId: string, timeoutMs: number = 10000): Promise<MessageQueueResponse> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(correlationId);
        reject(new Error('Request timeout'));
      }, timeoutMs);

      this.pendingRequests.set(correlationId, { resolve, reject, timeout });
    });
  }

  /**
   * Get Kafka topic from pattern
   */
  private getTopicFromPattern(pattern: string): string {
    if (pattern.startsWith('shared.')) {
      return 'shared-service-requests';
    }
    return 'doctor-service-requests';
  }

  /**
   * Process a message by finding and calling the appropriate handler
   */
  private async processMessage(message: MessageQueueMessage): Promise<MessageQueueResponse> {
    const handlers = this.listeners.get(message.pattern) || [];
    
    if (handlers.length === 0) {
      this.logger.warn(`⚠️ [KAFKA] No handlers found for pattern: ${message.pattern}`);
      return {
        success: false,
        error: `No handlers found for pattern: ${message.pattern}`,
        correlationId: message.correlationId,
      };
    }

    try {
      // Call the first handler
      const result = await handlers[0](message.data);
      
      this.logger.log(`✅ [KAFKA] Message processed successfully`, {
        pattern: message.pattern,
        correlationId: message.correlationId,
      });

      // Send response back
      await this.sendResponse(message.correlationId, {
        success: true,
        data: result,
        correlationId: message.correlationId,
      });

      return {
        success: true,
        data: result,
        correlationId: message.correlationId,
      };
    } catch (error) {
      this.logger.error(`❌ [KAFKA] Handler error: ${error.message}`, {
        pattern: message.pattern,
        correlationId: message.correlationId,
      });
      
      // Send error response back
      await this.sendResponse(message.correlationId, {
        success: false,
        error: error.message,
        correlationId: message.correlationId,
      });

      return {
        success: false,
        error: error.message,
        correlationId: message.correlationId,
      };
    }
  }

  /**
   * Send response back to requester
   */
  private async sendResponse(correlationId: string, response: MessageQueueResponse): Promise<void> {
    try {
      await this.producer.send({
        topic: 'doctor-service-responses',
        messages: [{
          key: correlationId,
          value: JSON.stringify(response),
          headers: {
            correlationId: correlationId,
          },
        }],
      });
    } catch (error) {
      this.logger.error(`❌ [KAFKA] Error sending response: ${error.message}`);
    }
  }

  /**
   * Generate a unique correlation ID
   */
  private generateCorrelationId(): string {
    return `mq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all registered patterns
   */
  getRegisteredPatterns(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Clear all listeners (useful for testing)
   */
  clearListeners(): void {
    this.listeners.clear();
    this.logger.log('🧹 [MQ] All listeners cleared');
  }
}
