import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { MessageService } from './message.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdateMessageDto } from './dto/update-chat.dto';

@Controller('message')
export class MessageController {
    constructor(private readonly messageService: MessageService) { }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
        return this.messageService.update(id, updateMessageDto);
    }
}