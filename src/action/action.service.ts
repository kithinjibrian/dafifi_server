import { nanoid } from 'nanoid';
import { writeFile, appendFile, rename } from 'fs/promises';
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
        let filename = nanoid();
        let name = `code/${filename}.la`;
        await writeFile(name, createActionDto.code);

        builtin["__username__"] = {
            type: "variable",
            signature: "string",
            value: username
        }

        try {
            const result = await exec(name);

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
                chat_id: createActionDto.chat_id,
                time: "",
                mock: true
            }, username);
        } catch (error) {
            console.log(error);
            return await this.chatService.tool_prompt({
                message: `p { "Error from tool" }
code[lang="text"] {
\`
${error.message}
\`
}
`,
                sender: "tool",
                chat_id: createActionDto.chat_id,
                time: "",
                mock: true
            }, username)
        } finally {
            await rename(name, `dead/${filename}.la`)
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
