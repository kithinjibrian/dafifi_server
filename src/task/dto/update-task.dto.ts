import { IsBoolean, IsOptional, IsIn } from "class-validator";

export class UpdateTaskDto {
    @IsIn(['running', 'stopped', 'crashed'])
    @IsOptional()
    state?: "running" | "stopped" | "crashed";
}