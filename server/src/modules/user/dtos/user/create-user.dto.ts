import { IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  chat_id: string;

  @IsString()
  @IsOptional()
  username: string;

  @IsString()
  @IsOptional()
  first_name: string;

  @IsString()
  @IsOptional()
  last_name: string;
}
