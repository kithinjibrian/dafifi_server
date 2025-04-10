import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { builtin } from '@kithinji/tlugha'

import { AppModule } from './app.module';
import { ChatService } from './chat/chat.service';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: [
            'https://chat.dafifi.net',
            'http://localhost:4000',
        ],
        credentials: true,
    });

    app.use(cookieParser());

    app.useGlobalPipes(new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }));

    const config = new DocumentBuilder()
        .setTitle('Dafifi API')
        .setDescription('API description')
        .setVersion('v0.0.1 - Amethyst')
        .addTag('dafifi')
        .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api', app, documentFactory);

    // const chatService = app.get(ChatService)
    // const chat = chatService.();

    console.log(builtin)

    await app.listen(process.env.PORT ?? 3000);
}

bootstrap();


