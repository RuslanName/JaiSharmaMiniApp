import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Signal } from './signal.entity';
import { SignalController } from './signal.controller';
import { SignalService } from './signal.service';
import { User } from '../user/entities/user.entity';
import { Password } from '../user/entities/password.entity';
import { SettingModule } from '../setting/setting.module';
import { RoundModule } from '../round/round.module';
import { SignalExpirationService } from './signal-expiration.service';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Signal, Password, User]),
    SettingModule,
    RoundModule,
    BotModule,
  ],
  controllers: [SignalController],
  providers: [SignalService, SignalExpirationService],
})
export class SignalModule {}
