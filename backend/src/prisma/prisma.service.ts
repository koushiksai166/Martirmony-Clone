/**
 * ============================================================================
 * PRISMA SERVICE (Database Connection Provider)
 * ============================================================================
 * Extends PrismaClient to provide dependency-injectable database access
 * across the NestJS application.
 *
 * Lifecycle:
 * Implements OnModuleInit to establish the database connection pool eagerly
 * when the application boots up.
 * ============================================================================
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /**
   * Connect to the PostgreSQL database on module initialization.
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Gracefully close database connection pool when the application shuts down.
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}