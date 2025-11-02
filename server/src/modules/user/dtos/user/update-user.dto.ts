import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @Transform(({ value }: { value: unknown }) => {
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    const parsed =
      typeof value === 'string'
        ? parseInt(value, 10)
        : typeof value === 'number'
          ? value
          : null;
    return parsed !== null && !isNaN(parsed) ? parsed : null;
  })
  @ValidateIf((o: { password_id: number | null }) => o.password_id !== null)
  @IsNumber()
  @IsOptional()
  password_id: number | null;

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
