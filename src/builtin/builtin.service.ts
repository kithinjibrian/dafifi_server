import { Injectable, OnModuleInit } from '@nestjs/common';
import axios from "axios"
import * as gmail from '@googleapis/gmail';
import * as drive from '@googleapis/drive';
import * as docs from '@googleapis/docs';
import * as calendar from '@googleapis/calendar';
import OpenAI from 'openai';
import { get_credentials } from 'src/utils/google';
import { nanoid } from 'nanoid';
import { GToken } from 'src/google/entities/google.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from 'src/redis/redis.service';
import { ChatService } from 'src/chat/chat.service';
import { TaskService } from 'src/task/task.service';
import { Task } from 'src/task/entities/task.entity';
import { NotionToken } from 'src/notion/entities/notion.entity';
import { LinkedinToken } from 'src/linkedin/entities/linkedin.entity';
import { Client } from "@notionhq/client"
import * as hubspot from '@hubspot/api-client'
import { HubspotToken } from 'src/hubspot/entities/hubspot.entity';
import { OpenAI as OpenAIEntity } from 'src/openai/entities/openai.entity';
import { User } from 'src/users/entities/users.entity';
import { MemoryGraph } from 'src/memory/memory.class';
import { Code } from "./code"
import { Cron } from '@nestjs/schedule';
import { exec, builtin } from "@kithinji/tlugha-node"
import { Frame, Engine, LambdaNode, FunctionDecNode } from "@kithinji/tlugha-core"
import { CronExpressionParser } from 'cron-parser';
import { DateTime } from 'luxon';
import { uniqueNamesGenerator, Config, adjectives, animals } from 'unique-names-generator';

@Injectable()
export class BuiltinService implements OnModuleInit {
    constructor(
        @InjectRepository(Task)
        private taskRepository: Repository<Task>,
        @InjectRepository(GToken)
        private gtokenRepository: Repository<GToken>,
        @InjectRepository(NotionToken)
        private notionTokenRepository: Repository<NotionToken>,
        @InjectRepository(LinkedinToken)
        private linkedinTokenRepository: Repository<LinkedinToken>,
        @InjectRepository(HubspotToken)
        private hubspotTokenRepository: Repository<HubspotToken>,
        @InjectRepository(OpenAIEntity)
        private openaiRepository: Repository<OpenAIEntity>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private readonly redisService: RedisService,
        private readonly chatService: ChatService,
        private readonly taskService: TaskService,
    ) { }

