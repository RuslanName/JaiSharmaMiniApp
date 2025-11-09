import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TopWinnerSignal } from './top-winner-signal.entity';
import { PaginationDto } from '../../common/pagination.dto';

@Injectable()
export class TopWinnerSignalService {
  constructor(
    @InjectRepository(TopWinnerSignal)
    private topWinnerSignalRepository: Repository<TopWinnerSignal>,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<{ data: TopWinnerSignal[]; total: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.topWinnerSignalRepository.findAndCount({
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return { data, total };
  }
}
