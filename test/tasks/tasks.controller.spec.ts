import { CreateTaskDto } from '@modules/tasks/dto/create-task.dto';
import { Task } from '@modules/tasks/entities/task.entity';
import { TaskPriority } from '@modules/tasks/enums/task-priority.enum';
import { TaskStatus } from '@modules/tasks/enums/task-status.enum';
import { TasksController } from '@modules/tasks/tasks.controller';
import { TasksService } from '@modules/tasks/tasks.service';
import { User } from '@modules/users/entities/user.entity';
import { Test, TestingModule } from '@nestjs/testing';


describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  const mockUser = { id: 'user-123' } as User;

  const mockTask: Task = {
    id: 'task-1',
    title: 'Test task',
    description: 'Testing...',
    status: TaskStatus.PENDING,
 priority: TaskPriority.MEDIUM, // ✅ use enum
  dueDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
      userId: mockUser.id,
  };

  const mockTasksService = {
    create: jest.fn().mockResolvedValue(mockTask),
    findAll: jest.fn().mockResolvedValue({ data: [mockTask], total: 1 }),
    findOne: jest.fn().mockResolvedValue(mockTask),
    update: jest.fn().mockResolvedValue(mockTask),
    remove: jest.fn().mockResolvedValue(undefined),
    updateStatus: jest.fn().mockResolvedValue(mockTask),
    getStats: jest.fn().mockResolvedValue({ total: 1, completed: 0 }),
    batchProcess: jest.fn().mockResolvedValue({ completed: 1, deleted: 0 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: mockTasksService }],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  it('should create a task', async () => {
    const dto: CreateTaskDto = { title: 'Test task' };
    const result = await controller.create(dto, mockUser);
    expect(service.create).toHaveBeenCalledWith(dto, mockUser);
    expect(result.data.id).toBe(mockTask.id);
  });

  it('should get task stats', async () => {
    const result = await controller.getStats(mockUser);
    expect(service.getStats).toHaveBeenCalledWith(mockUser.id);
    expect(result.data.total).toBe(1);
  });
});
