/**
 * ============================================================================
 * PROFILE MODULE
 * ============================================================================
 * Bundles Profile and PartnerPreference controllers + services.
 * Both features share the same database module and are co-located because
 * preferences are conceptually tied to the user's profile.
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { PreferencesController } from './preferences.controller';
import { PreferencesService } from './preferences.service';
import { SavedSearchController } from './saved-search.controller';
import { SavedSearchService } from './saved-search.service';

@Module({
  imports: [PrismaModule, NotificationModule, ScheduleModule.forRoot()],
  controllers: [ProfileController, PreferencesController, SavedSearchController],
  providers: [ProfileService, PreferencesService, SavedSearchService],
  exports: [ProfileService],
})
export class ProfileModule {}