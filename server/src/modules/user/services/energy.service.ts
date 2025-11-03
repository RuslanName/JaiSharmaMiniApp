import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { SettingService } from '../../setting/setting.service';

@Injectable()
export class EnergyService {
  private isRunning = false;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private settingService: SettingService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'UTC' })
  async distributeDailyEnergy() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    try {
      const maxEnergySetting =
        await this.settingService.findByKey('max_energy');
      const maxEnergy = maxEnergySetting
        ? parseInt(maxEnergySetting.value as string, 10)
        : 100;

      await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({ energy: maxEnergy })
        .execute();
    } catch (error: unknown) {
      console.log(
        `Error in daily energy distribution: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    } finally {
      this.isRunning = false;
    }
  }
}
