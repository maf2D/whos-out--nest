import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { isBoolean } from '../../helpers/transform-validators.helper';

export class UserQueryDto {
  @IsOptional()
  @IsString()
  searchStr: string;

  @IsOptional()
  @IsBoolean()
  @Transform(isBoolean)
  onHolidays: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(isBoolean)
  onVacation: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  skip: number = 0;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit: number = 20;
}
