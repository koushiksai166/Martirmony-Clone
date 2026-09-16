import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PreferencesController } from './preferences.controller';
import { PreferencesService } from './preferences.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProfileController, PreferencesController],
  providers: [ProfileService, PreferencesService],
})
export class ProfileModule {}