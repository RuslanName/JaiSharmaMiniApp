import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SignalService } from './signal.service';
import { CreateSignalDto } from './dtos/create-signal.dto';
import { UpdateSignalDto } from './dtos/update-signal.dto';
import { PaginationDto } from '../../common/pagination.dto';
import { SignalFilterDto } from './dtos/signal-filter.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthenticatedRequest } from '../../types/express';

@Controller('signals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SignalController {
  constructor(private readonly signalService: SignalService) {}

  @Get()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() filterDto: SignalFilterDto,
  ) {
    return await this.signalService.findAll(paginationDto, filterDto);
  }

  @Get('status')
  @Header('Cache-Control', 'public, max-age=3')
  async getSignalRequestStatus(@Req() req: AuthenticatedRequest) {
    return await this.signalService.getSignalRequestStatus(req.user.id);
  }

  @Get(':id')
  @Roles('admin')
  async findOne(@Param('id') id: string) {
    return await this.signalService.findOne(+id);
  }

  @Post()
  @Roles('admin')
  async create(@Body() createSignalDto: CreateSignalDto) {
    return await this.signalService.create(createSignalDto);
  }

  @Post('claim/:id')
  async claimSignal(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return await this.signalService.claimSignal(req.user.id, +id);
  }

  @Post('clear-request')
  async clearRequest(@Req() req: AuthenticatedRequest) {
    await this.signalService.clearRequest(req.user.id);
    return { message: 'Signal request cleared' };
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body() updateSignalDto: UpdateSignalDto,
  ) {
    return await this.signalService.update(+id, updateSignalDto);
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string) {
    return await this.signalService.delete(+id);
  }
}
