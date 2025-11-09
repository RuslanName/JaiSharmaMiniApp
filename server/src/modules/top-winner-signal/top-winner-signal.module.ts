import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TopWinnerSignal } from './top-winner-signal.entity';
import { TopWinnerSignalController } from './top-winner-signal.controller';
import { TopWinnerSignalService } from './top-winner-signal.service';
import { TopWinnerSignalGenerationService } from './top-winner-signal-generation.service';
import { SettingModule } from '../setting/setting.module';

@Module({
  imports: [TypeOrmModule.forFeature([TopWinnerSignal]), SettingModule],
  controllers: [TopWinnerSignalController],
  providers: [TopWinnerSignalService, TopWinnerSignalGenerationService],
  exports: [TopWinnerSignalService, TopWinnerSignalGenerationService],
})
export class TopWinnerSignalModule {}
