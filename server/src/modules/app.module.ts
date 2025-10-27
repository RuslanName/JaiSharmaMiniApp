import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from '../config/constants';
import { UserModule } from './user/user.module';
import { RaffleModule } from './raffle/raffle.module';
import { SignalModule } from './signal/signal.module';
import { AuthModule } from './auth/auth.module';
import { BotModule } from './bot/bot.module';
import { SettingModule } from './setting/setting.module';
import { RoundModule } from './round/round.module';

const isDev = config.MODE === 'dev';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: config.DB_URL,
      port: 5432,
      username: config.DB_USERNAME,
      password: config.DB_PASSWORD,
      database: config.DB_DATABASE,
      entities: [__dirname + '/**/*.{entity,entities}{.ts,.js}'],
      synchronize: isDev,
      ssl: isDev
        ? false
        : {
            rejectUnauthorized: false,
          },
    }),
    AuthModule,
    BotModule,
    RaffleModule,
    RoundModule,
    SettingModule,
    SignalModule,
    UserModule,
  ],
})
export class AppModule {}
