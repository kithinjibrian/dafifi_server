import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private client: Redis;

    onModuleInit() {
        if (
            "REDIS_HOST" in process.env &&
            "REDIS_PORT" in process.env
        ) {
            this.client = new Redis({
                host: process.env.REDIS_HOST,
                port: Number(process.env.REDIS_PORT),
            });
        }
    }

    async set(key: string, value: string): Promise<void> {
        await this.client.set(key, value);
    }

    async get(key: string): Promise<string | null> {
        return await this.client.get(key);
    }

    onModuleDestroy() {
        this.client.disconnect();
    }
}
