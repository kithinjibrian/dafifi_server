import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpenAI } from './entities/openai.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([OpenAI]),
    ],
    controllers: [],
    providers: [],
})
export class OpenAIModule { }
