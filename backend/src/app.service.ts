/**
 * ============================================================================
 * ROOT APPLICATION SERVICE (AppService)
 * ============================================================================
 * Provides root application-level business logic.
 * ============================================================================
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /**
   * Returns a standard welcome message.
   */
  getHello(): string {
    return 'Welcome to Saanjh Matrimony API';
  }
}
