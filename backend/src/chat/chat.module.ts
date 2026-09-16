import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({ imports: [PrismaModule, JwtModule.register({ secret: process.env.JWT_SECRET })], controllers: [ChatController], providers: [ChatService, ChatGateway] })
export class ChatModule {}
