/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BroadcastLog } from './entities/broadcast.entities';
import { SendBroadcastDto } from './dto/send.dto';
import { Client } from '../clients/entities/client.enitites';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { User } from '../users/entities/user.entity';
import { Country } from '../country/entities/country.entities';
import { Event } from '../events/entities/event.entity';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class BroadcastService {
  // EventSource stream for broadcast progress (start/progress/finish)
  private readonly eventsSubject = new Subject<any>();
  constructor(
    @InjectRepository(BroadcastLog)
    private readonly broadcastLogsRepository: Repository<BroadcastLog>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Country)
    private readonly countriesRepository: Repository<Country>,
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    private readonly whatsappService: WhatsAppService,
  ) {}

  // expose as observable for controllers to subscribe (SSE)
  getEventsStream(): Observable<any> {
    return this.eventsSubject.asObservable();
  }

  async send(dto: SendBroadcastDto, userId: number) {
    const filters: any = {};
    if (dto.filter_country_id) filters.country = { id: dto.filter_country_id };
    if (dto.filter_event_id) filters.events = { id: dto.filter_event_id };

    const clients = await this.clientsRepository.find({
      where: filters,
      relations: ['events', 'country'],
    });

    // send messages but don't fail the whole operation on single send error
    const total = clients.length;
    let sent = 0;
    let failed = 0;

    // emit initial progress
    this.eventsSubject.next({ type: 'start', total, sent, failed });

    console.log('Clients cycle');
    for (const client of clients) {
      try {
        console.log('Sending message to', client.phone);

        // Normalize media object: if buffer provided as base64 string, convert to Buffer
        let mediaParam:
          | {
              url?: string;
              path?: string;
              buffer?: Buffer;
              mime?: string;
              filename?: string;
            }
          | undefined = undefined;
        if (dto.media) {
          mediaParam = { ...dto.media };
          if (typeof (dto.media as any).buffer === 'string') {
            try {
              mediaParam.buffer = Buffer.from(
                (dto.media as any).buffer as string,
                'base64',
              );
            } catch {
              // leave as-is; sendMessage will validate
            }
          }
        }

        await this.whatsappService.sendMessage(
          client.phone,
          dto.message,
          mediaParam,
        );
        sent += 1;
        this.eventsSubject.next({
          type: 'progress',
          total,
          sent,
          failed,
          current: { id: client.id, phone: client.phone, status: 'ok' },
        });

        // Rate limit: pause between sends to avoid flooding
        await new Promise((res) => setTimeout(res, 1000));
      } catch (err) {
        failed += 1;
        // Log error and continue with next client
        console.warn('Failed to send to', client.phone, err);
        this.eventsSubject.next({
          type: 'progress',
          total,
          sent,
          failed,
          current: {
            id: client.id,
            phone: client.phone,
            status: 'failed',
            error: err instanceof Error ? err.message : String(err),
          },
        });

        // Longer pause after failure to allow potential recovery
        await new Promise((res) => setTimeout(res, 2000));
      }
    }

    // emit finished event
    this.eventsSubject.next({ type: 'finish', total, sent, failed });

    const log = this.broadcastLogsRepository.create({
      message: dto.message,
      filter_country_id: dto.filter_country_id ?? null,
      filter_event_id: dto.filter_event_id ?? null,
      total_recipients: clients.length,
      sent_by_user_id: userId,
    });

    return this.broadcastLogsRepository.save(log);
  }

  async findAllLogs(): Promise<any[]> {
    const logs = await this.broadcastLogsRepository.find({
      order: { sent_at: 'DESC' },
    });
    return Promise.all(
      logs.map(async (l) => {
        const user = l.sent_by_user_id
          ? await this.usersRepository.findOne({
              where: { id: l.sent_by_user_id },
            })
          : null;
        const country = l.filter_country_id
          ? await this.countriesRepository.findOne({
              where: { id: l.filter_country_id },
            })
          : null;
        const event = l.filter_event_id
          ? await this.eventsRepository.findOne({
              where: { id: l.filter_event_id },
            })
          : null;
        return {
          id: l.id,
          message: l.message,
          total_recipients: l.total_recipients,
          sent_at: l.sent_at,
          sent_by_user: user ? { id: user.id, username: user.username } : null,
          filter_country: country
            ? { id: country.id, title: country.title }
            : null,
          filter_event: event ? { id: event.id, title: event.title } : null,
        };
      }),
    );
  }

  async findLogById(id: number): Promise<any> {
    const l = await this.broadcastLogsRepository.findOne({ where: { id } });
    if (!l) throw new NotFoundException('Broadcast log not found');
    const user = l.sent_by_user_id
      ? await this.usersRepository.findOne({ where: { id: l.sent_by_user_id } })
      : null;
    const country = l.filter_country_id
      ? await this.countriesRepository.findOne({
          where: { id: l.filter_country_id },
        })
      : null;
    const event = l.filter_event_id
      ? await this.eventsRepository.findOne({
          where: { id: l.filter_event_id },
        })
      : null;
    return {
      id: l.id,
      message: l.message,
      total_recipients: l.total_recipients,
      sent_at: l.sent_at,
      sent_by_user: user ? { id: user.id, username: user.username } : null,
      filter_country: country ? { id: country.id, title: country.title } : null,
      filter_event: event ? { id: event.id, title: event.title } : null,
    };
  }
}
