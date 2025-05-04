import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ActionModule } from './action/action.module';
import { ChatModule } from './chat/chat.module';
import { TaskModule } from './task/task.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ErrorModule } from './error/error.module';
import { GoogleModule } from './google/google.module';
import { BuiltinModule } from './builtin/builtin.module';
import { MessageModule } from './message/message.module';
import { NotionModule } from './notion/notion.module';
import { LinkedinModule } from './linkedin/linkedin.module';
import { RedisModule } from './redis/redis.module';
import { HubspotModule } from './hubspot/hubspot.module';
import { LughaModule } from './lugha/lugha.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { OpenAIModule } from './openai/openai.module';
import { MemoryModule } from './memory/memory.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [
        ActionModule,
        ChatModule,
        UsersModule,
        AuthModule,
        ErrorModule,
        GoogleModule,
        BuiltinModule,
        MessageModule,
        NotionModule,
        HubspotModule,
        RedisModule,
        LughaModule,
        OpenAIModule,
        MemoryModule,
        LinkedinModule,
        TaskModule,
        ScheduleModule.forRoot(),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'mysql',
                host: configService.get<string>('MYSQL_HOST'),
                port: configService.get<number>('MYSQL_PORT'),
                username: configService.get<string>('MYSQL_USERNAME'),
                password: configService.get<string>('MYSQL_PASSWORD'),
                database: configService.get<string>('MYSQL_DATABASE'),
                autoLoadEntities: true,
                synchronize: true // ⚠️ Change to false in production
            }),
        }),
        ThrottlerModule.forRoot([
            {
                name: 'short',
                ttl: 1000,
                limit: 10,
            },
            {
                name: 'medium',
                ttl: 10000,
                limit: 30
            },
            {
                name: 'long',
                ttl: 60000,
                limit: 100
            }
        ]),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
