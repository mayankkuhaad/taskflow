import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
  ForbiddenException,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorator/roles.decorator';
import { Request as ExpressRequest } from 'express';

@ApiTags('users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return new UserResponseDto(user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map((user) => new UserResponseDto(user));
  }

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Get(':id')
async findOne(@Param('id') id: string, @Request() req: ExpressRequest) {
  const requestingUser = req.user as { id: string; role: string };

  if (requestingUser.role !== 'admin' && requestingUser.id !== id) {
    throw new ForbiddenException('You are not allowed to access this resource.');
  }

  const user = await this.usersService.findOne(id);
  return new UserResponseDto(user);
}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const updatedUser = await this.usersService.update(id, updateUserDto);
    return new UserResponseDto(updatedUser);
  }

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
@Delete(':id')
async remove(@Param('id') id: string, @Request() req: ExpressRequest) {
  const user = req.user as { id: string; role: string }; 

  if (user.id === id) {
    throw new BadRequestException("You cannot delete your own account.");
  }

  await this.usersService.remove(id);
  return { message: `User with ID ${id} deleted successfully.` };
}
}
