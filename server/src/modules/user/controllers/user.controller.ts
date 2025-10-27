import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { UpdateUserDto } from '../dtos/user/update-user.dto';
import { CreateUserDto } from '../dtos/user/create-user.dto';
import { PaginationDto } from '../../../common/pagination.dto';
import { UserFilterDto } from '../dtos/user/user-filter.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { AuthenticatedRequest } from '../../../types/express';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles('admin')
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() filterDto: UserFilterDto,
  ) {
    return await this.userService.findAll(paginationDto, filterDto);
  }

  @Get('me')
  async getCurrentUser(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return await this.userService.findOne(userId);
  }

  @Get('leaderboard')
  async getLeaderboard(@Query() paginationDto: PaginationDto) {
    return await this.userService.getLeaderboard(paginationDto);
  }

  @Get(':id')
  @Roles('admin')
  async findOne(@Param('id') id: string) {
    return await this.userService.findOne(+id);
  }

  @Post()
  @Roles('admin')
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @Patch(':id')
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.userService.update(+id, updateUserDto);
  }

  @Patch(':id/access')
  @Roles('admin')
  async toggleAccess(
    @Param('id') id: string,
    @Body() body: { is_access_allowed: boolean },
  ) {
    return await this.userService.toggleAccess(+id, body.is_access_allowed);
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string) {
    return await this.userService.delete(+id);
  }
}
