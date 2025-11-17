import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CreateCallSessionDto } from './dto/create-call-session.dto';
import { RequestCallTokenDto } from './dto/request-call-token.dto';
import { UpdateCallStatusDto } from './dto/update-call-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('calls')
@UseGuards(JwtAuthGuard)
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post('session')
  async createSession(@Request() req, @Body() dto: CreateCallSessionDto) {
    try {
      return await this.callsService.createSession(req.user.id, dto);
    } catch (error) {
      console.error('Error creating call session:', error);
      throw error;
    }
  }

  @Post('session/:id/token')
  issueToken(
    @Request() req,
    @Param('id') sessionId: string,
    @Body() dto: RequestCallTokenDto,
  ) {
    return this.callsService.issueToken(sessionId, req.user.id, dto.role);
  }

  @Get('session/:id')
  getSession(@Request() req, @Param('id') sessionId: string) {
    return this.callsService.getSessionForUser(sessionId, req.user.id);
  }

  @Patch('session/:id/status')
  updateStatus(
    @Request() req,
    @Param('id') sessionId: string,
    @Body() dto: UpdateCallStatusDto,
  ) {
    return this.callsService.updateStatus(sessionId, req.user.id, dto.status);
  }
}

