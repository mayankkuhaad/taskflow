import { CreateUserDto } from '@modules/users/dto/create-user.dto';
import { User } from '@modules/users/entities/user.entity';
import { UsersController } from '@modules/users/users.controller';
import { UsersService } from '@modules/users/users.service';
import { Test, TestingModule } from '@nestjs/testing';



describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    password: 'hashed',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockUsersService = {
    create: jest.fn().mockResolvedValue(mockUser),
    findAll: jest.fn().mockResolvedValue([mockUser]),
    findOne: jest.fn().mockResolvedValue(mockUser),
    update: jest.fn().mockResolvedValue(mockUser),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should create a user', async () => {
    const dto: CreateUserDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };
    const result = await controller.create(dto);
    expect(result.email).toBe(dto.email);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should get all users', async () => {
    const result = await controller.findAll();
    expect(result.length).toBe(1);
    expect(result[0].email).toBe('test@example.com');
  });

  it('should get user by id', async () => {
    const result = await controller.findOne('1', { user: { id: '1', role: 'admin' } } as any);
    expect(result.id).toBe('1');
  });

  it('should update a user', async () => {
    const result = await controller.update('1', { name: 'Updated' });
    expect(result.name).toBe('Test User');
  });

  it('should delete a user', async () => {
    const result = await controller.remove('2', { user: { id: '1', role: 'admin' } } as any);
    expect(result.message).toContain('deleted successfully');
  });
});
