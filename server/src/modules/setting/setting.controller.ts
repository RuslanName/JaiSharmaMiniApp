import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SettingService } from './setting.service';
import { UpdateSettingDto } from './dtos/update-setting.dto';
import { PaginationDto } from '../../common/pagination.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findAll(@Query() paginationDto: PaginationDto) {
    return await this.settingService.findAll(paginationDto);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findOne(@Param('id') id: number) {
    return await this.settingService.findOne(id);
  }

  @Get('key/:key')
  async findByKey(@Param('key') key: string) {
    return await this.settingService.findByKey(key);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async update(
    @Param('id') id: number,
    @Body() updateSettingDto: UpdateSettingDto,
  ) {
    return await this.settingService.update(id, updateSettingDto);
  }
}
