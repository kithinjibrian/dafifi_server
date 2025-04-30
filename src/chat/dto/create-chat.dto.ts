import { ArrayNotEmpty, IsArray, IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateMessageDto {
    @IsString()
    @IsOptional()
    id?: string;

    @IsString()
    chat_id: string;

    @IsString()
    sender: 'user' | 'assistant' | 'tool';

    @IsString()
    message: string;
}

export class DeleteChatsDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    chat_ids: string[];
}

export class StarChatsDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    chat_ids: string[];

    @IsBoolean()
    star: boolean
}

