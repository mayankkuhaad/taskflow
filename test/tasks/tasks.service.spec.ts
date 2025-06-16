import { CreateTaskDto } from '@modules/tasks/dto/create-task.dto';
import { Task } from '@modules/tasks/entities/task.entity';
import { TaskPriority } from '@modules/tasks/enums/task-priority.enum';
import { TaskStatus } from '@modules/tasks/enums/task-status.enum';
import { TasksService } from '@modules/tasks/tasks.service';
import { User } from '@modules/users/entities/user.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

const mockTaskRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('TasksService', () => {
  let service: TasksService;
  let taskRepo: Repository<Task>;
  const user: User = { id: 'user-id' } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useFactory: mockTaskRepository,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepo = module.get<Repository<Task>>(getRepositoryToken(Task));
  });

  it('should create a task', async () => {
    const dto: CreateTaskDto = {
      title: 'Test Task',
      description: 'Test Description',
      dueDate: new Date().toISOString(), // ✅ convert Date to string
      priority: TaskPriority.MEDIUM,
    };

    const mockTask = {
      ...dto,
      id: '1',
      user,
      status: TaskStatus.PENDING,
    };

    jest.spyOn(taskRepo, 'create').mockReturnValue(mockTask as any);
    jest.spyOn(taskRepo, 'save').mockResolvedValue(mockTask as any);

    const result = await service.create(dto, user);

    expect(taskRepo.create).toHaveBeenCalledWith({ ...dto, user });
    expect(taskRepo.save).toHaveBeenCalledWith(mockTask);
    expect(result).toEqual(mockTask);
  });
});
