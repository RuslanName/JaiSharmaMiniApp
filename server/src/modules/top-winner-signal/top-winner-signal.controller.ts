import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TopWinnerSignalService } from './top-winner-signal.service';
import { PaginationDto } from '../../common/pagination.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('top-winner-signals')
@UseGuards(JwtAuthGuard)
export class TopWinnerSignalController {
  constructor(
    private readonly topWinnerSignalService: TopWinnerSignalService,
  ) {}

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    return await this.topWinnerSignalService.findAll(paginationDto);
  }
}
