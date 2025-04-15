import { Injectable } from '@nestjs/common';
import axios from "axios"
import { CreateNotionDto } from './dto/create-notion.dto';
import { UpdateNotionDto } from './dto/update-notion.dto';
import { RedisService } from 'src/redis/redis.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotionToken } from './entities/notion.entity';

@Injectable()
export class NotionService {
    constructor(
        @InjectRepository(NotionToken)
        private notionTokenRepository: Repository<NotionToken>,
        private readonly redisService: RedisService
    ) { }

    create(createNotionDto: CreateNotionDto) {
        return 'This action adds a new notion';
    }

    async code({ code, state }) {
        const str = await this.redisService.get(state);
        const value = str ? JSON.parse(str) : null;

        if (value) {
            try {
                const response = await axios.post('https://api.notion.com/v1/oauth/token', {
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: process.env.NOTION_REDIRECT_URI!
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    auth: {
                        username: process.env.NOTION_CLIENT_ID!,
                        password: process.env.NOTION_CLIENT_SECRET!
                    }
                });

                let token = await this.notionTokenRepository.findOne({
                    where: {
                        username: value.username
                    }
                });

                if (token) {
                    // Update existing token
                    token.access_token = response.data.access_token;
                    token.workspace_id = response.data.workspace_id;
                    token.workspace_name = response.data.workspace_name;
                    token.bot_id = response.data.bot_id;
                    token.is_active = true;
                } else {
                    // Create new token entity
                    token = this.notionTokenRepository.create({
                        username: value.username,
                        access_token: response.data.access_token,
                        workspace_id: response.data.workspace_id,
                        workspace_name: response.data.workspace_name,
                        bot_id: response.data.bot_id,
                        is_active: true,
                    });
                }

                await this.notionTokenRepository.save(token);

                return { url: `https://chat.dafifi.net/c/${value.chat_id}` }
            } catch (e) {
                return 'Failed to authenticate with Notion';
            }
        }

        return `Failed to authenticate with Notion`;
    }

    findOne(id: number) {
        return `This action returns a #${id} notion`;
    }

    update(id: number, updateNotionDto: UpdateNotionDto) {
        return `This action updates a #${id} notion`;
    }

    remove(id: number) {
        return `This action removes a #${id} notion`;
    }
}
