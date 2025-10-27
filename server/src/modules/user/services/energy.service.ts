import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { SettingService } from '../../setting/setting.service';

@Injectable()
export class EnergyService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private settingService: SettingService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'UTC' })
  async distributeDailyEnergy() {
    console.log('Starting daily energy distribution');

    try {
      const maxEnergySetting =
        await this.settingService.findByKey('max_energy');
      const maxEnergy = maxEnergySetting
        ? parseInt(maxEnergySetting.value as string, 10)
        : 100;

      const users = await this.userRepository.find();
      for (const user of users) {
        user.energy = maxEnergy;
        await this.userRepository.save(user);
      }

      console.log(
        `Successfully distributed ${maxEnergy} energy to ${users.length} users`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.log(`Failed to distribute daily energy: ${errorMessage}`);
      throw new Error(`Failed to distribute daily energy: ${errorMessage}`);
    }
  }
}
