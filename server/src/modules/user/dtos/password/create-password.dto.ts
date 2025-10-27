import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePasswordDto {
  @IsString()
  password: string;

  @IsString()
  website_url: string;

  @IsNumber()
  @IsOptional()
  user_id: number;
}
