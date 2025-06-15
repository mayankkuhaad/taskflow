import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Task } from '../../modules/tasks/entities/task.entity';
import { TaskStatus } from '../../modules/tasks/enums/task-status.enum';

@Injectable()
export class OverdueTasksService {
  private readonly logger = new Logger(OverdueTasksService.name);

  constructor(
    @InjectQueue('task-processing')
    private taskQueue: Queue,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkOverdueTasks() {
    this.logger.debug('⏰ Checking for overdue tasks...');

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

    this.logger.log(`⚠️ Found ${overdueTasks.length} overdue tasks.`);

    try {
      // Push a single batch job to process all
      await this.taskQueue.add('overdue-tasks-notification', {
        taskIds: overdueTasks.map((task) => task.id),
      }, {
        attempts: 3, // Retry failed jobs up to 3 times
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      });

      this.logger.log('📩 Enqueued overdue task notification job');
    } catch (err) {
      this.logger.error(`❌ Failed to enqueue overdue tasks: ${err instanceof Error ? err.message : err}`);
    }

    this.logger.debug('✅ Overdue tasks check completed');
  }
}
