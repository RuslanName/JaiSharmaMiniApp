import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateRaffleDto {
  @IsString()
  @IsOptional()
  content: string;

  @IsDateString()
  @IsNotEmpty()
  send_at: string;
}
