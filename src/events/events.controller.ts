import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create.dto';
import { UpdateEventDto } from './dto/update.dto';
import { Event as EventEntity } from './entities/event.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findAll(): Promise<EventEntity[]> {
    return this.eventsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<EventEntity> {
    return this.eventsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateEventDto): Promise<EventEntity> {
    return this.eventsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
  ): Promise<EventEntity> {
    return this.eventsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void | EventEntity> {
    return this.eventsService.remove(id);
  }
}
