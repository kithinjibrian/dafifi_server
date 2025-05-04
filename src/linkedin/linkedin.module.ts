import { Module } from '@nestjs/common';
import { LinkedinService } from './linkedin.service';
import { LinkedinController } from './linkedin.controller';
import { RedisModule } from 'src/redis/redis.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LinkedinToken } from './entities/linkedin.entity';

@Module({
    imports: [
        RedisModule,
        TypeOrmModule.forFeature([LinkedinToken]),
    ],
    controllers: [LinkedinController],
    providers: [LinkedinService],
})
export class LinkedinModule { }
