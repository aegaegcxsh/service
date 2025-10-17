import { IsOptional, IsString, IsInt, IsObject } from 'class-validator';

export class SendBroadcastDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsInt()
  filter_country_id?: number;

  @IsOptional()
  @IsInt()
  filter_event_id?: number;

  // Optional media object: { url?: string, path?: string, buffer?: string(base64), mime?: string, filename?: string }
  @IsOptional()
  @IsObject()
  media?: Record<string, unknown>;
}
