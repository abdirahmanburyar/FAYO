import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { CallsService } from './calls.service';
import { CreateCallDto } from './dto/create-call.dto';

@Controller('calls')
@UseGuards(ThrottlerGuard)
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  createCall(@Body() createCallDto: CreateCallDto) {
    return this.callsService.createCall(createCallDto);
  }

  @Get('participant/:appointmentId')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  getParticipantCredentials(
    @Param('appointmentId') appointmentId: string,
    @Query('userId') userId: string,
  ) {
    if (!userId) {
      throw new Error('userId query parameter is required');
    }
    return this.callsService.getParticipantCredentials(appointmentId, userId);
  }

  @Post(':appointmentId/end')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  endCall(
    @Param('appointmentId') appointmentId: string,
    @Body('userId') userId: string,
  ) {
    if (!userId) {
      throw new Error('userId is required in request body');
    }
    return this.callsService.endCall(appointmentId, userId);
  }

  @Post(':appointmentId/accept')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  acceptCall(
    @Param('appointmentId') appointmentId: string,
    @Body('patientId') patientId: string,
    @Body('channelName') channelName: string,
  ) {
    if (!patientId || !channelName) {
      throw new Error('patientId and channelName are required in request body');
    }
    return this.callsService.acceptCall(appointmentId, patientId, channelName);
  }
}

