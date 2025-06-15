import { ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TaskStatus } from './enums/task-status.enum';
import { TaskFilterDto } from './dto/task-filter.dto';
import { User } from '@modules/users/entities/user.entity';
import { TaskPriority } from './enums/task-priority.enum';
import { In } from 'typeorm';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectQueue('task-processing')
    private taskQueue: Queue,
  ) {}

async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
  const { title, dueDate } = createTaskDto;

  const existingTask = await this.tasksRepository.findOne({
    where: {
      title,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      userId: user.id,
    },
  });

  if (existingTask) {
    throw new HttpException(
      `Task with the same title and due date already exists.`,
      HttpStatus.CONFLICT,
    );
  }

  // Create new task instance
  const task = this.tasksRepository.create({
    ...createTaskDto,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    userId: user.id,
  });

  const savedTask = await this.tasksRepository.save(task);

  await this.taskQueue.add(
    'process_task',
    {
      taskId: savedTask.id,
      userId: savedTask.userId,
    },
    {
      jobId: `task-${savedTask.id}`,
      removeOnComplete: true,
      removeOnFail: {
        count: 3,
      },
    },
  );

  return savedTask;
}




async findAll(
  filterDto: TaskFilterDto,
  currentUser: User, // Injected from request.user in controller
): Promise<{ data: Task[]; meta: { total: number; page: number; limit: number } }> {
  const {
    status,
    priority,
    search,
    dueDateBefore,
    dueDateAfter,
    page = 1,
    limit = 10,
    userId,
  } = filterDto;

  const queryBuilder = this.tasksRepository.createQueryBuilder('task');

  // Restrict to current user's tasks unless admin access logic is added
  queryBuilder.where('task.userId = :userId', { userId: currentUser.id });

  // Filtering
  if (status) {
    queryBuilder.andWhere('task.status = :status', { status });
  }

  if (priority) {
    queryBuilder.andWhere('task.priority = :priority', { priority });
  }

  if (search) {
    queryBuilder.andWhere('(task.title ILIKE :search OR task.description ILIKE :search)', {
      search: `%${search}%`,
    });
  }

  if (dueDateBefore) {
    queryBuilder.andWhere('task.dueDate <= :dueDateBefore', { dueDateBefore });
  }

  if (dueDateAfter) {
    queryBuilder.andWhere('task.dueDate >= :dueDateAfter', { dueDateAfter });
  }

  // Pagination
  const skip = (page - 1) * limit;
  queryBuilder.skip(skip).take(limit);

  // Execute queries
  const [data, total] = await queryBuilder.getManyAndCount();

  return {
    data,
    meta: {
      total,
      page,
      limit,
    },
  };
}

async findOne(id: string, user: User): Promise<Task> {
  const task = await this.tasksRepository.findOne({
    where: { id },
    relations: ['user'],
  });

  if (!task) {
    throw new NotFoundException(`Task with ID ${id} not found`);
  }

  // Ownership check
if (task.userId !== user.id && user.role !== 'admin') {
  throw new ForbiddenException('Access denied');
}


  return task;
}



async update(id: string, updateTaskDto: UpdateTaskDto, user: User): Promise<Task> {
  const task = await this.tasksRepository.findOne({ where: { id } });

  if (!task) {
    throw new NotFoundException(`Task with id ${id} not found`);
  }

  if (task.userId !== user.id) {
    throw new ForbiddenException('You are not allowed to update this task');
  }

  Object.assign(task, updateTaskDto); // Merge new fields
  return await this.tasksRepository.save(task);
}


async remove(id: string, user: User): Promise<void> {
  const task = await this.tasksRepository.findOne({ where: { id } });

  if (!task) {
    throw new NotFoundException(`Task with id ${id} not found`);
  }

  if (task.userId !== user.id) {
    throw new ForbiddenException('You are not allowed to delete this task');
  }

  await this.tasksRepository.remove(task);
}


async findByStatus(status: TaskStatus): Promise<Task[]> {
  return this.tasksRepository.find({
    where: { status },
    relations: ['user'], 
    order: { createdAt: 'DESC' },
  });
}


async updateStatus(id: string, status: TaskStatus, user: User): Promise<Task> {
  const task = await this.tasksRepository.findOne({ where: { id } });

  if (!task) {
    throw new NotFoundException(`Task with ID ${id} not found`);
  }

  // Ownership check
 if (task.userId !== user.id && user.role !== 'admin') {
  throw new ForbiddenException('You are not allowed to update this task status');
}


  task.status = status;
  return this.tasksRepository.save(task);
}



async getStats(userId: string) {
  const qb = this.tasksRepository.createQueryBuilder('task')
    .select('COUNT(*)', 'total')
    .addSelect(`COUNT(CASE WHEN status = :completed THEN 1 END)`, 'completed')
    .addSelect(`COUNT(CASE WHEN status = :inProgress THEN 1 END)`, 'inProgress')
    .addSelect(`COUNT(CASE WHEN status = :pending THEN 1 END)`, 'pending')
    .addSelect(`COUNT(CASE WHEN priority = :high THEN 1 END)`, 'highPriority')
    .where('task.userId = :userId', { userId })
    .setParameters({
      completed: TaskStatus.COMPLETED,
      inProgress: TaskStatus.IN_PROGRESS,
      pending: TaskStatus.PENDING,
      high: TaskPriority.HIGH,
    });

  const result = await qb.getRawOne();

  return {
    total: parseInt(result.total, 10),
    completed: parseInt(result.completed, 10),
    inProgress: parseInt(result.inProgress, 10),
    pending: parseInt(result.pending, 10),
    highPriority: parseInt(result.highPriority, 10),
  };
}



async batchProcess(
  taskIds: string[],
  action: 'complete' | 'delete',
  userId: string
): Promise<{
  summary: { completed: number; failed: number };
  results: { taskId: string; success: boolean; message?: string }[];
}> {
  const tasks = await this.tasksRepository.find({
    where: { id: In(taskIds), userId },
  });

  const foundIds = tasks.map(t => t.id);
  const responses: { taskId: string; success: boolean; message?: string }[] = [];
  let completed = 0, failed = 0;

  await this.tasksRepository.manager.transaction(async transactionalEntityManager => {
    if (action === 'complete') {
      await transactionalEntityManager
        .createQueryBuilder()
        .update(Task)
        .set({ status: TaskStatus.COMPLETED })
        .whereInIds(foundIds)
        .execute();
    } else if (action === 'delete') {
      await transactionalEntityManager
        .createQueryBuilder()
        .delete()
        .from(Task)
        .whereInIds(foundIds)
        .execute();
    }

    for (const id of taskIds) {
      const success = foundIds.includes(id);
      responses.push({
        taskId: id,
        success,
        message: success
          ? action === 'complete' ? 'Marked as complete' : 'Deleted'
          : 'Not found or unauthorized',
      });

      success ? completed++ : failed++;
    }
  });

  return {
    summary: { completed, failed },
    results: responses,
  };
}



}
