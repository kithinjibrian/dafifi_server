import { Injectable } from '@nestjs/common';
import { CreateGoogleDto } from './dto/create-google.dto';
import { UpdateGoogleDto } from './dto/update-google.dto';
import { get_token_from_code } from 'src/utils/google';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GToken } from './entities/google.entity';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class GoogleService {

    constructor(
        @InjectRepository(GToken)
        private gtokenRepository: Repository<GToken>,
        private readonly redisService: RedisService
    ) { }

    create(CreateGoogleDto: CreateGoogleDto) {
        return {
            message: 'logged successfully',
        };
    }

    async code({ code, state }) {
        const str = await this.redisService.get(state);
        const value = str ? JSON.parse(str) : null;

        if (value) {
            await get_token_from_code(code, async (tkn) => {

                let token = await this.gtokenRepository.findOne({
                    where: { username: (value as any).username },
                });

                if (token) {
                    token.access_token = tkn.access_token;
                    token.refresh_token = tkn.refresh_token;
                    token.scope = tkn.scope;
                    token.token_type = tkn.token_type;
                    token.expiry_date = tkn.expiry_date;
                    token.email = tkn.email;
                } else {
                    token = this.gtokenRepository.create({
                        username: (value as any).username,
                        access_token: tkn.access_token,
                        refresh_token: tkn.refresh_token,
                        scope: tkn.scope,
                        token_type: tkn.token_type,
                        expiry_date: tkn.expiry_date,
                        email: tkn.email,
                    });
                }

                await this.gtokenRepository.save(token);

                return { url: `https://chat.dafifi.net/c/${value.chat_id}` }
            });
        }

        return { url: 'https://chat.dafifi.net/' }
    }


    findOne(id: number) {
        return `This action returns a #${id} error`;
    }

    update(id: number, UpdateGoogleDto: UpdateGoogleDto) {
        return `This action updates a #${id} error`;
    }

    remove(id: number) {
        return `This action removes a #${id} error`;
    }
}
