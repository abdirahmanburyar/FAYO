// Type declarations for amqplib to fix TypeScript inference issues
declare module 'amqplib' {
  export interface Connection {
    close(): Promise<void>;
    createChannel(): Promise<Channel>;
    on(event: 'error', callback: (err: Error) => void): void;
    on(event: 'close', callback: () => void): void;
  }

  export interface Channel {
    close(): Promise<void>;
    assertExchange(exchange: string, type: string, options?: any): Promise<any>;
    assertQueue(queue: string, options?: any): Promise<any>;
    bindQueue(queue: string, exchange: string, routingKey: string): Promise<any>;
    publish(exchange: string, routingKey: string, content: Buffer, options?: any): boolean;
    consume(queue: string, callback: (msg: any) => void, options?: any): Promise<any>;
    ack(message: any): void;
    nack(message: any, allUpTo?: boolean, requeue?: boolean): void;
    on(event: 'error', callback: (err: Error) => void): void;
    on(event: 'close', callback: () => void): void;
  }

  export function connect(url: string): Promise<Connection>;
}

