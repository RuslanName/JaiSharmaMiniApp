import { IsInt, IsOptional, IsNumber, IsString } from 'class-validator';

export class SignalFilterDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsOptional()
  @IsNumber()
  multiplier?: number;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsNumber()
  status?: string;

  @IsOptional()
  @IsString()
  user_id?: string;
}
