import { Test, TestingModule } from '@nestjs/testing';
import { OverdueTasksService } from './overdue-tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from '../../modules/tasks/entities/task.entity';
import { CacheService } from '../../common/services/cache.service';
import { Queue } from 'bullmq';
import { TaskStatus } from '../../modules/tasks/enums/task-status.enum';

const mockTasks = [
  { id: '1', dueDate: new Date(Date.now() - 1000), status: TaskStatus.PENDING },
];

describe('OverdueTasksService', () => {
  let service: OverdueTasksService;
  let taskQueue: Queue;
  let cacheService: CacheService;

  const mockRepo = {
    find: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OverdueTasksService,
        { provide: getRepositoryToken(Task), useValue: mockRepo },
        { provide: CacheService, useValue: mockCacheService },
        { provide: 'BullMQ:task-processing', useValue: mockQueue },
      ],
    }).compile();

    service = module.get<OverdueTasksService>(OverdueTasksService);
    taskQueue = module.get('BullMQ:task-processing');
    cacheService = module.get(CacheService);
  });

  it('should use cached overdue tasks if available', async () => {
    mockCacheService.get.mockResolvedValue(mockTasks);

    await service.checkOverdueTasks();

    expect(cacheService.get).toHaveBeenCalled();
    expect(taskQueue.add).toHaveBeenCalled();
  });

  it('should query DB if no cache and enqueue', async () => {
    mockCacheService.get.mockResolvedValue(null);
    mockRepo.find.mockResolvedValue(mockTasks);

    await service.checkOverdueTasks();

    expect(mockRepo.find).toHaveBeenCalled();
    expect(cacheService.set).toHaveBeenCalled();
    expect(taskQueue.add).toHaveBeenCalled();
  });
});