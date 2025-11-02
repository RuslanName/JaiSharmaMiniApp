import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Not, Repository } from 'typeorm';
import { Signal } from './signal.entity';
import { User } from '../user/entities/user.entity';
import { CreateSignalDto } from './dtos/create-signal.dto';
import { UpdateSignalDto } from './dtos/update-signal.dto';
import { PaginationDto } from '../../common/pagination.dto';
import { SignalFilterDto } from './dtos/signal-filter.dto';
import { RoundService } from '../round/round.service';
import { SettingService } from '../setting/setting.service';
import { BotService } from '../bot/bot.service';
import { SignalStatus } from '../../enums/signal-status.enum';

@Injectable()
export class SignalService {
  constructor(
    @InjectRepository(Signal)
    private signalRepository: Repository<Signal>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private roundService: RoundService,
    private settingService: SettingService,
    private botService: BotService,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
    filterDto: SignalFilterDto,
  ): Promise<{ data: Signal[]; total: number }> {
    const page = Number(paginationDto?.page) || 1;
    const limit = Number(paginationDto?.limit) || 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Signal> = {
      status: Not(SignalStatus.PENDING),
    };
    if (filterDto.id) where.id = filterDto.id;
    if (filterDto.multiplier) where.multiplier = filterDto.multiplier;
    if (filterDto.amount) where.amount = filterDto.amount;
    if (filterDto.status) where.status = filterDto.status;
    if (filterDto.user_id) {
      const userId = parseInt(filterDto.user_id, 10);
      if (!isNaN(userId)) {
        where.user = { id: userId };
      } else {
        where.user = { username: Like(`%${filterDto.user_id}%`) };
      }
    }

    const [data, total] = await this.signalRepository.findAndCount({
      where,
      skip,
      take: limit,
      relations: ['user'],
      order: { created_at: 'DESC' },
    });

    return { data, total };
  }

