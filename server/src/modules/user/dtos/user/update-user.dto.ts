import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateUserDto {
  @IsNumber()
  @IsOptional()
  password_id: number;

  @IsString()
  @IsOptional()
  level: string;

  @IsInt()
  @IsOptional()
  energy: number;

  @IsBoolean()
  @IsOptional()
  is_access_allowed: boolean;
}
