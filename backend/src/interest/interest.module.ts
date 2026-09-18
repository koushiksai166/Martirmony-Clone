import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InterestController } from './interest.controller';
import { InterestService } from './interest.service';

@Module({ imports: [PrismaModule], controllers: [InterestController], providers: [InterestService] })
export class InterestModule {}
