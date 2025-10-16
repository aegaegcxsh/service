import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create.dto';

export class UpdateEventDto extends PartialType(CreateEventDto) {}
