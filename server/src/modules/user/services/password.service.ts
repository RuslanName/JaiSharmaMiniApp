import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { Password } from '../entities/password.entity';
import { User } from '../entities/user.entity';
import { CreatePasswordDto } from '../dtos/password/create-password.dto';
import { UpdatePasswordDto } from '../dtos/password/update-password.dto';
import { PaginationDto } from '../../../common/pagination.dto';
import { PasswordFilterDto } from '../dtos/password/password-filter.dto';
import { GeneratePasswordsDto } from '../dtos/password/generate-passwords.dto';
import { SettingService } from '../../setting/setting.service';

@Injectable()
export class PasswordService {
  constructor(
    @InjectRepository(Password)
    private passwordRepository: Repository<Password>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private settingService: SettingService,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
    filterDto: PasswordFilterDto,
  ): Promise<{ data: Password[]; total: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Password> = {};
    if (filterDto.id) where.id = filterDto.id;
    if (filterDto.password) where.password = Like(`%${filterDto.password}%`);
    if (filterDto.website_url)
      where.website_url = Like(`%${filterDto.website_url}%`);
    if (filterDto.user_id) {
      const userId = parseInt(filterDto.user_id, 10);
      if (!isNaN(userId)) {
        where.user = { id: userId };
      } else {
        throw new NotFoundException(`Invalid user_id format`);
      }
    }

    const [data, total] = await this.passwordRepository.findAndCount({
      where,
      skip,
      take: limit,
      relations: ['user'],
    });

    return { data, total };
  }

  async findOne(id: number): Promise<Password> {
    const password = await this.passwordRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!password) {
      throw new NotFoundException(`Password with ID ${id} not found`);
    }
    return password;
  }

  private async validateUser(
    userId: number | null | undefined | string,
  ): Promise<User | null> {
    if (userId === null || userId === undefined || userId === '') {
      return null;
    }
    const parsedId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(parsedId)) {
      return null;
    }
    const user = await this.userRepository.findOne({ where: { id: parsedId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${parsedId} not found`);
    }
    return user;
  }

  async create(createPasswordDto: CreatePasswordDto): Promise<Password> {
    const { user_id, password, website_url } = createPasswordDto;

    const user = await this.validateUser(user_id);

    const passwordEntity = this.passwordRepository.create({
      password,
      website_url,
      user,
    });
    return await this.passwordRepository.save(passwordEntity);
  }

  async update(
    id: number,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<Password> {
    const password = await this.passwordRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!password) {
      throw new NotFoundException(`Password with ID ${id} not found`);
    }

    Object.assign(password, {
      password: updatePasswordDto.password ?? password.password,
      website_url: updatePasswordDto.website_url ?? password.website_url,
    });

    if (updatePasswordDto.user_id !== undefined) {
      if (updatePasswordDto.user_id === null) {
        password.user = null;
      } else {
        password.user = await this.validateUser(updatePasswordDto.user_id);
      }
    }

    return await this.passwordRepository.save(password);
  }

  async delete(id: number): Promise<void> {
    const result = await this.passwordRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Password with ID ${id} not found`);
    }
  }

  async verify(
    userId: number,
    password: string,
  ): Promise<{ success: boolean }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['password'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const passwordRecord = await this.passwordRepository.findOne({
      where: { password },
    });

    if (!passwordRecord) {
      throw new UnauthorizedException('Invalid password');
    }

    if (user.password && user.password.id === passwordRecord.id) {
      throw new UnauthorizedException('Password already used');
    }

    user.password = passwordRecord;
    await this.userRepository.save(user);

    const maxEnergySetting = await this.settingService.findByKey('max_energy');
    user.energy = maxEnergySetting
      ? parseInt(maxEnergySetting.value as string, 10)
      : 100;

    await this.userRepository.save(user);

    return { success: true };
  }

  private generatePassword(): string {
    const uppercaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const chars = uppercaseLetters + digits;
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async generateMany(
    generatePasswordsDto: GeneratePasswordsDto,
  ): Promise<{ data: Password[]; count: number }> {
    const { count, website_url } = generatePasswordsDto;
    const passwords: Password[] = [];

    for (let i = 0; i < count; i++) {
      let password = this.generatePassword();
      let attempts = 0;
      const maxAttempts = 100;

      while (attempts < maxAttempts) {
        const existing = await this.passwordRepository.findOne({
          where: { password },
        });
        if (!existing) {
          break;
        }
        password = this.generatePassword();
        attempts++;
      }

      const passwordEntity = this.passwordRepository.create({
        password,
        website_url,
        user: null,
      });
      passwords.push(passwordEntity);
    }

    const savedPasswords = await this.passwordRepository.save(passwords);
    return { data: savedPasswords, count: savedPasswords.length };
  }
}
