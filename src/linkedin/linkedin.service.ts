import { Injectable } from '@nestjs/common';
import axios from "axios"
import { CreateLinkedinDto } from './dto/create-linkedin.dto';
import { UpdateLinkedinDto } from './dto/update-linkedin.dto';
import { RedisService } from 'src/redis/redis.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LinkedinToken } from './entities/linkedin.entity';

@Injectable()
export class LinkedinService {
    constructor(
        @InjectRepository(LinkedinToken)
        private linkedinTokenRepository: Repository<LinkedinToken>,
        private readonly redisService: RedisService
    ) { }

    create(createLinkedinDto: CreateLinkedinDto) {
        return 'This action adds a new linkedin';
    }

    async code({ code, state }) {
        const str = await this.redisService.get(state);
        const value = str ? JSON.parse(str) : null;

        if (value) {
            try {
                const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
                    params: {
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
                    client_id: process.env.LINKEDIN_CLIENT_ID!,
                    client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
                    },
                    headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    },
                });

                const res = await axios.get('https://api.linkedin.com/v2/userinfo', {
                    headers: {
                        Authorization: `Bearer ${response.data.access_token}`,
                    },
                });

                let token = await this.linkedinTokenRepository.findOne({
                    where: {
                        username: value.username
                    }
                });

                if (token) {
                    // Update existing token
                    token.access_token = response.data.access_token;
                    token.scope = response.data.scope;
                    token.email = res.data.email;
                    token.sub = res.data.sub;
                    token.email_verified = res.data.email_verified;
                    token.name = res.data.name;
                } else {
                    // Create new token entity
                    token = this.linkedinTokenRepository.create({
                        username: value.username,
                        access_token: response.data.access_token,
                        scope: response.data.scope,
                        sub: res.data.sub,
                        email: res.data.email,
                        name: res.data.name,
                        email_verified: res.data.email_verified,
                    });
                }

                await this.linkedinTokenRepository.save(token);

                return { url: `https://chat.dafifi.net/c/${value.chat_id}` }
            } catch (e) {
                return 'Failed to authenticate with Linkedin';
            }
        }

        return `Failed to authenticate with Linkedin`;
    }

    findOne(id: number) {
        return `This action returns a #${id} linkedin`;
    }

    update(id: number, updateLinkedinDto: UpdateLinkedinDto) {
        return `This action updates a #${id} linkedin`;
    }

    remove(id: number) {
        return `This action removes a #${id} linkedin`;
    }
}
