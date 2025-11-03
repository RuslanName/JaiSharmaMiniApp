import { IsInt } from 'class-validator';

export class GeneratePasswordsDto {
  @IsInt()
  count: number;
}
