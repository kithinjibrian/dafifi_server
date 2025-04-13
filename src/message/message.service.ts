import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { Repository } from 'typeorm';
import { UpdateMessageDto } from './dto/update-chat.dto';

@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
    ) {
    }

    async update(id: string, updateMessageDto: UpdateMessageDto) {
        await this.messageRepository.update(id, updateMessageDto);
        return 'update message';
    }
}