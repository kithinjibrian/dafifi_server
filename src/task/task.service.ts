import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Repository } from 'typeorm';
import { UpdateTaskDto } from './dto/update-task.dto';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class TaskService {
    constructor(
        @InjectRepository(Task)
        private taskRepository: Repository<Task>,
        private readonly redisService: RedisService,
    ) {
    }

    async update(id: string, updateTaskDto: UpdateTaskDto) {
        const result = await this.taskRepository.update(id, updateTaskDto);

        if (result.affected === 0) {
            throw new NotFoundException(`Task with ID "${id}" not found`);
        }

        const task = await this.taskRepository.findOne({ 
            where: { id },
            relations: ["chat"]
        });

        if(!task) throw new NotFoundException(`Task with ID "${id}" not found`);

        if("state" in updateTaskDto) {
            if(updateTaskDto.state == "stopped") {
                await this.redisService.delete(`task:${task.filename}`)
            } else if(updateTaskDto.state == "running") {
                await this.redisService.set(`task:${task.filename}`, JSON.stringify({
                    username: task.username,
                    chat_id: task.chat.id,
                    expression: task.data.expression
                }));
            }
        } 

        return task;
    }
}