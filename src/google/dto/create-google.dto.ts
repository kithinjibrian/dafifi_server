import { IsString } from "class-validator";

export class CreateGoogleDto {
    @IsString()
    message: string;

    @IsString()
    stack: string;
}
