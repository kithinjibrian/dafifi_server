import { PartialType } from '@nestjs/swagger';
import { CreateErrorDto } from './create-error.dto';

export class UpdateErrorDto extends PartialType(CreateErrorDto) {}
