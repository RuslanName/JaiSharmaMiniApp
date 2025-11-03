import { User } from '../modules/user/entities/user.entity';

export interface UserWithMaxEnergy extends User {
  maxEnergy: number;
}
