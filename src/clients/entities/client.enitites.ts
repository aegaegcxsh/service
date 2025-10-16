import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Country } from 'src/country/entities/country.entities';
import { Event } from 'src/events/entities/event.entity';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  caption: string;

  @ManyToOne(() => Country, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'country_id' })
  country: Country;

  @Column({ nullable: true })
  country_id: number;

  /** Множество событий, в которых участвует клиент */
  @ManyToMany(() => Event, (event) => event.clients, { eager: true })
  @JoinTable({
    name: 'client_events',
    joinColumn: { name: 'client_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'event_id', referencedColumnName: 'id' },
  })
  events: Event[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
