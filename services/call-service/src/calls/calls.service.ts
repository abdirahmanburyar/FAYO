import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CallStatus, CallType, Prisma, CallSession } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../common/database/prisma.service';
import { AgoraService, AgoraRole } from '../agora/agora.service';
import { KafkaService } from '../messaging/kafka/kafka.service';
import { RabbitmqService } from '../messaging/rabbitmq/rabbitmq.service';
import { CreateCallSessionDto } from './dto/create-call-session.dto';
import { CallParticipantRole } from './dto/request-call-token.dto';
import { RtcRole } from 'agora-access-token';

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly agoraService: AgoraService,
    private readonly kafkaService: KafkaService,
    private readonly rabbitmqService: RabbitmqService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createSession(initiatorId: string, dto: CreateCallSessionDto) {
    try {
      this.logger.log(`Creating call session: initiator=${initiatorId}, recipient=${dto.recipientId}`);
      
      const channelName = dto.channelName?.trim() || this.generateChannelName(initiatorId);
      const expiresAt = this.calculateExpiry();

      const session = await this.prisma.callSession.create({
        data: {
          channelName,
          initiatorId,
          recipientId: dto.recipientId,
          callType: dto.callType ?? CallType.VIDEO,
          expiresAt,
          metadata: dto.metadata as Prisma.InputJsonValue,
        },
      });

      this.logger.log(`Call session created: ${session.id}`);

      const credential = this.buildCredential(session.channelName, initiatorId, CallParticipantRole.HOST);

      await this.publishLifecycle('CALL_SESSION_CREATED', session);
      this.eventEmitter.emit('call.session.created', { session, credential });

      return {
        message: 'Call session created',
        session,
        credential,
      };
    } catch (error) {
      this.logger.error(`Error creating call session: ${error.message}`, error.stack);
      throw error;
    }
  }

  async issueToken(sessionId: string, userId: string, role: CallParticipantRole = CallParticipantRole.HOST) {
    let session = await this.findSession(sessionId);
    session = await this.ensureParticipant(session, userId);
    this.ensureNotExpired(session);

    const credential = this.buildCredential(session.channelName, userId, role);

    if (session.status === CallStatus.PENDING) {
      session = await this.prisma.callSession.update({
        where: { id: session.id },
        data: {
          status: CallStatus.RINGING,
          startedAt: session.startedAt ?? new Date(),
        },
      });
      await this.publishLifecycle('CALL_SESSION_RINGING', session);
      this.eventEmitter.emit('call.session.updated', session);
    }

    return {
      message: 'Token issued',
      session,
      credential,
    };
  }

  async getSessionForUser(sessionId: string, userId: string) {
    const session = await this.findSession(sessionId);
    this.assertParticipant(session, userId);
    return session;
  }

  async updateStatus(sessionId: string, userId: string, status: CallStatus) {
    let session = await this.findSession(sessionId);
    session = await this.ensureParticipant(session, userId);

    const data: Prisma.CallSessionUpdateInput = {
      status,
      updatedAt: new Date(),
    };

    if (status === CallStatus.ACTIVE && !session.startedAt) {
      data.startedAt = new Date();
    }

    const terminalStatuses: CallStatus[] = [
      CallStatus.CANCELLED,
      CallStatus.COMPLETED,
      CallStatus.EXPIRED,
    ];
    if (terminalStatuses.includes(status)) {
      data.endedAt = new Date();
    }

    const updated = await this.prisma.callSession.update({
      where: { id: sessionId },
      data,
    });

    await this.publishLifecycle('CALL_SESSION_STATUS_CHANGED', updated);
    this.eventEmitter.emit('call.session.updated', updated);

    return {
      message: 'Call session updated',
      session: updated,
    };
  }

  private calculateExpiry() {
    return new Date(Date.now() + this.agoraService.tokenTtl * 1000);
  }

  private generateChannelName(userId: string) {
    return `fayo_call_${userId}_${randomUUID()}`;
  }

  private buildCredential(channelName: string, userId: string, role: CallParticipantRole) {
    const rtcRole: AgoraRole =
      role === CallParticipantRole.HOST ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const tokenPayload = this.agoraService.generateToken(channelName, userId, rtcRole);
    return {
      ...tokenPayload,
      channelName,
      role,
      rtcUserId: userId,
    };
  }

  private async ensureParticipant(session: CallSession, userId: string) {
    if (this.isParticipant(session, userId)) {
      return session;
    }

    if (!session.recipientId) {
      this.logger.log(`Assigning user ${userId} as recipient for call session ${session.id}`);
      return this.prisma.callSession.update({
        where: { id: session.id },
        data: {
          recipientId: userId,
          status: CallStatus.RINGING,
          startedAt: session.startedAt ?? new Date(),
        },
      });
    }

    throw new ForbiddenException('You are not allowed to join this call');
  }

  private isParticipant(session: CallSession, userId: string) {
    return session.initiatorId === userId || session.recipientId === userId;
  }

  private assertParticipant(session: CallSession, userId: string) {
    if (!this.isParticipant(session, userId)) {
      throw new ForbiddenException('You are not part of this call');
    }
  }

  private ensureNotExpired(session: CallSession) {
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Call session has expired');
    }
  }

  private async findSession(sessionId: string) {
    const session = await this.prisma.callSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Call session not found');
    }
    return session;
  }

  private async publishLifecycle(event: string, session: CallSession) {
    await Promise.all([
      this.kafkaService.publish(event, session),
      this.rabbitmqService.publishCommand(`calls.${event.toLowerCase()}`, session),
    ]);
  }
}

