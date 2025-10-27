import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Password } from './password.entity';
import { Signal } from '../../signal/signal.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  chat_id: string;

  @Column()
  username: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ default: 'new' })
  level: string;

  @Column({ default: 0 })
  energy: number;

  @OneToOne(() => Password, (password) => password.user)
  @JoinColumn()
  password: Password | null;

  @OneToMany(() => Signal, (signal) => signal.user)
  signals: Signal[];

  @Column({ default: true })
  is_access_allowed: boolean;

  @CreateDateColumn()
  registered_at: Date;
}
