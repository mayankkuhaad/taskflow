import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Task } from '../../modules/tasks/entities/task.entity';
import { TaskStatus } from '../../modules/tasks/enums/task-status.enum';
import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class OverdueTasksService {
  private readonly logger = new Logger(OverdueTasksService.name);
  private readonly cacheKey = 'overdue-tasks';

  constructor(
    @InjectQueue('task-processing')
    private taskQueue: Queue,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private readonly cacheService: CacheService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkOverdueTasks() {
    this.logger.debug('⏰ Checking for overdue tasks...');

    // Step 1: Try cache
    const cached = await this.cacheService.get<Task[]>(this.cacheKey);
    if (cached?.length) {
      this.logger.log(`⚠️ Found ${cached.length} overdue tasks (from cache).`);
      await this.enqueueNotificationJob(cached);
      return;
    }

    // Step 2: Fallback to DB
    const now = new Date();
    const overdueTasks = await this.tasksRepository.find({
      where: {
        dueDate: LessThan(now),
        status: TaskStatus.PENDING,
      },
    });

    if (!overdueTasks.length) {
      this.logger.log('✅ No overdue tasks found.');
      return;
    }

    this.logger.log(`⚠️ Found ${overdueTasks.length} overdue tasks (from DB).`);

    // Step 3: Save to cache
    await this.cacheService.set(this.cacheKey, overdueTasks, 600); // cache for 10 minutes

    await this.enqueueNotificationJob(overdueTasks);
  }

  private async enqueueNotificationJob(tasks: Task[]) {
    try {
      await this.taskQueue.add(
        'overdue-tasks-notification',
        { taskIds: tasks.map((task) => task.id) },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
          removeOnFail: false,
        }
      );
      this.logger.log('📩 Enqueued overdue task notification job');
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.logger.error(`❌ Failed to enqueue overdue tasks: ${error}`);
    }
  }
}
