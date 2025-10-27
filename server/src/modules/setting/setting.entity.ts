import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('settings')
@Unique(['key'])
export class Setting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  key: string;

  @Column({ type: 'jsonb' })
  value: any;
}
