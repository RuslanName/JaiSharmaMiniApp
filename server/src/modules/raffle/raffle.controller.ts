import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RaffleService } from './raffle.service';
import { CreateRaffleDto } from './dtos/create-raffle.dto';
import { UpdateRaffleDto } from './dtos/update-raffle.dto';
import { PaginationDto } from '../../common/pagination.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('raffles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RaffleController {
  constructor(private readonly raffleService: RaffleService) {}

  @Get()
  @Roles('admin')
  async findAll(@Query() paginationDto: PaginationDto) {
    return await this.raffleService.findAll(paginationDto);
  }

  @Get(':id')
  @Roles('admin')
  async findOne(@Param('id') id: string) {
    return await this.raffleService.findOne(+id);
  }

  @Post()
  @Roles('admin')
  async create(@Body() createRaffleDto: CreateRaffleDto) {
    return await this.raffleService.create(createRaffleDto);
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body() updateRaffleDto: UpdateRaffleDto,
  ) {
    return await this.raffleService.update(+id, updateRaffleDto);
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string) {
    return await this.raffleService.delete(+id);
  }
}
