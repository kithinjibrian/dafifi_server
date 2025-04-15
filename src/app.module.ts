import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ActionModule } from './action/action.module';
import { ChatModule } from './chat/chat.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ErrorModule } from './error/error.module';
import { GoogleModule } from './google/google.module';
import { BuiltinModule } from './builtin/builtin.module';
import { MessageModule } from './message/message.module';
import { NotionModule } from './notion/notion.module';
import { RedisModule } from './redis/redis.module';

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
        RedisModule,
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
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
