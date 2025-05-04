import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Memory } from './entities/memory.entity'

@Module({
    imports: [
        TypeOrmModule.forFeature([Memory]),
    ],
    controllers: [],
    providers: [],
})
export class MemoryModule { }
