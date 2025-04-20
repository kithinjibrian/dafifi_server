import { Module } from '@nestjs/common';
import { HubspotService } from './hubspot.service';
import { HubspotController } from './hubspot.controller';
import { RedisModule } from 'src/redis/redis.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HubspotToken } from './entities/hubspot.entity';

@Module({
    imports: [
        RedisModule,
        TypeOrmModule.forFeature([HubspotToken]),
    ],
    controllers: [HubspotController],
    providers: [HubspotService],
})
export class HubspotModule { }
