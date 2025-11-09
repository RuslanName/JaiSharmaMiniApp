import { IsNumber, IsString, IsEnum } from 'class-validator';
import { SignalStatus } from '../../../enums';

export class CreateSignalDto {
  @IsNumber()
  multiplier: number;

  @IsString()
  @IsEnum(SignalStatus)
  status: string;

  @IsNumber()
  user_id: number;
}
