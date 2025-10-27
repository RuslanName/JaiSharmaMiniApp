import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  @IsOptional()
  password: string;

  @IsString()
  @IsOptional()
  website_url: string;

  @IsNumber()
  @IsOptional()
  user_id: number;
}
