/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  ParseIntPipe,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request as ExpressRequest } from 'express';
import { BroadcastService } from './broadcast.service';
import { SendBroadcastDto } from './dto/send.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('broadcast')
@UseGuards(JwtAuthGuard)
export class BroadcastController {
  constructor(private readonly broadcastService: BroadcastService) {}

  @Post('send')
  async sendBroadcast(
    @Body() dto: SendBroadcastDto,
    @Request() req: ExpressRequest & { user?: { id: number } },
  ) {
    const userId = req.user?.id ?? null;
    return this.broadcastService.send(dto, userId as number);
  }

  @Get()
  async getAllLogs() {
    return this.broadcastService.findAllLogs();
  }

  @Sse('events')
  events(): Observable<MessageEvent> {
    // Map raw events into SSE MessageEvent objects
    return this.broadcastService
      .getEventsStream()
      .pipe(map((payload) => ({ data: payload as object })));
  }

  @Get(':id')
  async getLogById(@Param('id', ParseIntPipe) id: number) {
    return this.broadcastService.findLogById(id);
  }
}
