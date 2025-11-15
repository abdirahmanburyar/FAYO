import { Module } from '@nestjs/common';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { MessageQueueModule } from '../common/message-queue/message-queue.module';
import { PrismaService } from '../common/database/prisma.service';

@Module({
  imports: [MessageQueueModule],
  controllers: [DoctorsController],
  providers: [DoctorsService, PrismaService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
