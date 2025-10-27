import { IsString, IsOptional } from 'class-validator';

export class AuthDto {
  @IsString()
  @IsOptional()
  initData?: string;

  @IsString()
  @IsOptional()
  password?: string;
}
