import { Module } from '@nestjs/common';
import { BuiltinService } from './builtin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GToken } from 'src/google/entities/google.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            GToken,
        ])
    ],
    providers: [BuiltinService],
})
export class BuiltinModule { }
