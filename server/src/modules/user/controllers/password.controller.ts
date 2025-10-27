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
import { PasswordService } from '../services/password.service';
import { CreatePasswordDto } from '../dtos/password/create-password.dto';
import { UpdatePasswordDto } from '../dtos/password/update-password.dto';
import { PaginationDto } from '../../../common/pagination.dto';
import { PasswordFilterDto } from '../dtos/password/password-filter.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('passwords')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PasswordController {
  constructor(private readonly passwordService: PasswordService) {}

  @Get()
  @Roles('admin')
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() filterDto: PasswordFilterDto,
  ) {
    return await this.passwordService.findAll(paginationDto, filterDto);
  }

  @Get(':id')
  @Roles('admin')
  async findOne(@Param('id') id: string) {
    return await this.passwordService.findOne(+id);
  }

  @Post()
  @Roles('admin')
  async create(@Body() createPasswordDto: CreatePasswordDto) {
    return await this.passwordService.create(createPasswordDto);
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return await this.passwordService.update(+id, updatePasswordDto);
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string) {
    return await this.passwordService.delete(+id);
  }
}
