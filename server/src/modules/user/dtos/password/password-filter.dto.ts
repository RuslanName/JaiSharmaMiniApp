import { IsInt, IsOptional, IsString } from 'class-validator';

export class PasswordFilterDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  website_url?: string;

  @IsOptional()
  @IsString()
  user_id?: string;
}
