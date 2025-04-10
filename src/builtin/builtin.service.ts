import { Injectable, OnModuleInit } from '@nestjs/common';
import * as gmail from '@googleapis/gmail';
import { get_credentials } from 'src/utils/google';
import { Db } from 'src/utils/db';
import { nanoid } from 'nanoid';
import { GToken } from 'src/google/entities/google.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { builtin } from "@kithinji/tlugha"

@Injectable()
export class BuiltinService implements OnModuleInit {
    constructor(
        @InjectRepository(GToken)
        private gtokenRepository: Repository<GToken>,
    ) { }

    onModuleInit() {
        const credentials = get_credentials();
        const { client_id, client_secret, redirect_uris } = credentials.web;
        const oAuth2Client = new gmail.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        builtin["__google_auth__"] = {
            type: "function",
            async: true,
            signature: "<T, U>(args: T) -> U",
            exec: async (args: any[]) => {
                const id = nanoid();
                const db = Db.get_instance();

                if (builtin.__username__.type == "variable") {
                    db.set(id, { username: builtin.__username__.value });
                    db.set(builtin.__username__.value, id);
                }

                return oAuth2Client.generateAuthUrl({
                    access_type: 'offline',
                    prompt: 'consent',
                    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
                    state: id,
                });
            }
        };

        builtin["__google_list__"] = {
            type: "function",
            async: true,
            signature: "<T, U>(args: T) -> U",
            exec: async (args: any[]) => {
                let token;

                if (builtin.__username__.type == "variable") {
                    token = await this.gtokenRepository.findOne({
                        where: { username: builtin.__username__.value }
                    });
                }

                if (!token || !token.refresh_token) {
                    throw new Error('No refresh token found.');
                }

                try {
                    oAuth2Client.setCredentials({ refresh_token: token.refresh_token });

                    const gm = gmail.gmail({ version: 'v1', auth: oAuth2Client });

                    const res = await gm.users.messages.list({
                        userId: 'me',
                        q: args[0].q,
                        maxResults: args[0].max_results,
                    });

                    const messages = res.data.messages || [];
                    const email_summaries = await Promise.all(messages.map(async (msg: any) => {
                        const detail = await gm.users.messages.get({
                            userId: 'me',
                            id: msg.id,
                            format: 'metadata',
                            metadataHeaders: ['Subject', 'From'],
                        });

                        const headers = detail.data.payload?.headers || [];
                        const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
                        const from = headers.find(h => h.name === 'From')?.value || '(Unknown Sender)';

                        return { id: msg.id, subject, from };
                    }));

                    return email_summaries;
                } catch (error) {
                    if (error.message.includes('invalid_grant')) {
                        return 'Token expired, need to re-authenticate the user.'
                    }
                    throw error;
                }
            }
        };

        builtin["__google_read__"] = {
            type: "function",
            async: true,
            signature: "<T, U>(args: T) -> U",
            exec: async (args: any[]) => {
                let token;

                if (builtin.__username__.type == "variable") {
                    token = await this.gtokenRepository.findOne({
                        where: { username: builtin.__username__.value }
                    });
                }

                if (!token || !token.refresh_token) {
                    throw new Error('No refresh token found.');
                }

                try {
                    oAuth2Client.setCredentials({ refresh_token: token.refresh_token });

                    const gm = gmail.gmail({ version: 'v1', auth: oAuth2Client });

                    const res = await gm.users.messages.get({
                        userId: 'me',
                        id: args[0],
                        format: 'full',
                    });

                    const payload = res.data.payload;
                    if (!payload) return '(No content)';

                    const parts = payload.parts || [payload];
                    const bodyPart = parts.find((part) => part?.mimeType === 'text/plain') || parts[0];

                    const encodedBody = bodyPart?.body?.data;
                    if (!encodedBody) return '(No body found)';

                    const decodedBody = Buffer.from(encodedBody, 'base64').toString('utf-8');
                    return decodedBody;
                } catch (error) {
                    console.error('Error reading Gmail message:', error);
                    throw error;
                }
            }
        };
    }
}
