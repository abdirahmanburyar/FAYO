import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger('SecurityMiddleware');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || 'Unknown';
    const timestamp = new Date().toISOString();

    // Log suspicious activities
    this.logSuspiciousActivity(req);

    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Log request
    this.logger.log(
      `${method} ${originalUrl} - IP: ${ip} - User-Agent: ${userAgent} - ${timestamp}`,
    );

    next();
  }

  private logSuspiciousActivity(req: Request) {
    const { originalUrl, headers, body } = req;
    const userAgent = headers['user-agent'] || '';

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\.\./,  // Directory traversal
      /<script/i,  // XSS attempts
      /union.*select/i,  // SQL injection
      /drop.*table/i,  // SQL injection
      /javascript:/i,  // JavaScript injection
    ];

    const suspiciousUserAgents = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
    ];

    // Check URL for suspicious patterns
    if (suspiciousPatterns.some(pattern => pattern.test(originalUrl))) {
      this.logger.warn(`🚨 Suspicious URL pattern detected: ${originalUrl} - IP: ${req.ip}`);
    }

    // Check User-Agent for suspicious patterns
    if (suspiciousUserAgents.some(pattern => pattern.test(userAgent))) {
      this.logger.warn(`🚨 Suspicious User-Agent detected: ${userAgent} - IP: ${req.ip}`);
    }

    // Check for SQL injection in body
    if (body && typeof body === 'object') {
      const bodyString = JSON.stringify(body);
      if (suspiciousPatterns.some(pattern => pattern.test(bodyString))) {
        this.logger.warn(`🚨 Suspicious request body detected: ${bodyString} - IP: ${req.ip}`);
      }
    }
  }
}
