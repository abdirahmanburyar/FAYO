import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
        ? exception.message
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'string' ? message : (message as any).message || 'Internal server error',
      error: typeof message === 'object' ? message : undefined,
    };

    // Log the full error for debugging
    this.logger.error(
      `❌ [EXCEPTION_FILTER] ${request.method} ${request.url}`,
      {
        statusCode: status,
        message: errorResponse.message,
        stack: exception instanceof Error ? exception.stack : undefined,
        body: request.body,
        params: request.params,
        query: request.query,
      }
    );

    response.status(status).json(errorResponse);
  }
}

