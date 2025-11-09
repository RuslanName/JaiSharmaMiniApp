import { IsInt, IsString, IsNotEmpty } from 'class-validator';

export class GeneratePasswordsDto {
  @IsInt()
  count: number;

  @IsString()
  @IsNotEmpty()
  website_url: string;
}
