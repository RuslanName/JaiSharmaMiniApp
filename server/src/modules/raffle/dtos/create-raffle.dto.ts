import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateRaffleDto {
  @IsString()
  content: string;

  @IsDateString()
  @IsNotEmpty()
  send_at: string;
}
