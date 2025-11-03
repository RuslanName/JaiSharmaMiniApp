import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Signal } from './signal.entity';
import { User } from '../user/entities/user.entity';
import { SettingService } from '../setting/setting.service';
import { BotService } from '../bot/bot.service';
import { SignalService } from './signal.service';
import { SignalStatus } from '../../enums/signal-status.enum';
import { TimeRange } from '../interfaces/time-range.interface';

@Injectable()
export class SignalAutomaticService {
  private isRunning = false;

  constructor(
    @InjectRepository(Signal)
    private signalRepository: Repository<Signal>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private settingService: SettingService,
    private botService: BotService,
    @Inject(forwardRef(() => SignalService))
    private signalService: SignalService,
  ) {}

  @Cron('*/15 * * * *')
  async distributeSignalRequests() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    try {
      const isInRange = await this.isTimeInAllowedRanges();
      if (!isInRange) {
        return;
      }

      const recoveryTimeSetting = await this.settingService.findByKey(
        'signal_request_recovery_time',
      );
      const recoveryTimeMinutes = recoveryTimeSetting
        ? parseInt(recoveryTimeSetting.value as string, 10)
        : 1;

      const maxUsersSetting = await this.settingService.findByKey(
        'max_users_get_signal_request',
      );
      const maxUsers = maxUsersSetting
        ? parseInt(maxUsersSetting.value as string, 10)
        : 10;

      const eligibleUsers = await this.getEligibleUsers(recoveryTimeMinutes);

      const usersToReceiveRequest = this.selectRandomUsers(
        eligibleUsers,
        maxUsers,
      );

      for (const user of usersToReceiveRequest) {
        await this.createRequestSignal(user);
      }
    } catch (error: unknown) {
      console.log(
        `Error in automatic signal request distribution: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    } finally {
      this.isRunning = false;
    }
  }

  private async isTimeInAllowedRanges(): Promise<boolean> {
    try {
      const rangesSetting = await this.settingService.findByKey(
        'signal_request_ranges',
      );

      if (!rangesSetting || !rangesSetting.value) {
        return true;
      }

      const ranges: TimeRange[] = Array.isArray(rangesSetting.value)
        ? (rangesSetting.value as TimeRange[])
        : (JSON.parse(rangesSetting.value as string) as TimeRange[]);

      if (!Array.isArray(ranges) || ranges.length === 0) {
        return true;
      }

      const now = new Date();
      const mskTime = new Date(
        now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }),
      );
      const currentTime = `${String(mskTime.getHours()).padStart(2, '0')}:${String(mskTime.getMinutes()).padStart(2, '0')}`;

      for (const range of ranges) {
        if (this.isTimeInRange(currentTime, range.start, range.end)) {
          return true;
        }
      }

      return false;
    } catch (error: unknown) {
      console.log(
        `Error checking time ranges: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return true;
    }
  }

  private isTimeInRange(
    currentTime: string,
    rangeStart: string,
    rangeEnd: string,
  ): boolean {
    const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
    const [startHours, startMinutes] = rangeStart.split(':').map(Number);
    const [endHours, endMinutes] = rangeEnd.split(':').map(Number);

    const currentTotal = currentHours * 60 + currentMinutes;
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;

    if (startTotal <= endTotal) {
      return currentTotal >= startTotal && currentTotal <= endTotal;
    } else {
      return currentTotal >= startTotal || currentTotal <= endTotal;
    }
  }

  private async getEligibleUsers(recoveryTimeMinutes: number): Promise<User[]> {
    const users = await this.userRepository.find({
      where: { is_access_allowed: true },
    });

    const now = new Date();
    const eligibleUsers: User[] = [];

    for (const user of users) {
      if (user.energy < 1) {
        continue;
      }

      const activeSignals = await this.signalRepository.count({
        where: {
          user: { id: user.id },
          status: SignalStatus.ACTIVE,
        },
      });

      const pendingSignals = await this.signalRepository.count({
        where: {
          user: { id: user.id },
          status: SignalStatus.PENDING,
        },
      });

      if (activeSignals > 0 || pendingSignals > 0) {
        continue;
      }

      if (user.last_signal_request_at) {
        const diffMs = now.getTime() - user.last_signal_request_at.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        if (diffMinutes < recoveryTimeMinutes) {
          continue;
        }
      }

      eligibleUsers.push(user);
    }

    return eligibleUsers;
  }

  private selectRandomUsers(users: User[], count: number): User[] {
    const shuffled = [...users].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private async createRequestSignal(user: User): Promise<void> {
    try {
      const existingActiveSignal = await this.signalRepository.findOne({
        where: {
          user: { id: user.id },
          status: SignalStatus.ACTIVE,
        },
      });

      const existingPendingSignal = await this.signalRepository.findOne({
        where: {
          user: { id: user.id },
          status: SignalStatus.PENDING,
        },
      });

      if (existingActiveSignal || existingPendingSignal) {
        return;
      }

      user.last_signal_request_at = new Date();
      await this.userRepository.save(user);

      const signal = this.signalRepository.create({
        multiplier: 0,
        amount: 0,
        status: SignalStatus.PENDING,
        user,
      });

      await this.signalRepository.save(signal);

      if (user.chat_id) {
        try {
          await this.botService.sendMessage(
            user.chat_id,
            'The analysis system is working. Wait for a signal',
          );
        } catch (error: unknown) {
          console.log(
            `Failed to send message to user ${user.id}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          );
        }
      }

      await this.signalService.processSignal(signal.id, user.id, user.chat_id);
    } catch (error: unknown) {
      console.log(
        `Error creating signal request for user ${user.id}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
