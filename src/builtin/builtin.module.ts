import { Module } from '@nestjs/common';
import { BuiltinService } from './builtin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GToken } from 'src/google/entities/google.entity';
import { RedisModule } from 'src/redis/redis.module';
import { ChatModule } from 'src/chat/chat.module';
import { TaskModule } from 'src/task/task.module';
import { Task } from 'src/task/entities/task.entity';
import { NotionToken } from 'src/notion/entities/notion.entity';
import { LinkedinToken } from 'src/linkedin/entities/linkedin.entity';
import { HubspotToken } from 'src/hubspot/entities/hubspot.entity';
import { OpenAI } from 'src/openai/entities/openai.entity';
import { User } from 'src/users/entities/users.entity';

@Module({
    imports: [
        RedisModule,
        ChatModule,
        TaskModule,
        TypeOrmModule.forFeature([
            GToken,
            NotionToken,
            HubspotToken,
            LinkedinToken,
            OpenAI,
            User,
            Task
        ])
    ],
    providers: [BuiltinService],
})
export class BuiltinModule { }
