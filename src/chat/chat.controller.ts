import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Request, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { DeleteChatsDto, CreateMessageDto, StarChatsDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    async prompt(@Res() res: Response, @Request() req, @Body() createMessageDto: CreateMessageDto) {
        const stream = await this.chatService.prompt(createMessageDto, req.user.username);
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        stream.pipe(res);
    }

    @UseGuards(JwtAuthGuard)
    @Post('delete')
    remove(@Request() req, @Body() deleteChatDto: DeleteChatsDto) {
        return this.chatService.remove(deleteChatDto, req.user.username);
    }

    @UseGuards(JwtAuthGuard)
    @Post('star')
    star(@Request() req, @Body() starChatDto: StarChatsDto) {
        return this.chatService.star(starChatDto, req.user.username);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(@Request() req) {
        return await this.chatService.findAll(req.user.username);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.chatService.findOne(id, req.user.username);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateChatDto: UpdateChatDto) {
        return this.chatService.update(+id, updateChatDto);
    }
}
