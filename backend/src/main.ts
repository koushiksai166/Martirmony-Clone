/**
 * ============================================================================
 * MAIN APPLICATION BOOTSTRAP (ENTRY POINT)
 * ============================================================================
 * This is the root initialization file for the NestJS backend application.
 *
 * Responsibilities:
 * 1. Initialize NestFactory with express platform and enable rawBody parsing
 *    (essential for Razorpay HMAC webhook signature verification).
 * 2. Configure HTTP Security Headers using Helmet (including crossOriginResourcePolicy).
 * 3. Configure static file serving for local image uploads (development mode).
 * 4. Configure Cross-Origin Resource Sharing (CORS) with frontend whitelist.
 * 5. Set up global ValidationPipe with request payload sanitization and transformation.
 * 6. Generate and mount Swagger OpenAPI documentation at `/api`.
 * 7. Bind to the specified PORT (default 5001) and start listening for connections.
 * ============================================================================
 */

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as express from 'express';

async function bootstrap() {
  /**
   * Initialize NestJS application with rawBody support enabled.
   * `rawBody: true` preserves the unparsed request buffer on `req.rawBody`.
   * This is required by Razorpay payment webhooks to compute and verify
   * HMAC-SHA256 signatures before JSON serialization.
   */
  const app = await NestFactory.create(AppModule, { rawBody: true });

  /**
   * Security Headers (Helmet):
   * Protects against well-known web vulnerabilities by setting appropriate HTTP headers.
   * 'crossOriginResourcePolicy: cross-origin' allows profile pictures hosted on the
   * backend to be loaded in the frontend without cross-origin blocking.
   */
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  /**
   * Static File Serving for Uploaded Assets:
   * Local disk storage fallback for development and basic hosting.
   * Ensures the `uploads` directory exists, then maps `/uploads/*` HTTP requests
   * directly to disk files. For production, Cloudinary / S3 / R2 is recommended.
   */
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  /**
   * Cross-Origin Resource Sharing (CORS):
   * Restricts incoming requests to only the authorized frontend origin.
   * Supports credentials (cookies / Authorization headers) across origins.
   */
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  /**
   * Global Validation Pipe:
   * Automatically validates every incoming request against its respective DTO class:
   * - whitelist: true -> Strips out any properties not declared in the DTO (prevents property injection).
   * - forbidNonWhitelisted: true -> Throws a 400 Bad Request error if unexpected properties are sent.
   * - transform: true -> Automatically transforms input payloads to DTO instance types (e.g. string to number).
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /**
   * OpenAPI (Swagger) API Documentation:
   * Accessible at `http://localhost:5001/api`.
   * Enables interactive testing of all endpoints and documents JWT Bearer authentication.
   */
  const config = new DocumentBuilder()
    .setTitle('Saanjh Matrimony API')
    .setDescription(
      'REST API documentation for the Saanjh Matrimony platform, including Auth, Profiles, Matchmaking, Chat, and Payments.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  /**
   * Start HTTP Listener:
   * Listens on process.env.PORT or defaults to port 5001.
   */
  const port = process.env.PORT ?? 5001;
  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📚 Swagger Docs: http://localhost:${port}/api`);
}

// Bootstrap the application
bootstrap();