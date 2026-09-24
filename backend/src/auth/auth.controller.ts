/**
 * ============================================================================
 * AUTH CONTROLLER
 * ============================================================================
 * Exposes HTTP endpoints under the `/auth` prefix for all authentication flows.
 *
 * Endpoints:
 * POST   /auth/register        – Create a new user account (public)
 * POST   /auth/login           – Authenticate and receive tokens (public)
 * POST   /auth/refresh         – Rotate refresh token for new access token (public)
 * POST   /auth/logout          – Invalidate session by removing refresh token (protected)
 * GET    /auth/me              – Get currently authenticated user info (protected)
 * PATCH  /auth/change-password – Update password after identity verification (protected)
 * ============================================================================
 */

import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user account.
   * Public endpoint — no auth required.
   */
  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User account created successfully' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Authenticate with email and password credentials.
   * Returns access_token and refresh_token on success.
   */
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful; tokens returned' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Exchange a valid refresh token for a new access token and rotated refresh token.
   * Public endpoint — does NOT use JwtAuthGuard.
   */
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token and obtain a new access token' })
  @ApiResponse({ status: 200, description: 'New access and refresh tokens issued' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  /**
   * Invalidate the current session by removing the stored refresh token.
   * Protected — requires valid access token.
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log out and invalidate refresh token' })
  logout(@GetUser() user: { id: string }) {
    return this.authService.logout(user.id);
  }

  /**
   * Retrieve details of the currently authenticated user.
   * Useful for frontend session bootstrapping after page reload.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  @ApiResponse({ status: 200, description: 'Authenticated user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized — token missing or invalid' })
  getMe(@GetUser() user: { id: string }) {
    return this.authService.getMe(user.id);
  }

  /**
   * Update the user's password after verifying their current one.
   * Protected — requires valid access token.
   */
  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change account password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  @ApiResponse({ status: 400, description: 'New password must differ from current' })
  changePassword(
    @GetUser() user: { id: string },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, dto);
  }
}