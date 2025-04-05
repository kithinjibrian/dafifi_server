import { IsString } from "class-validator";

export class CreateErrorDto {
    @IsString()
    message: string;

    @IsString()
    stack: string;
}
