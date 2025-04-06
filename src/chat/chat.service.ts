import axios from 'axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DeleteChatsDto, CreateMessageDto, StarChatsDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import { Readable } from 'stream';
import { UsersService } from 'src/users/users.service';

enum Sender {
    User = 'user',
    Assistant = 'assistant',
}

@Injectable()
export class ChatService {
    private token: string | null = null;
    private tokenExpiration: number | null = null;

    constructor(
        @InjectRepository(Chat)
        private chatRepository: Repository<Chat>,
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
        private usersService: UsersService
    ) { }

    private async getAuthToken() {
        const currentTime = Date.now();
        if (this.token && this.tokenExpiration && currentTime < this.tokenExpiration) {
            return this.token; // Token is still valid
        }

        const tokenResponse = await axios.post("https://kithinji-dafifi.hf.space/login", {
            username: "kithinji",
            password: "password",
        });

        this.token = tokenResponse.data.access_token;
        this.tokenExpiration = currentTime + (tokenResponse.data.expires_in * 1000); // Expiry time
        return this.token;
    }

    private async createNewChat(title: string, username: string): Promise<Chat> {
        const user = await this.usersService.findOne(username);
        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        const chat = this.chatRepository.create({
            title,
            user: { id: user.id }
        });

        return this.chatRepository.save(chat);
    }

    async getChat(chat_id: string, title: string, username: string): Promise<Chat> {
        let chat: Chat | null;

        try {
            if (chat_id && chat_id !== 'new') {
                chat = await this.chatRepository.findOne({ where: { id: chat_id } });

                if (!chat) {
                    chat = await this.createNewChat(title, username);
                }
            } else {
                chat = await this.createNewChat(title, username);
            }

            return chat;
        } catch (e) {
            throw e;
        }
    }

    async prompt(createMessageDto: CreateMessageDto, username: string): Promise<Readable> {
        const { id, message, sender, time, chat_id } = createMessageDto;

        try {
            let chat: Chat = await this.getChat(chat_id, message.slice(0, 20), username);
            let utMessage;

            if (sender === "user") {
                utMessage = this.messageRepository.create({
                    message,
                    sender,
                    time,
                    chat: { id: chat.id },
                });
                await this.messageRepository.save(utMessage);
            } else if (sender === "tool") {
                utMessage = this.messageRepository.findOne({
                    where: {
                        id
                    }
                })
            }

            const msgs = await this.findOne(chat.id, username);
            const prompt = msgs.messages.map((msg) => `< | ${msg.sender} | > ${msg.message}`).join(" ");

            const aiMessage = this.messageRepository.create({
                message: '',
                sender: Sender.Assistant,
                time,
                chat: { id: chat.id },
            });

            await this.messageRepository.save(aiMessage);

            const stream = new Readable({
                read() { },
                highWaterMark: 1024
            });

            // Initial response with IDs
            stream.push(
                JSON.stringify({
                    chat_id: chat.id,
                    umessage_id: utMessage.id,
                    imessage_id: aiMessage.id
                }) + '\n'
            );

            const response = await axios.post("https://kithinji-dafifi.hf.space/mock",
                {
                    prompt,
                    max_tokens: 100,
                    stream: true
                },
                {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    responseType: 'stream'
                }
            );


            let ai_response = '';
            response.data.on('data', async (chunk) => {
                try {
                    const chunkStr = chunk.toString();
                    ai_response += chunkStr;

                    stream.push(
                        JSON.stringify({
                            message_id: aiMessage.id,
                            chunk: chunkStr,
                        }) + "\n"
                    );

                } catch (e) {
                    console.log(e)
                    stream.push(null);
                }

            });

            response.data.on('end', () => {
                aiMessage.message = ai_response;
                this.messageRepository.save(aiMessage);

                stream.push(null);
            });

            response.data.on('error', (error) => {
                console.error('Stream error:', error);
                stream.push(null);
            });

            return stream;

        } catch (error) {
            console.log(error)
            throw new HttpException(
                'An error occurred while processing the message',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async tool_prompt(createMessageDto: CreateMessageDto, username: string) {
        const { message, sender, time, chat_id } = createMessageDto;

        try {
            let chat: Chat = await this.getChat(chat_id, message.slice(0, 20), username);

            const toolMessage = this.messageRepository.create({
                message,
                sender,
                time,
                chat: { id: chat.id },
            });

            await this.messageRepository.save(toolMessage);

            return toolMessage;
        } catch (error) {
            throw new HttpException(
                'An error occurred while processing the message',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async findAll(username: string) {
        const user = await this.usersService.findOne(username);
        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        return this.chatRepository.find({
            where: { user: { id: user.id }, deleted: false }
        });
    }

    async findOne(id: string, username: string) {
        const user = await this.usersService.findOne(username);
        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        const chat = await this.chatRepository.createQueryBuilder('chat')
            .leftJoinAndSelect('chat.messages', 'messages')
            .where('chat.deleted = :del', { del: false })
            .andWhere('chat.id = :id', { id })
            .andWhere('chat.user.id = :userId', { userId: user.id })
            .orderBy('messages.createdAt', 'ASC')
            .getOne();

        if (!chat) {
            throw new HttpException('Chat not found', HttpStatus.NOT_FOUND);
        }

        return chat;
    }

    update(id: number, updateChatDto: UpdateChatDto) {
        return `This action updates a #${id} chat`;
    }

    async find_chats(chatsDto: { chat_ids: Array<string> }, username: string) {
        const user = await this.usersService.findOne(username);
        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        const chats = await this.chatRepository.find({
            where: { user: { id: user.id } },
        });

        const _chats = chats.filter(chat =>
            chatsDto.chat_ids.includes(chat.id)
        );

        if (_chats.length === 0) {
            throw new HttpException('No chats found to delete', HttpStatus.NOT_FOUND);
        }

        return _chats;
    }

    async remove(deleteChatDto: DeleteChatsDto, username: string) {
        try {
            const chatsToDelete = await this.find_chats(deleteChatDto, username);

            for (let chat of chatsToDelete) {
                chat.deleted = true
                await this.chatRepository.save(chat);
            }

            return {
                status: "ok",
                message: 'Chats deleted successfully'
            };
        } catch (e) {
            throw e;
        }
    }

    async star(starChatDto: StarChatsDto, username: string) {
        try {
            const chatsToStar = await this.find_chats(starChatDto, username);

            for (let chat of chatsToStar) {
                chat.starred = starChatDto.star
                await this.chatRepository.save(chat);
            }

            return {
                status: "ok",
                message: 'Chats starred successfully'
            };
        } catch (e) {
            throw e;
        }
    }
}
