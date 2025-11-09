import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IsEnum } from 'class-validator';
import { CountryCurrency } from '../../enums';

@Entity('top_winner_signals')
export class TopWinnerSignal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  level: string;

  @Column({ type: 'float' })
  multiplier: number;

  @Column({ type: 'float' })
  amount: number;

  @Column({
    type: 'enum',
    enum: CountryCurrency,
  })
  @IsEnum(CountryCurrency)
  currency: CountryCurrency;

  @CreateDateColumn()
  created_at: Date;
}
