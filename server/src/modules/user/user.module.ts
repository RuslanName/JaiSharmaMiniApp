import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Password } from './entities/password.entity';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { PasswordController } from './controllers/password.controller';
import { PasswordService } from './services/password.service';
import { Setting } from '../setting/setting.entity';
import { EnergyService } from './services/energy.service';
import { SettingModule } from '../setting/setting.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Password, Setting]), SettingModule],
  controllers: [UserController, PasswordController],
  providers: [UserService, PasswordService, EnergyService],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}
