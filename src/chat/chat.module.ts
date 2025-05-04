import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { UsersModule } from 'src/users/users.module';
import { Message } from 'src/message/entities/message.entity';
import { User } from 'src/users/entities/users.entity';
import { ContextService } from './context.service';
import { Memory } from 'src/memory/entities/memory.entity';
import { TaskModule } from 'src/task/task.module';

@Module({
    imports: [
        UsersModule,
        TaskModule,
        TypeOrmModule.forFeature([
            Chat,
            Message,
            User,
            Memory
        ])
    ],
    controllers: [ChatController],
    providers: [ChatService, ContextService],
    exports: [ChatService, ContextService],
})
export class ChatModule { }
