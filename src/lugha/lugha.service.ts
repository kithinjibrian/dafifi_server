import { Injectable, OnModuleInit } from '@nestjs/common';
import { ExtensionStore } from "@kithinji/tlugha-core"
import { Listeners } from './listeners';

@Injectable()
export class LughaService implements OnModuleInit {
    constructor() { }

    onModuleInit() {
        const store = ExtensionStore.get_instance();
        store.register(new Listeners())
    }
}