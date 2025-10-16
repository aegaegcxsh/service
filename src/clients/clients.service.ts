/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike } from 'typeorm';
import { Event } from '../events/entities/event.entity';
import { Country } from '../country/entities/country.entities';

import { Client } from './entities/client.enitites';
import { CreateClientDto } from './dto/client.dto';
import { UpdateClientDto } from './dto/update.dto';

// helper local type that includes the events relation for assignment
type LocalClient = Client & { events?: Event[] };

function isDbErrorWithCode(
  err: unknown,
): err is { code?: string; message?: string } {
  return typeof err === 'object' && err !== null && 'code' in err;
}

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    @InjectRepository(Country)
    private readonly countriesRepository: Repository<Country>,
  ) {}

  async create(dto: CreateClientDto): Promise<Client> {
    const events_id = dto.events_id;
    const client = this.clientsRepository.create(dto as Partial<Client>);
    if (events_id && events_id.length > 0) {
      const events = await this.eventsRepository.findBy({ id: In(events_id) });
      (client as LocalClient).events = events;
    }

    if (typeof (dto as any).country_id === 'number') {
      const country = await this.countriesRepository.findOne({
        where: { id: (dto as any).country_id },
      });
      if (country) {
        (client as LocalClient).country = country;
        (client as any).country_id = country.id;
      }
    }
    try {
      const saved = await this.clientsRepository.save(client);
      return this.findOne(saved.id);
    } catch (error: unknown) {
      if (
        isDbErrorWithCode(error) &&
        (error.code === '23505' || /unique/i.test(error.message ?? ''))
      ) {
        throw new ConflictException(
          'Клиент с таким именем или email уже существует',
        );
      }
      throw new InternalServerErrorException();
    }
  }

  async findAll(
    page = 1,
    perPage = 20,
    search?: string,
  ): Promise<{
    items: Client[];
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * perPage;
    const where =
      typeof search === 'string' && search.length > 0
        ? [{ phone: ILike(`%${search}%`) }, { name: ILike(`%${search}%`) }]
        : undefined;

    const [clients, total] = await this.clientsRepository.findAndCount({
      where,
      skip,
      take: perPage,
      relations: ['events', 'country'],
      order: { id: 'ASC' },
    });

    const items = clients.map((c) => {
      return {
        ...c,
        events: (c.events || []).map((e) => ({ id: e.id, title: e.title })),
      } as Client;
    });

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    return { items, page, perPage, totalItems: total, totalPages };
  }

  async findOne(id: number): Promise<Client> {
    const client = await this.clientsRepository.findOne({ where: { id } });
    if (!client) throw new NotFoundException('Клиент не найден');
    return {
      ...client,
      events: (client.events || []).map((e) => ({ id: e.id, title: e.title })),
    } as Client;
  }

  async update(id: number, dto: UpdateClientDto): Promise<Client> {
    const events_id = (dto as Partial<CreateClientDto>).events_id;
    const preloaded = await this.clientsRepository.preload({
      id,
      ...(dto as Partial<Client>),
    });
    if (!preloaded) throw new NotFoundException('Клиент не найден');
    if (Array.isArray(events_id) && events_id.length > 0) {
      const events = await this.eventsRepository.findBy({ id: In(events_id) });
      // assign many-to-many relation (typed looser here for simplicity)
      (preloaded as LocalClient).events = events;
    }

    if (typeof (dto as any).country_id === 'number') {
      const country = await this.countriesRepository.findOne({
        where: { id: (dto as any).country_id },
      });
      if (country) {
        (preloaded as LocalClient).country = country;
        (preloaded as any).country_id = country.id;
      }
    }
    try {
      const saved = await this.clientsRepository.save(preloaded);
      return this.findOne(saved.id);
    } catch (error: unknown) {
      if (
        isDbErrorWithCode(error) &&
        (error.code === '23505' || /unique/i.test(error.message ?? ''))
      ) {
        throw new ConflictException(
          'Клиент с таким именем или email уже существует',
        );
      }
      throw new InternalServerErrorException();
    }
  }

  async remove(id: number): Promise<void> {
    const entity = await this.clientsRepository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Клиент не найден');
    await this.clientsRepository.remove(entity);
  }
}
