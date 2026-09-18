import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SafetyController } from './safety.controller';
import { SafetyService } from './safety.service';

@Module({ imports: [PrismaModule], controllers: [SafetyController], providers: [SafetyService] })
export class SafetyModule {}