  async findOne(id: number): Promise<Signal> {
    const signal = await this.signalRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!signal) {
      throw new NotFoundException(`Signal with ID ${id} not found`);
    }
    return signal;
  }

  private async validateUser(
    userId: number | null | undefined,
  ): Promise<User | null> {
    if (userId === null || userId === undefined) {
      return null;
    }
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  async create(createSignalDto: CreateSignalDto): Promise<Signal> {
    const { user_id, ...signalData } = createSignalDto;
    const user = await this.validateUser(user_id);
    const signal = this.signalRepository.create({ ...signalData, user });
    return await this.signalRepository.save(signal);
  }

  async update(id: number, updateSignalDto: UpdateSignalDto): Promise<Signal> {
    const signal = await this.signalRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!signal) {
      throw new NotFoundException(`Signal with ID ${id} not found`);
    }

    Object.assign(signal, updateSignalDto);
    if (updateSignalDto.user_id !== undefined) {
      signal.user = await this.validateUser(updateSignalDto.user_id);
    }
    return await this.signalRepository.save(signal);
  }

  async delete(id: number): Promise<void> {
    const result = await this.signalRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Signal with ID ${id} not found`);
    }
  }

  async checkAnalysisCondition(): Promise<boolean> {
    const analysisRounds =
      parseInt(
        (await this.settingService.findByKey('analysis_rounds'))
          .value as string,
        10,
      ) || 15;
    const analysisPercentage =
      parseFloat(
        (await this.settingService.findByKey('analysis_percentage'))
          .value as string,
      ) || 70;
    const minAnalysisCoefficient =
      parseFloat(
        (await this.settingService.findByKey('min_analysis_coefficient'))
          .value as string,
      ) || 1.0;
    const maxAnalysisCoefficient =
      parseFloat(
        (await this.settingService.findByKey('max_analysis_coefficient'))
          .value as string,
      ) || 1.5;

    const recentRounds =
      await this.roundService.getRecentRounds(analysisRounds);
    const lowMultiplierRounds = recentRounds.filter(
      (round) =>
        round.multiplier >= minAnalysisCoefficient &&
        round.multiplier <= maxAnalysisCoefficient,
    );
    const percentage = (lowMultiplierRounds.length / recentRounds.length) * 100;
    console.log(percentage >= analysisPercentage);
    return percentage >= analysisPercentage;
  }

  async processSignal(signalId: number, userId: number, chatId?: string) {
    const signal = await this.signalRepository.findOne({
      where: { id: signalId },
    });
    if (!signal) return;

    let analysisMet = await this.checkAnalysisCondition();
    const maxWaitTime = 300000;
    const startTime = Date.now();

    while (!analysisMet && Date.now() - startTime < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      analysisMet = await this.checkAnalysisCondition();
    }

    if (chatId) {
      try {
        await this.botService.sendMessage(chatId, 'Signal is coming soon');
      } catch (error: unknown) {
        console.log(
          `Failed to send "Signal is coming soon" message to user ${userId}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    }

    const signalReceiveTimeSetting = await this.settingService.findByKey(
      'signal_receive_time',
    );
    const signalReceiveTime = signalReceiveTimeSetting
      ? parseInt(signalReceiveTimeSetting.value as string, 10)
      : 50;
    await new Promise((resolve) =>
      setTimeout(resolve, signalReceiveTime * 1000),
    );

    const minIssuingCoefficient =
      parseFloat(
        (await this.settingService.findByKey('min_issuing_coefficient'))
          .value as string,
      ) || 2.0;
    const maxIssuingCoefficient =
      parseFloat(
        (await this.settingService.findByKey('max_issuing_coefficient'))
          .value as string,
      ) || 3.0;

    const recentRounds = await this.roundService.getRecentRounds(15);
    const suitableRounds = recentRounds.filter(
      (round) =>
        round.multiplier >= minIssuingCoefficient &&
        round.multiplier <= maxIssuingCoefficient,
    );

    let selectedMultiplier: number;

    if (suitableRounds.length > 0) {
      const randomIndex = Math.floor(Math.random() * suitableRounds.length);
      selectedMultiplier = suitableRounds[randomIndex].multiplier;
    } else {
      const randomValue =
        Math.random() * (maxIssuingCoefficient - minIssuingCoefficient) +
        minIssuingCoefficient;
      selectedMultiplier = Math.round(randomValue * 100) / 100;
    }

    selectedMultiplier = Math.round(selectedMultiplier * 100) / 100;

    signal.multiplier = selectedMultiplier;
    signal.status = SignalStatus.ACTIVE;
    signal.activated_at = new Date();
    await this.signalRepository.save(signal);

    if (chatId) {
      try {
        await this.botService.sendMessage(
          chatId,
          'Signal received. Open the Mini App',
        );
      } catch (error: unknown) {
        console.log(
          `Failed to send signal received message to user ${userId}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    }
  }

  async claimSignal(userId: number, signalId: number): Promise<Signal> {
    const user = await this.validateUser(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.energy < 1) {
      throw new Error(`Insufficient energy for user ${userId}`);
    }

    const signal = await this.signalRepository.findOne({
      where: {
        id: signalId,
        user: { id: userId },
        status: SignalStatus.ACTIVE,
      },
      relations: ['user'],
    });
    if (!signal) {
      throw new NotFoundException(
        `Signal with ID ${signalId} not found or not accessible`,
      );
    }

    user.energy -= 1;
    await this.userRepository.save(user);

    signal.status = SignalStatus.COMPLETED;
    await this.signalRepository.save(signal);
    return signal;
  }

  async getSignalRequestStatus(userId: number): Promise<{
    canRequest: boolean;
    cooldownSeconds?: number;
    isPending?: boolean;
    requestTime?: number;
    activatedAt?: number;
    confirmTimeout?: number;
  }> {
    const user = await this.validateUser(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const recoveryTimeSetting = await this.settingService.findByKey(
      'signal_request_recovery_time',
    );
    const recoveryTimeMinutes = recoveryTimeSetting
      ? parseInt(recoveryTimeSetting.value as string, 10)
      : 1;

    let cooldownSeconds: number | undefined;

    if (user.last_signal_request_at) {
      const now = new Date();
      const diffMs = now.getTime() - user.last_signal_request_at.getTime();
      const diffSeconds = diffMs / 1000;
      const requiredSeconds = recoveryTimeMinutes * 60;

      if (diffSeconds < requiredSeconds) {
        cooldownSeconds = Math.ceil(requiredSeconds - diffSeconds);
      }
    }

    const canRequest = !cooldownSeconds;

    const pendingSignal = await this.signalRepository.findOne({
      where: { user: { id: userId }, status: SignalStatus.PENDING },
    });

    if (pendingSignal) {
      return {
        canRequest: false,
        isPending: true,
        requestTime: pendingSignal.created_at.getTime(),
      };
    }

    const activeSignal = await this.signalRepository.findOne({
      where: { user: { id: userId }, status: SignalStatus.ACTIVE },
    });

    if (activeSignal && activeSignal.activated_at) {
      const timeoutSetting = await this.settingService.findByKey(
        'signal_confirm_timeout',
      );
      const confirmTimeout = timeoutSetting
        ? parseInt(timeoutSetting.value as string, 10)
        : 30;

      return {
        canRequest: false,
        activatedAt: activeSignal.activated_at.getTime(),
        confirmTimeout: confirmTimeout * 1000,
      };
    }

    return {
      canRequest,
      cooldownSeconds,
    };
  }

  async clearRequest(userId: number): Promise<void> {
    const user = await this.validateUser(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    await this.signalRepository.delete({
      user: { id: userId },
      status: SignalStatus.PENDING,
    });
  }
}
