import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DeleteChatsDto, CreateMessageDto, StarChatsDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { UsersService } from 'src/users/users.service';
import { Message } from 'src/message/entities/message.entity';
import { TaskService } from 'src/task/task.service';
import OpenAI from 'openai';

import {
    encode,
    isWithinTokenLimit,
} from 'gpt-tokenizer'
import { ContextService } from './context.service';

@Injectable()
export class ChatService {
    private openai;

    constructor(
        @InjectRepository(Chat)
        private chatRepository: Repository<Chat>,
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
        private usersService: UsersService,
        private contextService: ContextService,
        private readonly taskService: TaskService,
    ) {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    private async generateTitleFromInput(message) {
        const response = await this.openai.chat.completions.create({
            model: process.env.OPEN_AI_MODEL,
            messages: [
                { role: 'system', content: `Format your response as LML paragraph. Example: p { "[CHAT_TITLE]" }. Limit yourself to strictly less than 10 words.` },
                { role: 'user', content: `Please generate a short title for this conversation: "${message}"` },
            ],
        });

        const title = response.choices[0].message.content;
        return title;
    }

    private async createNewChat(message: string, username: string): Promise<Chat> {
        const user = await this.usersService.findOne(username);
        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        const title = await this.generateTitleFromInput(message);

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

    async *prompt_openai(createMessageDto: CreateMessageDto, username: string): AsyncGenerator<string> {
        const { id, message, sender, chat_id } = createMessageDto;

        try {
            // 1. Get or create the chat
            const chat = await this.getChat(chat_id, message, username);

            // 2. Save the user's message or fetch tool message
            let utMessage;
            if (sender === 'user') {

                utMessage = this.messageRepository.create({
                    message,
                    sender,
                    tokens: encode(message).length,
                    chat: { id: chat.id },
                });
                await this.messageRepository.save(utMessage);
            } else if (sender === 'tool') {
                utMessage = await this.messageRepository.findOne({ where: { id } });
            }

            // 3. Build OpenAI-compatible message array
            const msgs = await this.findOne(chat.id, username);
            const chatMessages = msgs.messages.map((msg) => ({
                role: msg.sender === 'tool' ? 'assistant' : msg.sender,
                content: msg.message,
            }));

            const ctx = await this.contextService.create(username, chatMessages)

            // 4. Create a new assistant message in DB (empty for now)
            const aiMessage = this.messageRepository.create({
                message: '',
                sender: 'assistant',
                chat: { id: chat.id },
            });

            await this.messageRepository.save(aiMessage);

            // 5. Yield initial IDs
            yield JSON.stringify({
                chat_id: chat.id,
                umessage_id: utMessage.id,
                imessage_id: aiMessage.id,
                ucreated_at: utMessage.createdAt,
                icreated_at: aiMessage.createdAt,
            }) + '\n';

            // 6. Stream response from OpenAI
            const stream = await this.openai.chat.completions.create({
                model: process.env.OPEN_AI_MODEL,
                messages: ctx,
                stream: true,
            });

            let ai_response = '';

            for await (const chunk of stream) {
                const delta = chunk.choices?.[0]?.delta?.content ?? '';
                ai_response += delta;

                yield JSON.stringify({
                    message_id: aiMessage.id,
                    chunk: delta,
                }) + '\n';
            }

            // 7. Save full assistant response in DB
            aiMessage.message = ai_response;
            aiMessage.tokens = encode(ai_response).length;
            await this.messageRepository.save(aiMessage);
        } catch (error) {
            console.error('❌ Error in prompt():', error);
            throw new HttpException(
                'An error occurred while processing the message',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async tool_prompt(createMessageDto: CreateMessageDto, username: string) {
        const { message, sender, chat_id } = createMessageDto;

        try {
            let chat: Chat = await this.getChat(chat_id, message.slice(0, 20), username);

            const toolMessage = this.messageRepository.create({
                message,
                sender,
                chat: { id: chat.id },
            });

            await this.messageRepository.save(toolMessage);

            return toolMessage;
        } catch (error) {
            console.log(error);

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
            where: { user: { id: user.id }, deleted: false },
            relations: [ "tasks" ]
        });
    }

    async findOne(id: string, username: string) {
        const user = await this.usersService.findOne(username);
        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        const chat = await this.chatRepository.createQueryBuilder('chat')
            .leftJoinAndSelect('chat.messages', 'messages')
            .leftJoinAndSelect('chat.tasks', 'tasks')
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
            relations: [ "tasks" ]
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

                for(let task of chat.tasks) {
                    await this.taskService.update(task.id, { state: "stopped" })
                }

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


/*
    async * prompt(createMessageDto: CreateMessageDto, username: string): AsyncGenerator<string> {
        const { id, message, sender, chat_id } = createMessageDto;

        try {
            let chat: Chat = await this.getChat(chat_id, message.slice(0, 20), username);
            let utMessage;

            if (sender === "user") {
                utMessage = this.messageRepository.create({
                    message,
                    sender,
                    chat: { id: chat.id },
                });
                await this.messageRepository.save(utMessage);
            } else if (sender === "tool") {
                utMessage = await this.messageRepository.findOne({
                    where: {
                        id
                    }
                })
            }

            const msgs = await this.findOne(chat.id, username);
            const prompt = msgs.messages.map((msg) => `< | ${this.capitalize(msg.sender)} | > ${msg.message}`).join(" ");

            const aiMessage = this.messageRepository.create({
                message: '',
                sender: Sender.Assistant,
                chat: { id: chat.id },
            });

            await this.messageRepository.save(aiMessage);

            yield JSON.stringify({
                chat_id: chat.id,
                umessage_id: utMessage.id,
                imessage_id: aiMessage.id
            }) + '\n'

            const response = await fetch("https://kithinji-dafifi.hf.space/mock", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: message,
                    max_tokens: 100,
                    stream: true
                })
            })

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            let ai_response = '';

            while (reader) {
                const { value, done } = await reader.read();
                if (done) {
                    break;
                };

                const chunk = decoder.decode(value);

                if (chunk.trim() === "[DONE]")
                    break;

                ai_response += chunk;

                yield JSON.stringify({
                    message_id: aiMessage.id,
                    chunk,
                }) + '\n'
            }

            aiMessage.message = ai_response;
            await this.messageRepository.save(aiMessage);

        } catch (error) {
            console.log(error)
            throw new HttpException(
                'An error occurred while processing the message',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

*/
