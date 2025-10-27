import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Round } from './round.entity';
import { RoundService } from './round.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [TypeOrmModule.forFeature([Round]), ScheduleModule.forRoot()],
  providers: [RoundService],
  exports: [RoundService],
})
export class RoundModule {}
