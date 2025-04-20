import { Injectable } from '@nestjs/common';
import axios from "axios"
import { CreateHubspotDto } from './dto/create-hubspot.dto';
import { UpdateHubspotDto } from './dto/update-hubspot.dto';
import { RedisService } from 'src/redis/redis.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HubspotToken } from './entities/hubspot.entity';
import * as qs from "qs"

@Injectable()
export class HubspotService {
    constructor(
        @InjectRepository(HubspotToken)
        private hubspotTokenRepository: Repository<HubspotToken>,
        private readonly redisService: RedisService
    ) { }

    create(CreateHubspotDto: CreateHubspotDto) {
        return 'This action adds a new notion';
    }

    async code({ code, state }) {
        const str = await this.redisService.get(state);
        const value = str ? JSON.parse(str) : null;


        if (value) {
            try {
                const data = qs.stringify({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: process.env.HUBSPOT_REDIRECT_URI!,
                    client_id: process.env.HUBSPOT_CLIENT_ID!,
                    client_secret: process.env.HUBSPOT_CLIENT_SECRET!
                });

                const config = {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }
                };

                const response = await axios.post("https://api.hubapi.com/oauth/v1/token", data, config);

                console.log(response.data);

                let token = await this.hubspotTokenRepository.findOne({
                    where: {
                        username: value.username
                    }
                });

                if (token) {
                    // Update existing token
                    token.access_token = response.data.access_token;
                    token.refresh_token = response.data.access_token;
                } else {
                    // Create new token entity
                    token = this.hubspotTokenRepository.create({
                        username: value.username,
                        access_token: response.data.access_token,
                        refresh_token: response.data.refresh_token,
                    });
                }

                await this.hubspotTokenRepository.save(token);

                return { url: `https://chat.dafifi.net/c/${value.chat_id}` }
            } catch (e) {
                console.log(e)
                return 'Failed to authenticate with Hubspot';
            }
        }

        return `Failed to authenticate with Hubspot`;
    }

    findOne(id: number) {
        return `This action returns a #${id} notion`;
    }

    update(id: number, updateHubspotDto: UpdateHubspotDto) {
        return `This action updates a #${id} notion`;
    }

    remove(id: number) {
        return `This action removes a #${id} notion`;
    }
}
