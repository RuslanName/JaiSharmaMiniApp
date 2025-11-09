import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IsEnum } from 'class-validator';
import { RaffleStatus } from '../../enums';

@Entity('raffles')
export class Raffle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column()
  send_at: Date;

  @Column({ default: RaffleStatus.WAITING })
  @IsEnum(RaffleStatus)
  status: string;

  @CreateDateColumn()
  created_at: Date;
}
