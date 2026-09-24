/**
 * ============================================================================
 * EMAIL MODULE
 * ============================================================================
 * Encapsulates the EmailService, responsible for sending transactional emails.
 * Exported so other modules (like AuthModule) can inject EmailService.
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService], // Exported for use in AuthModule (welcome email)
})
export class EmailModule {}
