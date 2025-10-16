import { IsString, IsOptional, IsEmail, IsArray, IsInt } from 'class-validator';

export class CreateClientDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  phone: string;

  @IsOptional()
  caption?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  events_id?: number[];

  @IsInt()
  country_id?: number;
}
