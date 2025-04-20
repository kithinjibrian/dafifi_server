import { Module } from '@nestjs/common';
import { LughaService } from './lugha.service';

@Module({
    imports: [],
    providers: [LughaService],
})
export class LughaModule { }
