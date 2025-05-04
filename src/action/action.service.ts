import { nanoid } from 'nanoid';
import { writeFile, rename } from 'fs/promises';
import { Injectable } from '@nestjs/common';
import { exec, builtin } from "@kithinji/tlugha-node"
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { ChatService } from 'src/chat/chat.service';

@Injectable()
export class ActionService {
    constructor(
        private chatService: ChatService
    ) { }

    async create(createActionDto: CreateActionDto, username: string) {
        let filename = nanoid();
        let filepath = `code/src/${filename}.la`;
        await writeFile(filepath, createActionDto.code);

        builtin["__file__"] = {
            type: "variable",
            signature: "string",
            value: `${filename}.la`
        }

        builtin["__username__"] = {
            type: "variable",
            signature: "string",
            value: username
        }

        builtin["__chat_id__"] = {
            type: "variable",
            signature: "string",
            value: createActionDto.chat_id
        }

        try {
            const result = await exec({
                filepath,
                config: {
                    call_main: true
                }
            });

            let res = `p { "Result from tool." }
code[lang="text"] {
\`
${JSON.stringify(result, null, 2)}
\`
}
`
            return await this.chatService.tool_prompt({
                message: result ? res : "p { \"Tool returned empty result!\" }",
                sender: "tool",
                chat_id: createActionDto.chat_id
            }, username);
        } catch (error) {
            return await this.chatService.tool_prompt({
                message: `p { "Error from tool" }
code[lang="text"] {
\`
${error.message}
\`
}
`,
                sender: "tool",
                chat_id: createActionDto.chat_id
            }, username)
        } finally {
            delete builtin.__file__;
            delete builtin.__username__;
            delete builtin.__chat_id__;
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
