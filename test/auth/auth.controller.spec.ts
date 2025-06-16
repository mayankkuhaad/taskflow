// auth.controller.spec.ts
import { AuthController } from '@modules/auth/auth.controller';
import { AuthService } from '@modules/auth/auth.service';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { Test, TestingModule } from '@nestjs/testing';


const mockAuthService = {
  login: jest.fn(),
  register: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should call login with correct data', async () => {
    const dto: LoginDto = { email: 'test@example.com', password: '123456' };
    await controller.login(dto);
    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
  });

  it('should call register with correct data', async () => {
    const dto: RegisterDto = { email: 'test@example.com', password: '123456', name: 'Test' };
    await controller.register(dto);
    expect(mockAuthService.register).toHaveBeenCalledWith(dto);
  });
});