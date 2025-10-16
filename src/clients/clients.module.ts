import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { Client } from './entities/client.enitites';
import { Event } from '../events/entities/event.entity';
import { Country } from '../country/entities/country.entities';

@Module({
  imports: [TypeOrmModule.forFeature([Client, Event, Country])],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
