import { IsOptional, IsString } from 'class-validator';

export class UpdateSettingDto {
  @IsString()
  @IsOptional()
  key: string;

  @IsString()
  @IsOptional()
  value: any;
}
