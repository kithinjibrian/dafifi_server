import { Injectable } from '@nestjs/common';
import { CreateGoogleDto } from './dto/create-google.dto';
import { UpdateGoogleDto } from './dto/update-google.dto';
import { get_token_from_code } from 'src/utils/google';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Db } from 'src/utils/db';
import { GToken } from './entities/google.entity';

@Injectable()
export class GoogleService {

    constructor(
        @InjectRepository(GToken)
        private gtokenRepository: Repository<GToken>,
    ) { }

    create(CreateGoogleDto: CreateGoogleDto) {
        return {
            message: 'logged successfully',
        };
    }

    async code({ code, state }) {
        const db = Db.get_instance();
        const value = db.get(state);

        if (value) {
            await get_token_from_code(code, async (token) => {
                let existingToken = await this.gtokenRepository.findOne({
                    where: { username: (value as any).username },
                });

                if (existingToken) {
                    existingToken.access_token = token.access_token;
                    existingToken.refresh_token = token.refresh_token;
                    existingToken.scope = token.scope;
                    existingToken.token_type = token.token_type;
                    existingToken.expiry_date = token.expiry_date;
                    existingToken.email = token.email;

                    await this.gtokenRepository.save(existingToken);
                } else {
                    const gtoken = this.gtokenRepository.create({
                        username: (value as any).username,
                        access_token: token.access_token,
                        refresh_token: token.refresh_token,
                        scope: token.scope,
                        token_type: token.token_type,
                        expiry_date: token.expiry_date,
                        email: token.email,
                    });

                    await this.gtokenRepository.save(gtoken);
                }
            });
        }

        return `This action`;
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
