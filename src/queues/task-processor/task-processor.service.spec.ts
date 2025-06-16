import { Test, TestingModule } from '@nestjs/testing';
import { TaskProcessorService } from './task-processor.service';
import { TasksService } from '../../modules/tasks/tasks.service';
import { TaskStatus } from '../../modules/tasks/enums/task-status.enum';

const mockTasksService = {
  updateStatus: jest.fn(),
  findTasksByIds: jest.fn(),
  notifyAssignee: jest.fn(),
};

describe('TaskProcessorService', () => {
  let service: TaskProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskProcessorService,
        { provide: TasksService, useValue: mockTasksService },
      ],
    }).compile();

    service = module.get<TaskProcessorService>(TaskProcessorService);
  });

  it('should process status update job', async () => {
    const job = {
      name: 'task-status-update',
      data: { taskId: '123', status: TaskStatus.COMPLETED },
      id: 'job1',
      attemptsMade: 0,
    };
    mockTasksService.updateStatus.mockResolvedValue({ id: '123', status: TaskStatus.COMPLETED });

    const result = await service.process(job as any);
    expect(result.success).toBe(true);
    expect(mockTasksService.updateStatus).toHaveBeenCalled();
  });

  it('should process overdue tasks job and notify users', async () => {
    const job = {
      name: 'overdue-tasks-notification',
      data: { taskIds: ['1'] },
      id: 'job2',
      attemptsMade: 0,
    };
    mockTasksService.findTasksByIds.mockResolvedValue([{ id: '1' }]);

    const result = await service.process(job as any);
    expect(result.success).toBe(true);
    expect(mockTasksService.notifyAssignee).toHaveBeenCalledWith({ id: '1' });
  });
});
