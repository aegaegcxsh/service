import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BroadcastService } from './broadcast.service';
import { BroadcastController } from './broadcast.controller';
import { BroadcastLog } from './entities/broadcast.entities';
import { Client } from '../clients/entities/client.enitites';
import { User } from '../users/entities/user.entity';
import { Country } from '../country/entities/country.entities';
import { Event } from '../events/entities/event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BroadcastLog, Client, User, Country, Event]),
  ],
  controllers: [BroadcastController],
  providers: [BroadcastService],
})
export class BroadcastModule {}
