import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event as EventEntity } from './entities/event.entity';
import { CreateEventDto } from './dto/create.dto';
import { UpdateEventDto } from './dto/update.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventsRepository: Repository<EventEntity>,
  ) {}

  async findAll(): Promise<EventEntity[]> {
    return this.eventsRepository.find();
  }

  async findOne(id: number): Promise<EventEntity> {
    const event = await this.eventsRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Событие не найдено');
    return event;
  }

  async create(dto: CreateEventDto): Promise<EventEntity> {
    const event = this.eventsRepository.create({
      ...dto,
    });
    return this.eventsRepository.save(event);
  }

  async update(id: number, dto: UpdateEventDto): Promise<EventEntity> {
    const event = await this.findOne(id);
    Object.assign(event, {
      ...dto,
    });
    return this.eventsRepository.save(event);
  }

  async remove(id: number): Promise<void | EventEntity> {
    const event = await this.findOne(id);
    return this.eventsRepository.remove(event);
  }
}
