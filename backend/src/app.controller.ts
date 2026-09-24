/**
 * ============================================================================
 * ROOT APPLICATION CONTROLLER (AppController)
 * ============================================================================
 * Handles root-level and infrastructure health-check endpoints.
 * Used by load balancers, cloud hosting (e.g. Render, AWS, Docker), and uptime monitors.
 * ============================================================================
 */

import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health & Status')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Root welcome endpoint:
   * GET / -> Returns basic greeting string.
   */
  @Get()
  @ApiOperation({ summary: 'API welcome endpoint' })
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Infrastructure Health Check endpoint:
   * GET /health -> Returns 200 OK with status.
   * Utilized by Render/Docker health check probes to confirm container liveness.
   */
  @Get('health')
  @ApiOperation({ summary: 'Liveness health check for deployment orchestration' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}