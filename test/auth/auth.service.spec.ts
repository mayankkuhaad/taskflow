import { Test, TestingModule } from '@nestjs/testing';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from '@modules/auth/auth.service';
import { UsersService } from '@modules/users/users.service';

const mockUsersService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('test-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should validate password and return JWT', async () => {
    const user = { id: '1', email: 'test@example.com', password: await bcrypt.hash('123456', 10) };
    mockUsersService.findByEmail.mockResolvedValue(user);

    const result = await service.login({ email: user.email, password: '123456' });
    expect(result.token).toBe('test-token');
expect(result.user.email).toBe(user.email);
  });

  it('should create new user on register', async () => {
    const dto = { email: 'new@example.com', password: '123456', name: 'New User' };
    mockUsersService.create.mockResolvedValue({ id: '2', ...dto });

    const result = await service.register(dto);
expect(result).toHaveProperty('token');
expect(result.user.email).toBe(dto.email);

  });
});