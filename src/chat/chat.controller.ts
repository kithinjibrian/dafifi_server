import {
    Controller,
    Sse,
    Req,
    Query,
    MessageEvent,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Res,
    Request,
    UseGuards
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChatService } from './chat.service';
import { DeleteChatsDto, CreateMessageDto, StarChatsDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @UseGuards(JwtAuthGuard)
    @Sse('prompt')
    prompt(
        @Request() req,
        @Query() query: any
    ): Observable<MessageEvent> {
        return new Observable<MessageEvent>((subscriber) => {
            // Wrap the async logic in an IIFE
            (async () => {
                try {
                    const stream = this.chatService.prompt(
                        query,
                        (req as any).user.username,
                    );

                    for await (const chunk of stream) {
                        subscriber.next({ data: chunk });
                    }

                    subscriber.complete();
                } catch (error) {
                    subscriber.error(error);
                }
            })();

            // Teardown logic if needed (e.g. abort controller)
            return () => {
                // Optional cleanup logic when client disconnects
            };
        });
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
