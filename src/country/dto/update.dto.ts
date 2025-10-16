import { PartialType } from '@nestjs/mapped-types';
import { CreateCountryDto } from './creat.dto';

export class UpdateCountryDto extends PartialType(CreateCountryDto) {}
