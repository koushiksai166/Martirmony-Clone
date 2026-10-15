import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { SavedSearchService } from './saved-search.service';

class SaveSearchDto {
  @IsString()
  name: string;

  @IsObject()
  filters: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  alertEnabled?: boolean;
}

@ApiTags('Saved Searches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile/saved-searches')
export class SavedSearchController {
  constructor(private readonly savedSearch: SavedSearchService) {}

  @Post()
  @ApiOperation({ summary: 'Save a search with optional alert' })
  save(@GetUser() user: any, @Body() dto: SaveSearchDto) {
    return this.savedSearch.save(user.id, dto.name, dto.filters, dto.alertEnabled);
  }

  @Get()
  @ApiOperation({ summary: 'List my saved searches' })
  list(@GetUser() user: any) {
    return this.savedSearch.list(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a saved search' })
  remove(@GetUser() user: any, @Param('id') id: string) {
    return this.savedSearch.remove(user.id, id);
  }

  @Patch(':id/alert')
  @ApiOperation({ summary: 'Toggle alert on a saved search' })
  toggleAlert(
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() body: { alertEnabled: boolean },
  ) {
    return this.savedSearch.toggleAlert(user.id, id, body.alertEnabled);
  }
}
