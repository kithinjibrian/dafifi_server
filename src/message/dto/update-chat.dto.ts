import { IsBoolean, IsOptional } from "class-validator";

export class UpdateMessageDto {
    @IsBoolean()
    @IsOptional()
    rendered: boolean;
}