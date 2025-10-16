import { IsOptional, IsString, IsInt } from 'class-validator';

export class SendBroadcastDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsInt()
  filter_country_id?: number;

  @IsOptional()
  @IsInt()
  filter_event_id?: number;
}
