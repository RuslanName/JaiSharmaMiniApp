import { IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { SignalStatus } from '../../../enums/signal-status.enum';

export class UpdateSignalDto {
  @IsNumber()
  @IsOptional()
  multiplier: number;

  @IsInt()
  @IsOptional()
  amount: number;

  @IsString()
  @IsEnum(SignalStatus)
  @IsOptional()
  status: string;

  @IsNumber()
  @IsOptional()
  user_id: number;
}
