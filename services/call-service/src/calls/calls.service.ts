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
import { ZoomService, ZoomRole } from '../zoom/zoom.service';
import { KafkaService } from '../messaging/kafka/kafka.service';
import { RabbitmqService } from '../messaging/rabbitmq/rabbitmq.service';
import { CreateCallSessionDto } from './dto/create-call-session.dto';
import { CallParticipantRole } from './dto/request-call-token.dto';

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly zoomService: ZoomService,
    private readonly kafkaService: KafkaService,
    private readonly rabbitmqService: RabbitmqService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createSession(initiatorId: string, dto: CreateCallSessionDto) {
    try {
      this.logger.log(`Creating call session: initiator=${initiatorId}, recipient=${dto.recipientId}`);
      
      const sessionName = dto.channelName?.trim() || this.generateSessionName(initiatorId);
      const expiresAt = this.calculateExpiry();

      const session = await this.prisma.callSession.create({
        data: {
          channelName: sessionName, // Keep channelName in DB for backward compatibility (stores sessionName)
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error creating call session: ${errorMessage}`, errorStack);
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

  async getUserSessions(userId: string) {
    const now = new Date();
    const sessions = await this.prisma.callSession.findMany({
      where: {
        OR: [
          { initiatorId: userId },
          { recipientId: userId },
        ],
        status: {
          in: [CallStatus.PENDING, CallStatus.RINGING, CallStatus.ACTIVE],
        },
        expiresAt: {
          gt: now,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return sessions;
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
      // Log call start for usage tracking
      this.logger.log(
        `📞 Call started: ${session.id}, Type: ${session.callType}, Channel: ${session.channelName}`,
      );
    }

    const terminalStatuses: CallStatus[] = [
      CallStatus.CANCELLED,
      CallStatus.COMPLETED,
      CallStatus.EXPIRED,
    ];
    if (terminalStatuses.includes(status)) {
      data.endedAt = new Date();
      // Log call end and calculate duration for usage tracking
      if (session.startedAt) {
        const duration = Math.floor(
          (new Date().getTime() - session.startedAt.getTime()) / 1000 / 60,
        );
        const participants = session.recipientId ? 2 : 1;
        const totalMinutes = duration * participants;
        
        this.logger.log(
          `📞 Call ended: ${session.id}, Duration: ${duration} min, Participants: ${participants}, Total minutes: ${totalMinutes}`,
        );
        
        // TODO: Store usage metrics in database for reporting
        // You can create a CallUsage table to track this for analytics
      }
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
    return new Date(Date.now() + this.zoomService.tokenTtl * 1000);
  }

  private generateSessionName(userId: string) {
    // Zoom session names can be longer, but we'll keep a similar format for consistency
    // Format: fayo_<shortUserId>_<shortUUID>
    const shortUserId = userId.substring(0, 8);
    const shortUuid = randomUUID().replace(/-/g, '').substring(0, 16);
    const sessionName = `fayo_${shortUserId}_${shortUuid}`;
    
    // Zoom session names can be up to 200 characters
    return sessionName;
  }

  private buildCredential(sessionName: string, userId: string, role: CallParticipantRole) {
    const zoomRole = role === CallParticipantRole.HOST ? ZoomRole.HOST : ZoomRole.PARTICIPANT;
    const tokenPayload = this.zoomService.generateToken(sessionName, userId, zoomRole);
    return {
      ...tokenPayload,
      sessionName,
      channelName: sessionName, // Keep for backward compatibility
      role,
      userIdentity: userId,
      rtcUserId: userId, // Keep for backward compatibility
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

