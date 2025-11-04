import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Signal } from './signal.entity';
import { User } from '../user/entities/user.entity';
import { SettingService } from '../setting/setting.service';
import { BotService } from '../bot/bot.service';
import { SignalService } from './signal.service';
import { SignalStatus } from '../../enums/signal-status.enum';
import { TimeRange } from '../../interfaces/time-range.interface';

@Injectable()
export class SignalAutomaticService {
  private isRunning = false;
  private readonly lockKey = 'signal_distribution_lock';

  constructor(
    @InjectRepository(Signal)
    private signalRepository: Repository<Signal>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private settingService: SettingService,
    private botService: BotService,
    @Inject(forwardRef(() => SignalService))
    private signalService: SignalService,
    private dataSource: DataSource,
  ) {}

  @Cron('*/1 * * * *')
  async distributeSignalRequests() {
    if (this.isRunning) {
      return;
    }

    const isInRange = await this.isTimeInAllowedRanges();
    if (!isInRange) {
      return;
    }

    const lockResult = await this.dataSource.query(
      `SELECT pg_try_advisory_lock(hashtext($1)) as acquired`,
      [this.lockKey],
    );

    if (!lockResult?.[0]?.acquired) {
      return;
    }

    this.isRunning = true;
    try {
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
      await this.dataSource
        .query(`SELECT pg_advisory_unlock(hashtext($1))`, [this.lockKey])
        .catch(() => {});
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
      relations: ['password'],
    });

    const now = new Date();
    const eligibleUsers: User[] = [];

    for (const user of users) {
      if (user.energy < 1) {
        continue;
      }

      if (!user.password) {
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
      const savedSignal = await this.dataSource.transaction(
        'SERIALIZABLE',
        async (manager) => {
          const userEntity = await manager
            .createQueryBuilder(User, 'user')
            .where('user.id = :userId', { userId: user.id })
            .setLock('pessimistic_write')
            .getOne();

          if (!userEntity) {
            return null;
          }

          const existingSignal = await manager
            .createQueryBuilder(Signal, 'signal')
            .innerJoin('signal.user', 'user')
            .where('user.id = :userId', { userId: user.id })
            .andWhere('signal.status IN (:...statuses)', {
              statuses: [SignalStatus.ACTIVE, SignalStatus.PENDING],
            })
            .setLock('pessimistic_write')
            .getOne();

          if (existingSignal) {
            return null;
          }

          await manager.update(
            User,
            { id: user.id },
            {
              last_signal_request_at: new Date(),
            },
          );

          const signal = manager.create(Signal, {
            multiplier: 0,
            amount: 0,
            status: SignalStatus.PENDING,
            user: { id: user.id },
          });

          return await manager.save(Signal, signal);
        },
      );

      if (!savedSignal) {
        return;
      }

      try {
        const updatedUser = await this.userRepository.findOne({
          where: { id: user.id },
        });

        if (updatedUser?.chat_id) {
          try {
            await this.botService.sendMessage(
              updatedUser.chat_id,
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

        await this.signalService.processSignal(
          savedSignal.id,
          user.id,
          updatedUser?.chat_id,
        );
      } catch (error: unknown) {
        console.log(
          `Error processing signal for user ${user.id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error.message.includes('duplicate') ||
          error.message.includes('unique') ||
          error.message.includes('violates unique constraint'))
      ) {
        return;
      }

      console.log(
        `Error creating signal request for user ${user.id}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
