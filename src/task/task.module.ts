import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { RedisModule } from 'src/redis/redis.module';

@Module({
    imports: [
        RedisModule,
        TypeOrmModule.forFeature([
            Task
        ])
    ],
    controllers: [TaskController],
    providers: [TaskService],
    exports: [TaskService]
})
export class TaskModule { }
