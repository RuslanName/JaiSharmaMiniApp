import { IsNumber, IsInt, IsString, IsEnum } from 'class-validator';
import { SignalStatus } from '../../../enums/signal-status.enum';

export class CreateSignalDto {
  @IsNumber()
  multiplier: number;

  @IsInt()
  amount: number;

  @IsString()
  @IsEnum(SignalStatus)
  status: string;

  @IsNumber()
  user_id: number;
}
