import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { User } from '../entities/user.entity';
import { Password } from '../entities/password.entity';
import { UpdateUserDto } from '../dtos/user/update-user.dto';
import { CreateUserDto } from '../dtos/user/create-user.dto';
import { PaginationDto } from '../../../common/pagination.dto';
import { UserFilterDto } from '../dtos/user/user-filter.dto';
import { UserWithMaxEnergy } from '../../../interfaces/user-with-max-energy.interface';
import { SettingService } from '../../setting/setting.service';
import { SignalStatus } from '../../../enums/signal-status.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Password)
    private passwordRepository: Repository<Password>,
    private settingService: SettingService,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
    filterDto: UserFilterDto,
  ): Promise<{ data: UserWithMaxEnergy[]; total: number }> {
    const page = Number(paginationDto?.page) || 1;
    const limit = Number(paginationDto?.limit) || 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<User> = {};
    if (filterDto.id) where.id = filterDto.id;
    if (filterDto.username) where.username = Like(`%${filterDto.username}%`);
    if (filterDto.first_name)
      where.first_name = Like(`%${filterDto.first_name}%`);
    if (filterDto.role) where.role = Like(`%${filterDto.role}%`);
    if (filterDto.is_access_allowed !== undefined)
      where.is_access_allowed = filterDto.is_access_allowed;
    if (filterDto.level) where.level = filterDto.level;

    const [data, total] = await this.userRepository.findAndCount({
      where,
      skip,
      take: limit,
      relations: ['password', 'signals'],
    });

    const maxEnergySetting = await this.settingService.findByKey('max_energy');
    const maxEnergy = maxEnergySetting ? Number(maxEnergySetting.value) : 5;

    const enrichedData = data.map((user) => ({
      ...user,
      maxEnergy,
    }));

    return { data: enrichedData, total };
  }

  async findOne(id: number): Promise<UserWithMaxEnergy> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['password', 'signals'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const maxEnergySetting = await this.settingService.findByKey('max_energy');
    const maxEnergy = maxEnergySetting ? Number(maxEnergySetting.value) : 5;

    return { ...user, maxEnergy };
  }

  async create(createUserDto: CreateUserDto): Promise<UserWithMaxEnergy> {
    const user = this.userRepository.create(createUserDto);

    const savedUser = await this.userRepository.save(user);
    const maxEnergySetting = await this.settingService.findByKey('max_energy');
    const maxEnergy = maxEnergySetting ? Number(maxEnergySetting.value) : 5;

    return { ...savedUser, maxEnergy };
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserWithMaxEnergy> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['password', 'signals'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    Object.assign(user, updateUserDto);

    if (updateUserDto.password_id !== undefined) {
      if (updateUserDto.password_id === null) {
        user.password = null;
      } else {
        const passwordId = updateUserDto.password_id;
        if (isNaN(passwordId)) {
          throw new NotFoundException(`Invalid password_id format`);
        }
        const password = await this.passwordRepository.findOne({
          where: { id: passwordId },
        });
        if (!password) {
          throw new NotFoundException(
            `Password with ID ${passwordId} not found`,
          );
        }
        user.password = password;
      }
    }

    const savedUser = await this.userRepository.save(user);

    const maxEnergySetting = await this.settingService.findByKey('max_energy');
    const maxEnergy = maxEnergySetting ? Number(maxEnergySetting.value) : 5;

    return { ...savedUser, maxEnergy };
  }

  async findOneByChatId(chat_id: string): Promise<UserWithMaxEnergy | null> {
    const user = await this.userRepository.findOne({
      where: { chat_id },
      relations: ['password', 'signals'],
    });
    if (!user) {
      return null;
    }
    const maxEnergySetting = await this.settingService.findByKey('max_energy');
    const maxEnergy = maxEnergySetting ? Number(maxEnergySetting.value) : 5;

    return { ...user, maxEnergy };
  }

  async getLeaderboard(
    paginationDto: PaginationDto,
  ): Promise<{ data: any[]; total: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data] = await this.userRepository.findAndCount({
      order: { energy: 'DESC' },
      skip,
      take: limit,
      relations: ['password', 'signals'],
    });

    const maxEnergySetting = await this.settingService.findByKey('max_energy');
    const maxEnergy = maxEnergySetting ? Number(maxEnergySetting.value) : 100;

    const enrichedData = data
      .map((user) => {
        const completedSignals = user.signals.filter(
          (signal) =>
            (signal.status as SignalStatus) === SignalStatus.COMPLETED,
        );

        if (completedSignals.length === 0) {
          return null;
        }

        const bestSignal = completedSignals.reduce(
          (max, signal) => (signal.amount > max.amount ? signal : max),
          completedSignals[0],
        );

        if (bestSignal.amount <= 0) {
          return null;
        }

        return {
          ...user,
          maxEnergy,
          best_signal: bestSignal,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return { data: enrichedData, total: enrichedData.length };
  }

  async delete(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await this.userRepository.delete(id);
  }

  async toggleAccess(
    id: number,
    is_access_allowed: boolean,
  ): Promise<UserWithMaxEnergy> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    user.is_access_allowed = is_access_allowed;
    const savedUser = await this.userRepository.save(user);
    const maxEnergySetting = await this.settingService.findByKey('max_energy');
    const maxEnergy = maxEnergySetting ? Number(maxEnergySetting.value) : 5;

    return { ...savedUser, maxEnergy };
  }
}
