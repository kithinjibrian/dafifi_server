import { PartialType } from '@nestjs/swagger';
import { CreateHubspotDto } from './create-hubspot.dto';

export class UpdateHubspotDto extends PartialType(CreateHubspotDto) { }
