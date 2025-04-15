import { Module } from '@nestjs/common';
import { BuiltinService } from './builtin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GToken } from 'src/google/entities/google.entity';
import { RedisModule } from 'src/redis/redis.module';
import { NotionToken } from 'src/notion/entities/notion.entity';

@Module({
    imports: [
        RedisModule,
        TypeOrmModule.forFeature([
            GToken,
            NotionToken
        ])
    ],
    providers: [BuiltinService],
})
export class BuiltinModule { }
