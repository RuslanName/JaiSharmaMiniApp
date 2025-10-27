import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('rounds')
export class Round {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  round_id: string;

  @Column({ type: 'float' })
  multiplier: number;

  @CreateDateColumn()
  created_at: Date;
}
