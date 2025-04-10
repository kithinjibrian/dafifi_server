import { nanoid } from 'nanoid';
import { writeFile, appendFile } from 'fs/promises';
import { Injectable } from '@nestjs/common';
import { exec } from "@kithinji/tlugha"
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { ChatService } from 'src/chat/chat.service';
import { builtin } from '@kithinji/tlugha'

@Injectable()
export class ActionService {
    constructor(
        private chatService: ChatService
    ) { }

    async create(createActionDto: CreateActionDto, username: string) {
        let name = `code/${nanoid()}.la`;
        await writeFile(name, createActionDto.code);

        builtin["__username__"] = {
            type: "variable",
            signature: "string",
            value: username
        }

        try {
            const result = exec(name);

            return result;

            // return await this.chatService.tool_prompt({
            //     message: result ? `Result from tool.\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`` : "Tool returned empty result!",
            //     sender: "tool",
            //     chat_id: createActionDto.chat_id,
            //     time: "",
            //     mock: true
            // }, username);
        } catch (error) {
            await appendFile("log/error", `
---------------------
${createActionDto.code}

${error}
---------------------
                `);
            // return await this.chatService.tool_prompt({
            //     message: `Error from tool.\n\`\`\`text\n${error}\n\`\`\``,
            //     sender: "tool",
            //     chat_id: createActionDto.chat_id,
            //     time: "",
            //     mock: true
            // }, username)
        }
    }

    findAll() {
        return `This action returns all action`;
    }

    findOne(id: number) {
        return `This action returns a #${id} action`;
    }

    update(id: number, updateActionDto: UpdateActionDto) {
        return `This action updates a #${id} action`;
    }

    remove(id: number) {
        return `This action removes a #${id} action`;
    }
}
