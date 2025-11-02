import { IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdatePasswordDto {
  @IsString()
  @IsOptional()
  password: string;

  @IsString()
  @IsOptional()
  website_url: string;

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
  @ValidateIf((o: { user_id: number | null }) => o.user_id !== null)
  @IsNumber()
  @IsOptional()
  user_id: number | null;
}