    onModuleInit() {
        delete builtin["__shell__"];
        delete builtin["__write__"];
        delete builtin["__read__"];

        builtin["__dafifi_memory_add_node__"] = {
            type: "function",
            async: true,
            signature: "<T, U>(args: T) -> U",
            exec: async (args: any[]) => {
                let user;
                if (
                    builtin["__username__"].type == "variable"
                ) {
                    try {
                        user = await this.userRepository.findOne({
                            where: { username: builtin.__username__.value },
                            relations: ["memory"]
                        });
                    } catch (e) {
                        throw e;
                    }
                }


                const graph = MemoryGraph.fromFullJSON(user.memory.memory);

                graph.addNode(args[0], args[1], args[2], args[3]);

                const memory = graph.toFullJSON();

                user.memory = {
                    id: user.memory.id,
                    memory
                }

                await this.userRepository.save(user);

                return "Node added successfully";
            }
        }

        builtin["__dafifi_memory_add_edge__"] = {
            type: "function",
            async: true,
            signature: "<T, U>(args: T) -> U",
            exec: async (args: any[]) => {
                let user;
                if (
                    builtin["__username__"].type == "variable"
                ) {
                    try {
                        user = await this.userRepository.findOne({
                            where: { username: builtin.__username__.value },
                            relations: ["memory"]
                        });
                    } catch (e) {
                        throw e;
                    }
                }

                const graph = MemoryGraph.fromFullJSON(user.memory.memory);

                try {

                    graph.addEdge(args[0], args[1], args[2], args[3]);

                    const memory = graph.toFullJSON();

                    user.memory = {
                        id: user.memory.id,
                        memory
                    }

                    await this.userRepository.save(user);

                    return "Edge added successfully";

                } catch (e) {
                    throw new Error(JSON.stringify({
                        success: "error",
                        message: e.message
                    }))
                }
            }
        }

        builtin["__dafifi_memory_strengthen_node__"] = {
            type: "function",
            async: true,
            signature: "<T, U>(args: T) -> U",
            exec: async (args: any[]) => {
                console.log(args);
                return "Memories have been reinforced.";
            }
        }

        builtin["__dafifi_memory_strengthen_edge__"] = {
            type: "function",
            async: true,
            signature: "<T, U>(args: T) -> U",
            exec: async (args: any[]) => {
                console.log(args);
                return "Memories have been reinforced.";
            }
        }

        builtin["__cron_schedule__"] = {
            type: "function",
            async: true,
            has_callback: true,
            signature: "<T, U>(args: T) -> U",
            exec: async (args: any[]) => {
                 if (
                    builtin["__file__"].type == "variable" &&
                    builtin["__username__"].type == "variable" &&
                    builtin["__chat_id__"].type == "variable"
                ) {     
                    const code_cache = Code.get_instance(50);
                    code_cache.put(builtin["__file__"].value, args);

                    let task = await this.taskRepository.findOne({
                        where: { filename: builtin["__file__"].value }
                    });

                    if(!task) {
                        const name = uniqueNamesGenerator({
                            dictionaries: [adjectives, animals],
                            separator: ' ',
                            style: 'lowerCase'
                        });

                        task = this.taskRepository.create({
                            type: "cron",
                            nickname: name,
                            state: "running",
                            filename: builtin["__file__"].value,
                            username: builtin["__username__"].value,
                            explainer: "",
                            chat: { id: builtin["__chat_id__"].value },
                            data: {
                                expression: args[1]
                            }
                        });
    
                        await this.taskRepository.save(task);
                    }

                    await this.redisService.set(`task:${builtin["__file__"].value}`, JSON.stringify({
                        username: builtin["__username__"].value,
                        chat_id: builtin["__chat_id__"].value,
                        expression: args[1]
                    }));

                    return JSON.stringify({
                        nickname: task.nickname,
                        cron_id: task.id
                    });
                }

                return "Couldn't schedule the task"
            }
        }

        builtin["__cron_list__"] = {
            type: "function",
            async: true,
            has_callback: true,
            signature: "<T, U>(args: T) -> U",
            exec: async (args: any[]) => {

                return "Couldn't schedule the task"
            }
        }    
        
        builtin["__cron_start__"] = {
            type: "function",
            async: true,
            has_callback: true,
            signature: "<T, U>(args: T) -> U",
            exec: async (args: any[]) => {
                try {
                    await this.taskService.update(args[0], { state: "running" });
                    return "Task started!";
                } catch(e) {
                    throw e;
                }
            }
        }

        builtin["__cron_stop__"] = {
            type: "function",
            async: true,
            has_callback: true,
            signature: "<T, U>(args: T) -> U",
            exec: async (args: any[]) => {
                try {
                    await this.taskService.update(args[0], { state: "stopped" });
                    return "Task stopped!";
                } catch(e) {
                    throw e;
                }
            }
        }


        const credentials = get_credentials();
        const { client_id, client_secret, redirect_uris } = credentials.web;
        const oAuth2Client = new gmail.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        builtin["__google_login__"] = {
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

                return oAuth2Client.generateAuthUrl({
                    access_type: 'offline',
                    prompt: 'consent',
                    scope: [
                        'https://www.googleapis.com/auth/gmail.readonly',
                        'https://www.googleapis.com/auth/gmail.send',
                        'https://www.googleapis.com/auth/drive',
                        'https://www.googleapis.com/auth/documents',
                        'https://www.googleapis.com/auth/calendar',
                        'https://www.googleapis.com/auth/calendar.events',
                    ],
                    state: id,
                });
            }
        };

