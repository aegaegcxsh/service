import { IsString } from 'class-validator';

export class CreateCountryDto {
  @IsString()
  title: string;
}
