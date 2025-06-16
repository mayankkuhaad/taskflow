import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RateLimit } from '@common/decorators/rate-limit.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @RateLimit({ limit: 5, windowMs: 60_000 }) 
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({ status: 200, description: 'Login successful. Returns access token.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or user already exists' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
