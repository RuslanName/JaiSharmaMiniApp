import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../user/entities/user.entity';
import { IsEnum } from 'class-validator';
import { SignalStatus } from '../../enums/signal-status.enum';

@Entity('signals')
export class Signal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'float' })
  multiplier: number;

  @Column()
  amount: number;

  @Column({ default: SignalStatus.PENDING })
  @IsEnum(SignalStatus)
  status: string;

  @ManyToOne(() => User, (user) => user.signals)
  user: User | null;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  activated_at: Date | null;
}
