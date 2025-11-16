import { Controller, All, Req, Res, Body, Headers, Query } from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';

@Controller()
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('users/*')
  async proxyToUserService(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any,
    @Headers() headers: any,
    @Query() query: any,
  ) {
    const path = req.path.replace('/users', '');
    const method = req.method;
    
    // Forward authorization header
    const authHeaders = {
      ...headers,
      authorization: headers.authorization,
    };

    const result = await this.proxyService.proxyToUserService(
      path,
      method,
      body,
      authHeaders,
    );

    res.status(result.status).json(result.data);
  }

  @All('otp/*')
  async proxyOtpToUserService(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any,
    @Headers() headers: any,
    @Query() query: any,
  ) {
    const path = req.path.replace('/otp', '/otp');
    const method = req.method;
    
    // Forward authorization header
    const authHeaders = {
      ...headers,
      authorization: headers.authorization,
    };

    const result = await this.proxyService.proxyToUserService(
      path,
      method,
      body,
      authHeaders,
    );

    res.status(result.status).json(result.data);
  }

  @All('triage/*')
  async proxyToTriageService(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any,
    @Headers() headers: any,
    @Query() query: any,
  ) {
    const path = req.path.replace('/triage', '');
    const method = req.method;
    
    const authHeaders = {
      ...headers,
      authorization: headers.authorization,
    };

    const result = await this.proxyService.proxyToTriageService(
      path,
      method,
      body,
      authHeaders,
    );

    res.status(result.status).json(result.data);
  }

  @All('notifications/*')
  async proxyToNotificationService(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any,
    @Headers() headers: any,
    @Query() query: any,
  ) {
    const path = req.path.replace('/notifications', '');
    const method = req.method;
    
    const authHeaders = {
      ...headers,
      authorization: headers.authorization,
    };

    const result = await this.proxyService.proxyToNotificationService(
      path,
      method,
      body,
      authHeaders,
    );

    res.status(result.status).json(result.data);
  }
}
