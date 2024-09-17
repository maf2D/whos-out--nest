import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class UserDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  position: string;

  @IsOptional()
  @IsBoolean()
  onVacation: boolean;

  @IsOptional()
  @IsBoolean()
  onHolidays: boolean;

  @IsOptional()
  @IsDateString()
  awayTill: Date;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be either admin or user' })
  role: UserRole = UserRole.USER;
}
