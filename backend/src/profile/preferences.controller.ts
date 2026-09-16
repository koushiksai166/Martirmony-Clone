import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { PartnerPreferenceDto } from './dto/partner-preference.dto';
import { PreferencesService } from './preferences.service';

@ApiTags('Partner preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get my partner preferences' })
  find(@GetUser() user: any) {
    return this.preferencesService.find(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Create or update partner preferences' })
  upsert(@GetUser() user: any, @Body() dto: PartnerPreferenceDto) {
    return this.preferencesService.upsert(user.id, dto);
  }
}
