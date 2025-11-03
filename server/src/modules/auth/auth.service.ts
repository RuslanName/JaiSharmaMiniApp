import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHmac } from 'crypto';
import { UserService } from '../user/services/user.service';
import { CreateUserDto } from '../user/dtos/user/create-user.dto';
import { User } from '../user/entities/user.entity';
import { config } from '../../config/constants';
import { TelegramUserData } from '../../interfaces/telegram-user-data.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async validateCredentials(dto: {
    initData?: string;
    password?: string;
  }): Promise<{ token: string }> {
    if (dto.initData) {
      return this.validateTelegramInitData(dto.initData);
    } else if (dto.password) {
      return this.validatePassword(dto.password);
    } else {
      throw new UnauthorizedException(
        'Either initData or password must be provided',
      );
    }
  }

  private validatePassword(password: string): { token: string } {
    if (password !== config.ADMIN_PASSWORD) {
      throw new UnauthorizedException('Invalid password');
    }

    const adminUser = {
      id: 0,
      role: 'admin',
    };

    const payload = { sub: adminUser.id, role: adminUser.role };
    return { token: this.jwtService.sign(payload) };
  }

  private async validateTelegramInitData(
    initData: string,
  ): Promise<{ token: string }> {
    const isValid = this.verifyTelegramInitData(initData);
    if (!isValid) {
      throw new UnauthorizedException('Invalid Telegram initData');
    }

    const userData = this.parseInitData(initData);
    const user = await this.findOrCreateUser(userData);

    const payload = { sub: user.id, role: user.role };
    return { token: this.jwtService.sign(payload) };
  }

  private async findOrCreateUser(userData: CreateUserDto): Promise<User> {
    const existingUser = await this.userService.findOneByChatId(
      userData.chat_id,
    );
    if (existingUser) {
      return existingUser;
    }

    return await this.userService.create({
      ...userData,
    });
  }

  private verifyTelegramInitData(initData: string): boolean {
    const secretKey = createHmac('sha256', 'WebAppData')
      .update(String(process.env.BOT_TOKEN))
      .digest();

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const computedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return computedHash === hash;
  }

  private parseInitData(initData: string): CreateUserDto {
    const params = new URLSearchParams(initData);
    const userString = params.get('user');
    if (!userString) {
      throw new UnauthorizedException('Missing user data in initData');
    }
    try {
      const parsed: TelegramUserData = JSON.parse(userString);
      return {
        chat_id: String(parsed.id),
        username: parsed.username || '',
        first_name: parsed.first_name || '',
        last_name: parsed.last_name || '',
      };
    } catch {
      throw new UnauthorizedException('Invalid user data format');
    }
  }
}