        builtin["__gmail_list__"] = {
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

                    return JSON.stringify(email_summaries);
                } catch (error) {
                    if (error.message.includes('invalid_grant')) {
                        return 'Token expired, need to re-authenticate the user.'
                    }
                    throw error;
                }
            }
        };

        builtin["__gmail_read__"] = {
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

        builtin["__gmail_send__"] = {
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

                    return JSON.stringify({ status: 'sent', id: res.data.id });
                } catch (error) {
                    console.error('Failed to send email:', error);
                    throw error;
                }
            }
        };

        builtin["__drive_list__"] = {
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

                    const dv = drive.drive({ version: 'v3', auth: oAuth2Client });

                    const response = await dv.files.list(args[0]);

                    const files = response.data.files;

                    return JSON.stringify(files);
                } catch (error) {
                    throw error;
                }
            }
        };

        builtin["__drive_new_folder__"] = {
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

                    const dv = drive.drive({ version: 'v3', auth: oAuth2Client });

                    const res = await dv.files.create({
                        requestBody: {
                            name: args[0],
                            mimeType: 'application/vnd.google-apps.folder',
                        },
                    })

                    return JSON.stringify(res.data);
                } catch (error) {
                    throw error;
                }
            }
        };

        builtin["__docs_new_doc__"] = {
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

                    const dv = drive.drive({ version: 'v3', auth: oAuth2Client });

                    const res = await dv.files.create({
                        requestBody: {
                            name: args[0],
                            mimeType: 'application/vnd.google-apps.document',
                        },
                    })

                    return JSON.stringify(res.data);
                } catch (error) {
                    throw error;
                }
            }
        };

        builtin["__docs_get_raw__"] = {
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

                    const ds = docs.docs({ version: 'v1', auth: oAuth2Client });

                    const res = await ds.documents.get({ documentId: args[0] })

                    return JSON.stringify(res.data);
                } catch (error) {
                    throw error;
                }
            }
        };

        // not working
        builtin["__calendar_list__"] = {
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

                    const cl = calendar.calendar({ version: 'v3', auth: oAuth2Client });

                    const res = await cl.events.list({
                        calendarId: 'primary',
                        timeMin: (new Date()).toISOString(),
                        orderBy: 'startTime',
                        ...args[0]
                    })

                    return JSON.stringify(res.data);
                } catch (error) {
                    throw error;
                }
            }
        };

        // not working
        builtin["__calendar_create__"] = {
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

                    const cl = calendar.calendar({ version: 'v3', auth: oAuth2Client });

                    const event = {
                        summary: 'Meeting with GPT',
                        location: 'Online',
                        description: 'Talking to ChatGPT about Node.js and Google APIs',
                        start: {
                            dateTime: '2025-04-18T10:00:00-07:00',
                            timeZone: 'America/Los_Angeles',
                        },
                        end: {
                            dateTime: '2025-04-18T11:00:00-07:00',
                            timeZone: 'America/Los_Angeles',
                        },
                    };

                    const res = await cl.events.insert({
                        calendarId: 'primary',
                        requestBody: event,
                    });

                    return JSON.stringify(res.data);
                } catch (error) {
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

        builtin["__hubspot_login__"] = {
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

                let hubspotClient = new hubspot.Client();

                const clientId = process.env.HUBSPOT_CLIENT_ID!
                const redirectUri = process.env.HUBSPOT_REDIRECT_URI!
                const scope = 'oauth crm.objects.contacts.read'

                return hubspotClient.oauth.getAuthorizationUrl(clientId, redirectUri, scope)
            }
        };

        builtin["__hubspot__"] = {
            type: "function",
            async: true,
            signature: "<T, U>(args: T) -> U",
            exec: async (args: any[]) => {
                let token;

                if (
                    builtin["__username__"].type == "variable"
                ) {
                    token = await this.hubspotTokenRepository.findOne({
                        where: { username: builtin.__username__.value }
                    });
                }

                let hubspotClient = new hubspot.Client();

                const results = await hubspotClient.oauth.tokensApi
                    .create(
                        'refresh_token',
                        undefined,
                        undefined,
                        process.env.HUBSPOT_CLIENT_ID!,
                        process.env.HUBSPOT_CLIENT_SECRET!,
                        token.refresh_token
                    );

                hubspotClient.setAccessToken(results.accessToken)

                return await hubspotClient.crm.contacts.basicApi.getPage()
            }
        };

        builtin["__openai_save__"] = {
            type: "function",
            async: true,
            signature: "<T, U>(args: T) -> U",
            exec: async (args: any[]) => {
                const a = args[0];
                if ("api_key" in a &&
                    "model" in a
                ) {
                    if (
                        builtin["__username__"].type == "variable"
                    ) {

                        const openai = this.openaiRepository.create({
                            api_key: a.api_key,
                            model: a.model,
                            username: builtin.__username__.value
                        })

                        await this.openaiRepository.save(openai);

                        return "OpenAI info has been securely saved.";
                    }

                    return JSON.stringify({
                        success: "error",
                        message: "Auth error"
                    })
                }

                return JSON.stringify({
                    success: "error",
                    message: "The input object is missing either api_key or model field"
                })
            }
        }

        builtin["__openai_update__"] = {
            type: "function",
            async: true,
            signature: "<T, U>(args: T) -> U",
            exec: async (args: any[]) => {
                const a = args[0];

                if (
                    "api_key" in a || "model" in a
                ) {
                    if (builtin["__username__"].type === "variable") {
                        const username = builtin.__username__.value;

                        const existing = await this.openaiRepository.findOne({
                            where: { username }
                        });

                        if (!existing) {
                            return JSON.stringify({
                                success: "error",
                                message: "No saved OpenAI info found for this user."
                            });
                        }

                        // Update fields
                        if ("api_key" in a) existing.api_key = a.api_key;
                        if ("model" in a) existing.model = a.model;

                        await this.openaiRepository.save(existing);

                        return "OpenAI info has been successfully updated.";
                    }

                    return JSON.stringify({
                        success: "error",
                        message: "Auth error"
                    });
                }

                return JSON.stringify({
                    success: "error",
                    message: "Must provide at least one of api_key or model to update."
                });
            }
        }

        builtin["__openai_prompt__"] = {
            type: "function",
            async: true,
            signature: "<T, U>(args: T) -> U",
            exec: async (args: any[]) => {
                let info;

                if (
                    builtin["__username__"].type == "variable"
                ) {
                    try {
                        info = await this.openaiRepository.findOne({
                            where: { username: builtin.__username__.value }
                        });
                    } catch (e) {
                        throw e;
                    }
                }

                const openai = new OpenAI({
                    apiKey: info.api_key,
                });

                try {
                    const response = await openai.chat.completions.create({
                        model: info.model,
                        messages: args[0]
                    });

                    return response.choices[0].message.content;
                } catch (e) {
                    throw e;
                }
            }
        }

        builtin["__linkedin_login__"] = {
            type: "function",
            async: true,
            signature: "<T, U>(args: T) -> U",
            exec: async (args:any[]) => {
                const id = nanoid();
                const scope = 'profile openid w_member_social email';
                const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
                const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI!;

                if (
                    builtin["__username__"].type == "variable" &&
                    builtin["__chat_id__"].type == "variable"
                ) {
                    await this.redisService.set(id, JSON.stringify({
                        username: builtin["__username__"].value,
                        chat_id: builtin["__chat_id__"].value
                    }));
                }

                return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&state=${id}`
            }
        }

        builtin["__linkedin_share_post__"] = {
            type: "function",
            async: true,
            signature: "<T, U>(args: T) -> U",
            exec: async (args:any[]) => {
                let token;

                if (
                    builtin["__username__"].type == "variable"
                ) {
                    token = await this.linkedinTokenRepository.findOne({
                        where: { username: builtin.__username__.value }
                    });
                }

                if (!token) return "Linkedin authentication error";

                const payload = {
                    "author": `urn:li:person:${token.sub}`,
                    "commentary": args[0].text,
                    "visibility": "PUBLIC",
                    "distribution": {
                        "feedDistribution": "MAIN_FEED",
                        "targetEntities": [],
                        "thirdPartyDistributionChannels": []
                    },
                    "lifecycleState": "PUBLISHED",
                    "isReshareDisabledByAuthor": false
                };

                const response = await axios.post('https://api.linkedin.com/rest/posts', payload, {
                    headers: {
                        'Authorization': `Bearer ${token.access_token}`,
                        'X-Restli-Protocol-Version': '2.0.0',
                        'Content-Type': 'application/json',
                        'LinkedIn-Version': '202504'
                    }
                });

                return JSON.stringify(response.data, null, 2);
            }
        }
    }

    @Cron('* * * * *')
    async handleCron() {
        console.log("running cron jobs");
        const now = DateTime.now();
        const one_min_ago = now.minus({ minutes: 1 });

        const keys = await this.redisService.get_all_namespace("task");
        type CronArgs = [Engine, string, LambdaNode | FunctionDecNode];

        console.log(keys);

        for(const key of keys) {
            //await this.redisService.delete(key);
            //continue; 
            const str = await this.redisService.get(key);
            const b = str && JSON.parse(str);

            if(!b) throw new Error("Can't be null");

            const interval = CronExpressionParser.parse(b.expression, { currentDate: now.toJSDate() });
            const prev = DateTime.fromJSDate(interval.prev().toDate());

            if (prev < one_min_ago || prev > now) {
                console.log("skipping...", b.expression);
                continue;
            }
            
            const filename = key.split(":")[1];
            const code_cache = Code.get_instance<string, CronArgs>(50);
            let args = code_cache.get(filename);

            if(!args) {
                builtin["__file__"] = {
                    type: "variable",
                    signature: "string",
                    value: filename
                }

                builtin["__username__"] = {
                    type: "variable",
                    signature: "string",
                    value: b.username
                }

                builtin["__chat_id__"] = {
                    type: "variable",
                    signature: "string",
                    value: b.chat_id
                }

                try {
                    const result = await exec({
                        filepath: `code/src/${filename}`,
                        config: {
                            call_main: true
                        }
                    });

                    args = code_cache.get(filename);
                } catch(e) {
                    console.log(e);
                } finally {
                    delete builtin.__file__;
                    delete builtin.__username__;
                    delete builtin.__chat_id__;
                }
            }

            function isCronArgs(args: unknown[]): args is CronArgs {
                return (
                    args.length === 3 &&
                    typeof args[1] === 'string' &&
                    typeof args[0] === 'object' &&
                    typeof args[2] === 'object'
                );
            }

            if (!Array.isArray(args) || !isCronArgs(args)) {
                throw new Error(`Expected args to be an array for ${args}`);
            }

            const engine = args[0];
            const frame = new Frame();

            const expression = args[1];

            await engine.execute_function(
                args[2],
                [],
                frame
            );

            const result = frame.stack.pop();

            let res = `p { "Result from cron task." }
code[lang="text", collapse="false"] {
\`
${JSON.stringify(result.getValue(), null, 2)}
\`
}
`

            await this.chatService.tool_prompt({
                message: result ? res :  "p { \"Cron task returned empty result!\" }",
                sender: "tool",
                chat_id: b.chat_id
            }, b.username);
        }
    }
}
