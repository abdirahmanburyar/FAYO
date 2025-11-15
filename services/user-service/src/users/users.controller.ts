import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.usersService.findAll();
  }

  @Get('doctors/:specialty')
  findDoctorsBySpecialty(@Param('specialty') specialty: string) {
    return this.usersService.findDoctorsBySpecialty(specialty);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Get('profile/me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.usersService.getUserProfile(req.user.id);
  }

  @Patch('profile/me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    try {
      console.log('🔍 [CONTROLLER] Profile update request received');
      console.log('   👤 User ID from JWT:', req.user.id);
      console.log('   📦 Request body:', updateProfileDto);
      
      const result = await this.usersService.updateUserProfile(req.user.id, updateProfileDto);
      
      console.log('✅ [CONTROLLER] Profile update successful');
      return result;
    } catch (error) {
      console.error('❌ [CONTROLLER] Profile update error:', error);
      throw error;
    }
  }
}
