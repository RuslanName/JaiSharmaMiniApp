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
      // ---------- ACTIVE ----------
      const signalConfirmTimeoutSetting = await this.settingService.findByKey(
        'signal_confirm_timeout',
      );
      const signalConfirmTimeout = signalConfirmTimeoutSetting
        ? parseInt(signalConfirmTimeoutSetting.value as string, 10)
        : 30; // seconds

      const now = new Date();
      const activeExpiration = new Date(
        now.getTime() - signalConfirmTimeout * 1000,
      );

      await this.signalRepository.delete({
        status: SignalStatus.ACTIVE,
        activated_at: LessThanOrEqual(activeExpiration),
      });

      const pendingMaxAgeSetting = await this.settingService.findByKey(
        'pending_signal_max_age',
      );
      const pendingMaxAgeSeconds = pendingMaxAgeSetting
        ? parseInt(pendingMaxAgeSetting.value as string, 10)
        : 600;

      const pendingExpiration = new Date(
        now.getTime() - pendingMaxAgeSeconds * 1000,
      );

      await this.signalRepository.delete({
        status: SignalStatus.PENDING,
        created_at: LessThanOrEqual(pendingExpiration),
      });
    } catch (error: unknown) {
      console.log(
        `Error in signal expiration: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
