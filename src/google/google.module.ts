import { Module } from '@nestjs/common';
import { GoogleService } from './google.service';
import { GoogleController } from './google.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GToken } from './entities/google.entity';
import { RedisModule } from 'src/redis/redis.module';

@Module({
    imports: [
        RedisModule,
        TypeOrmModule.forFeature([
            GToken,
        ])
    ],
    controllers: [GoogleController],
    providers: [GoogleService],
})
export class GoogleModule { }
