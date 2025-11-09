import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { SignalStatus } from '../../../enums';

export class UpdateSignalDto {
  @IsNumber()
  @IsOptional()
  multiplier: number;

  @IsString()
  @IsEnum(SignalStatus)
  @IsOptional()
  status: string;

  @IsNumber()
  @IsOptional()
  user_id: number;
}
