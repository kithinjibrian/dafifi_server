import { Module } from '@nestjs/common';
import { NotionService } from './notion.service';
import { NotionController } from './notion.controller';
import { RedisModule } from 'src/redis/redis.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotionToken } from './entities/notion.entity';

@Module({
    imports: [
        RedisModule,
        TypeOrmModule.forFeature([NotionToken]),
    ],
    controllers: [NotionController],
    providers: [NotionService],
})
export class NotionModule { }
