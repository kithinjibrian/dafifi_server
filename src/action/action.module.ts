import { Module } from '@nestjs/common';
import { ActionService } from './action.service';
import { ActionController } from './action.controller';
import { ChatModule } from 'src/chat/chat.module';

@Module({
    imports: [
        ChatModule
    ],
    controllers: [ActionController],
    providers: [ActionService],
})
export class ActionModule { }
