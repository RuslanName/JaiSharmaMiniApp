import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Raffle } from './raffle.entity';
import { CreateRaffleDto } from './dtos/create-raffle.dto';
import { UpdateRaffleDto } from './dtos/update-raffle.dto';
import { PaginationDto } from '../../common/pagination.dto';

@Injectable()
export class RaffleService {
  constructor(
    @InjectRepository(Raffle)
    private raffleRepository: Repository<Raffle>,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<{ data: Raffle[]; total: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.raffleRepository.findAndCount({
      skip,
      take: limit,
    });

    return { data, total };
  }

  async findOne(id: number): Promise<Raffle> {
    const raffle = await this.raffleRepository.findOne({ where: { id } });
    if (!raffle) {
      throw new NotFoundException(`Raffle with ID ${id} not found`);
    }
    return raffle;
  }

  async create(createRaffleDto: CreateRaffleDto): Promise<Raffle> {
    const raffle = this.raffleRepository.create({
      ...createRaffleDto,
      send_at: new Date(createRaffleDto.send_at),
    });
    return await this.raffleRepository.save(raffle);
  }

  async update(id: number, updateRaffleDto: UpdateRaffleDto): Promise<Raffle> {
    const raffle = await this.raffleRepository.findOne({ where: { id } });
    if (!raffle) {
      throw new NotFoundException(`Raffle with ID ${id} not found`);
    }

    const updatedRaffle = {
      ...raffle,
      ...updateRaffleDto,
      send_at: updateRaffleDto.send_at
        ? new Date(updateRaffleDto.send_at)
        : raffle.send_at,
    };

    return await this.raffleRepository.save(updatedRaffle);
  }

  async delete(id: number): Promise<void> {
    const result = await this.raffleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Raffle with ID ${id} not found`);
    }
  }
}
