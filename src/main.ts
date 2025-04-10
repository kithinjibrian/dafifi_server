import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { builtin_init } from './builtin';

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

    builtin_init();

    await app.listen(process.env.PORT ?? 3000);
}

bootstrap();


