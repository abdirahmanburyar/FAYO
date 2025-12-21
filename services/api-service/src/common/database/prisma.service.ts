import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Unified Prisma Service for Monolithic API
 * 
 * This service connects to a single PostgreSQL database with multiple schemas:
 * - users schema (user-service)
 * - hospitals schema (hospital-service)
 * - public schema (doctor-service, specialty-service)
 * - appointments schema (appointment-service)
 * - payments schema (payment-service)
 * - ads schema (ads-service)
 * 
 * The Prisma schema should be configured with multiSchema support.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

