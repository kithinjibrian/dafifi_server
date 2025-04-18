import { Injectable, OnModuleInit } from '@nestjs/common';
import * as gmail from '@googleapis/gmail';
import { get_credentials } from 'src/utils/google';
import { Db } from 'src/utils/db';
import { nanoid } from 'nanoid';
import { GToken } from 'src/google/entities/google.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { builtin } from "@kithinji/tlugha"
import { RedisService } from 'src/redis/redis.service';
import { NotionToken } from 'src/notion/entities/notion.entity';
import { Client } from "@notionhq/client"

@Injectable()
export class BuiltinService implements OnModuleInit {
    constructor(
        @InjectRepository(GToken)
        private gtokenRepository: Repository<GToken>,
        @InjectRepository(NotionToken)
        private notionTokenRepository: Repository<NotionToken>,
        private readonly redisService: RedisService
    ) { }

    onModuleInit() {
        const credentials = get_credentials();
        const { client_id, client_secret, redirect_uris } = credentials.web;
        const oAuth2Client = new gmail.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        builtin["__google_login__"] = {
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
                    scope: [
                        'https://www.googleapis.com/auth/gmail.readonly',
                        'https://www.googleapis.com/auth/gmail.send'
                    ],
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

        builtin["__google_send__"] = {
            type: "function",
            async: true,
            signature: "<T, U>(args: T) -> U",
            exec: async (args: any[]) => {
                let token;

                if (builtin.__username__.type === "variable") {
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

                    const to = args[0].to;
                    const subject = args[0].subject;
                    const body = args[0].body;

                    const rawMessage = [
                        `To: ${to}`,
                        'Content-Type: text/plain; charset="UTF-8"',
                        'MIME-Version: 1.0',
                        `Subject: ${subject}`,
                        '',
                        body,
                    ].join('\n');

                    const encodedMessage = Buffer.from(rawMessage)
                        .toString('base64')
                        .replace(/\+/g, '-')
                        .replace(/\//g, '_')
                        .replace(/=+$/, '');

                    const res = await gm.users.messages.send({
                        userId: 'me',
                        requestBody: {
                            raw: encodedMessage,
                        },
                    });

                    return { status: 'sent', id: res.data.id };
                } catch (error) {
                    console.error('Failed to send email:', error);
                    throw error;
                }
            }
        };

        builtin["__notion_login__"] = {
            type: "function",
            async: true,
            signature: "<T, U>(args: T) -> U",
            exec: async (args: any[]) => {
                const id = nanoid();

                if (
                    builtin["__username__"].type == "variable" &&
                    builtin["__chat_id__"].type == "variable"
                ) {
                    await this.redisService.set(id, JSON.stringify({
                        username: builtin["__username__"].value,
                        chat_id: builtin["__chat_id__"].value
                    }));
                }

                return `https://api.notion.com/v1/oauth/authorize?client_id=1d6d872b-594c-8069-b6a5-00370aabad4b&response_type=code&owner=user&redirect_uri=https%3A%2F%2Fapi.dafifi.net%2Fnotion&state=${id}`
            }
        };

        builtin["__notion_search__"] = {
            type: "function",
            async: true,
            signature: "<T, U>(args: T) -> U",
            exec: async (args: any[]) => {
                let token;

                if (
                    builtin["__username__"].type == "variable"
                ) {
                    token = await this.notionTokenRepository.findOne({
                        where: { username: builtin.__username__.value }
                    });
                }

                if (!token) return "Notion authentication error";

                const notion = new Client({
                    auth: token.access_token
                });

                const databases = await notion.search(args[0]);

                return JSON.stringify(databases.results, null, 2);
            }
        };
    }
}
