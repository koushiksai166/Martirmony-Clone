/**
 * ============================================================================
 * GET USER CUSTOM PARAMETER DECORATOR (@GetUser)
 * ============================================================================
 * Extracts the authenticated user object from the HTTP request context.
 *
 * How it works:
 * 1. When an endpoint is protected with `@UseGuards(JwtAuthGuard)`, Passport's
 *    JwtStrategy validates the token and attaches the decoded user payload to `req.user`.
 * 2. `@GetUser()` retrieves `req.user` inside controller route handler methods.
 * 3. Supports extracting a specific field (e.g., `@GetUser('id') userId: string`).
 *
 * Example Usage:
 * @Get('me')
 * getMe(@GetUser() user: AuthenticatedUser) { ... }
 *
 * @Get('me/id')
 * getId(@GetUser('id') userId: string) { ... }
 * ============================================================================
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    // Switch execution context to HTTP request
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // If a specific property was requested (e.g. @GetUser('id')), return that property
    if (data && user) {
      return user[data];
    }

    // Otherwise return the complete authenticated user object
    return user;
  },
);