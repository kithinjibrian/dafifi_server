import { Module } from '@nestjs/common';
import { BuiltinService } from './builtin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GToken } from 'src/google/entities/google.entity';
import { RedisModule } from 'src/redis/redis.module';
import { NotionToken } from 'src/notion/entities/notion.entity';
import { HubspotToken } from 'src/hubspot/entities/hubspot.entity';
import { OpenAI } from 'src/openai/entities/openai.entity';

@Module({
    imports: [
        RedisModule,
        TypeOrmModule.forFeature([
            GToken,
            NotionToken,
            HubspotToken,
            OpenAI
        ])
    ],
    providers: [BuiltinService],
})
export class BuiltinModule { }
