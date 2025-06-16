import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@modules/users/entities/user.entity';
import { UsersService } from '@modules/users/users.service';


const mockUserRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should hash password when creating user', async () => {
    const dto = { email: 'test@example.com', password: '123456', name: 'Test' };
    const hashed = 'hashedPassword';

    (jest.spyOn(bcrypt, 'hash') as jest.SpyInstance).mockResolvedValue('hashedPassword');
    userRepo.create = jest.fn().mockReturnValue({ ...dto, password: hashed });
    userRepo.save = jest.fn().mockResolvedValue({ id: '1', ...dto, password: hashed });

    const result = await service.create(dto);

    expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
    expect(result.password).toBe(hashed);
  });
});
