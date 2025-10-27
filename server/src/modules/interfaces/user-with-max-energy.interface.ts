import { User } from '../user/entities/user.entity';

export interface UserWithMaxEnergy extends User {
  maxEnergy: number;
}
