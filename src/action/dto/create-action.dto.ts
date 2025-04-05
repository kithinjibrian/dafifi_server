import { IsString } from "class-validator";

export class CreateActionDto {
    @IsString()
    code: string

    @IsString()
    chat_id: string
}
