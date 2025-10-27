import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
} from 'typeorm';
import { User } from './user.entity';

@Entity('passwords')
export class Password {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  password: string;

  @Column()
  website_url: string;

  @OneToOne(() => User, (user) => user.password)
  user: User | null;

  @CreateDateColumn()
  created_at: Date;
}
