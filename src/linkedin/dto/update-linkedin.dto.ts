import { PartialType } from '@nestjs/swagger';
import { CreateLinkedinDto } from './create-linkedin.dto';

export class UpdateLinkedinDto extends PartialType(CreateLinkedinDto) {}
