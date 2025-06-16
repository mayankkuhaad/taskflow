import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TasksService } from '../../modules/tasks/tasks.service';
import { TaskStatus } from '@modules/tasks/enums/task-status.enum';
import { User } from '@modules/users/entities/user.entity';

const SYSTEM_USER: User = {
  id: 'system',
  email: 'system@tasks.com',
  role: 'admin',
  name: 'System User',
  password: '',
  tasks: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};
interface StatusUpdateJobPayload {
  taskId: string;
  status: TaskStatus;
}
@Injectable()
@Processor('task-processing')
export class TaskProcessorService extends WorkerHost {
  private readonly logger = new Logger(TaskProcessorService.name);

  constructor(private readonly tasksService: TasksService) {
    super();
  }

async process(job: Job): Promise<any> {
  const { id, name, data, attemptsMade } = job;
  const jobId = id ?? 'unknown-job-id'; // Handle undefined safely

  this.logger.debug(`➡️ [Job ID: ${jobId}] Attempt #${attemptsMade + 1} → Processing job "${name}"`);

  try {
    switch (name) {
      case 'task-status-update':
        return await this.handleStatusUpdate(data, jobId);
      case 'overdue-tasks-notification':
        return await this.handleOverdueTasks(data, jobId);
      default:
        this.logger.warn(`❓ Unknown job type: ${name}`);
        return { success: false, error: `Unknown job type: ${name}` };
    }
  } catch (error) {
    this.logger.error(`❌ [Job ID: ${jobId}] Error processing job: ${error instanceof Error ? error.message : error}`);
    throw error;
  }
}

private async handleStatusUpdate(rawData: any, jobId: string) {
  const data = rawData as StatusUpdateJobPayload;

  if (!data.taskId || !data.status) {
    this.logger.warn(`⚠️ [Job ID: ${jobId}] Missing taskId or status`);
    return { success: false, error: 'Invalid data' };
  }

  if (!Object.values(TaskStatus).includes(data.status)) {
    this.logger.warn(`⚠️ [Job ID: ${jobId}] Invalid status: ${data.status}`);
    return { success: false, error: `Invalid status: ${data.status}` };
  }

  const task = await this.tasksService.updateStatus(data.taskId, data.status, SYSTEM_USER);

  return {
    success: true,
    taskId: task.id,
    newStatus: task.status,
  };
}



private async handleOverdueTasks(data: any, jobId: string) {
  const { taskIds } = data;

  if (!taskIds || !Array.isArray(taskIds) || !taskIds.length) {
    this.logger.warn(`⚠️ [Job ID: ${jobId}] Missing or invalid taskIds`);
    return { success: false, error: 'Invalid taskIds' };
  }

  const tasks = await this.tasksService.findTasksByIds(taskIds); // Add this method

  if (!tasks.length) {
    this.logger.log(`✅ [Job ID: ${jobId}] No tasks found with provided IDs.`);
    return { success: true, message: 'No tasks to notify' };
  }

  const results = [];

  for (const task of tasks) {
    try {
      await this.tasksService.notifyAssignee(task);
      results.push({ taskId: task.id, notified: true });
    } catch (err) {
      this.logger.warn(`⚠️ Failed to notify for Task ${task.id}: ${err instanceof Error ? err.message : err}`);
      results.push({ taskId: task.id, notified: false });
    }
  }

  return {
    success: true,
    processed: results.length,
    results,
  };
}
}
