import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { RateLimit } from '@common/decorators/rate-limit.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @RateLimit({ limit: 5, windowMs: 60_000 }) 
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

@ApiResponse({ status: 201, description: 'User registered successfully' })
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
} 