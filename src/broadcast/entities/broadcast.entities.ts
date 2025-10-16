import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('broadcast_logs')
export class BroadcastLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  message: string;

  @Column({ type: 'int', nullable: true })
  filter_country_id: number | null;

  @Column({ type: 'int', nullable: true })
  filter_event_id: number | null;

  @Column({ type: 'int', default: 0 })
  total_recipients: number;

  @Column({ type: 'int', nullable: true })
  sent_by_user_id: number | null;

  @CreateDateColumn({ name: 'sent_at' })
  sent_at: Date;
}
