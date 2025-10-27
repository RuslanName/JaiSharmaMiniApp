import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Signal } from './signal.entity';
import { SettingService } from '../setting/setting.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SignalStatus } from '../../enums/signal-status.enum';

@Injectable()
export class SignalExpirationService {
  constructor(
    @InjectRepository(Signal)
    private signalRepository: Repository<Signal>,
    private settingService: SettingService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleSignalExpiration() {
    try {
      const signalConfirmTimeoutSetting = await this.settingService.findByKey(
        'signal_confirm_timeout',
      );
      const signalConfirmTimeout = signalConfirmTimeoutSetting
        ? parseInt(signalConfirmTimeoutSetting.value as string, 10)
        : 30;

      const now = new Date();
      const expirationTime = new Date(
        now.getTime() - signalConfirmTimeout * 1000,
      );

      const signals = await this.signalRepository.find({
        where: {
          status: SignalStatus.ACTIVE,
          activated_at: LessThanOrEqual(expirationTime),
        },
      });

      for (const signal of signals) {
        await this.signalRepository.delete(signal.id);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.log(`Error in signal expiration: ${errorMessage}`);
      throw new Error(`Error in signal expiration: ${errorMessage}`);
    }
  }
}
