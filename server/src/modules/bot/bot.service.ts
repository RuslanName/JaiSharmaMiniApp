import { Injectable, OnModuleInit } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { config } from '../../config/constants';
import { CreateUserDto } from '../user/dtos/user/create-user.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class BotService implements OnModuleInit {
  private bot: Telegraf;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    const botToken = config.BOT_TOKEN;
    if (!botToken) throw new Error('Bot token is not defined');
    this.bot = new Telegraf(botToken);
  }

  async onModuleInit() {
    const webhookUrl = config.WEBHOOK_URL;
    if (!webhookUrl) throw new Error('Webhook URL is not defined');

    this.bot.start(async (ctx) => {
      const chat = ctx.message.chat;
      const userData: CreateUserDto = {
        chat_id: chat.id.toString(),
        username: ctx.from.username || '',
        first_name: ctx.from.first_name || '',
        last_name: ctx.from.last_name || '',
      };
      await this.findOrCreateUser(userData);

      const miniAppUrl = config.WEB_APP_URL;
      if (!miniAppUrl) throw new Error('Web app URL is not defined');

      const replyMarkup = {
        inline_keyboard: [
          [{ text: 'Go to the app', web_app: { url: miniAppUrl } }],
        ],
      };

      await ctx.reply('Telegram Mini App', { reply_markup: replyMarkup });
    });

    await this.bot.telegram.setWebhook(webhookUrl + '/api/bot/webhook');
  }

  async handleUpdate(update: any) {
    await this.bot.handleUpdate(update);
  }

  async sendMessage(chatId: string, message: string): Promise<void> {
    await this.bot.telegram.sendMessage(chatId, message);
  }

  private async findOrCreateUser(
    userData: CreateUserDto,
  ): Promise<User | null> {
    let user = await this.userRepository.findOne({
      where: { chat_id: userData.chat_id },
    });

    if (!user) {
      user = this.userRepository.create(userData);
      await this.userRepository.save(user);
    }

    return user;
  }
}
