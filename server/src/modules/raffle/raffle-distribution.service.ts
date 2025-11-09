import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Raffle } from './raffle.entity';
import { User } from '../user/entities/user.entity';
import { RaffleStatus } from '../../enums';
import { Telegraf } from 'telegraf';
import { config } from '../../config/constants';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class RaffleDistributionService {
  private bot: Telegraf;

  constructor(
    @InjectRepository(Raffle)
    private raffleRepository: Repository<Raffle>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    const botToken = config.BOT_TOKEN;
    if (!botToken) throw new Error('Bot token is not defined');
    this.bot = new Telegraf(botToken);
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleRaffleDistribution() {
    try {
      const now = new Date();
      const raffles = await this.raffleRepository.find({
        where: {
          status: RaffleStatus.WAITING,
          send_at: LessThanOrEqual(now),
        },
      });

      for (const raffle of raffles) {
        await this.processRaffle(raffle);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.log(`Error in raffle distribution: ${errorMessage}`);
      throw new Error(`Error in raffle distribution: ${errorMessage}`);
    }
  }

  private async processRaffle(raffle: Raffle) {
    try {
      const updated = await this.raffleRepository
        .createQueryBuilder()
        .update(Raffle)
        .set({ status: RaffleStatus.PROCEED })
        .where('id = :id AND status = :status', {
          id: raffle.id,
          status: RaffleStatus.WAITING,
        })
        .execute();

      if (updated.affected === 0) {
        console.log(`Raffle ${raffle.id} was already processed`);
        return;
      }

      const users = await this.userRepository.find({
        where: { is_access_allowed: true },
      });

      for (const user of users) {
        if (user.chat_id) {
          try {
            await this.bot.telegram.sendMessage(user.chat_id, raffle.content);
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            console.log(
              `Failed to send message to user ${user.chat_id}: ${errorMessage}`,
            );
          }
        }
      }

      await this.raffleRepository.update(raffle.id, {
        status: RaffleStatus.SENT,
      });

      console.log(
        `Raffle ${raffle.id} successfully sent to ${users.length} users`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.log(`Error processing raffle ${raffle.id}: ${errorMessage}`);
      await this.raffleRepository.update(raffle.id, {
        status: RaffleStatus.WAITING,
      });
      throw new Error(`Error processing raffle ${raffle.id}: ${errorMessage}`);
    }
  }
}
