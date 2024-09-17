import { Request } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProtectGuard } from '../guards/protect.guard';
import { RestrictToGuard } from '../guards/restrict-to.guard';
import { UsersService } from './users.service';
import { UserDto } from './dtos/user.dto';
import { UserQueryDto } from './dtos/user-query.dto';

@Controller('users')
@UseGuards(ProtectGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Query() userQueryDto: UserQueryDto) {
    return this.usersService.findAll(userQueryDto);
  }

  @Get('me')
  async findMe(@Req() req: Request) {
    return this.findOne(req.user._id.toString());
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);

    return { user };
  }

  @Post()
  @UseGuards(new RestrictToGuard(['admin']))
  async createOne(@Body() userDto: UserDto) {
    return this.usersService.createOne(userDto);
  }

  @Delete(':id')
  @UseGuards(new RestrictToGuard(['admin']))
  async deleteOne(@Param('id') id: string) {
    return this.usersService.deleteOne(id);
  }
}
