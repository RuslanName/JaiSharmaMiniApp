import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Raffle } from './raffle.entity';
import { RaffleController } from './raffle.controller';
import { RaffleService } from './raffle.service';
import { RaffleDistributionService } from './raffle-distribution.service';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Raffle]),
    ScheduleModule.forRoot(),
    UserModule,
  ],
  controllers: [RaffleController],
  providers: [RaffleService, RaffleDistributionService],
})
export class RaffleModule {}
