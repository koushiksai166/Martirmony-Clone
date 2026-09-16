import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { AdminService } from './admin.service';

class RoleDto { @IsEnum(Role) role: Role; }

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}
  @Get('users') users() { return this.admin.listUsers(); }
  @Delete('users/:id') deleteUser(@Param('id') id: string) { return this.admin.deleteUser(id); }
  @Patch('users/:id/role') role(@Param('id') id: string, @Body() dto: RoleDto) { return this.admin.setUserRole(id, dto.role); }
  @Get('profiles/pending') pending() { return this.admin.pendingProfiles(); }
  @Patch('profiles/:id/verify') verify(@Param('id') id: string) { return this.admin.verifyProfile(id, true); }
  @Patch('profiles/:id/reject') reject(@Param('id') id: string) { return this.admin.verifyProfile(id, false); }
  @Get('reports') reports() { return this.admin.reports(); }
  @Patch('reports/:id/resolve') resolve(@Param('id') id: string) { return this.admin.resolveReport(id); }
}
