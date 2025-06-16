import { Body, Controller, Post } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { OverdueTasksService } from '@queues/scheduled-tasks/overdue-tasks.service';

@Controller('test-jobs')
export class TestingController {
  constructor(
    private readonly overdueTasksService: OverdueTasksService,
    @InjectQueue('task-processing') private readonly taskQueue: Queue
  ) {}

  // Existing endpoint
  @Post('trigger-overdue-check')
  async triggerOverdueTasksCheck() {
    return this.overdueTasksService.checkOverdueTasks();
  }

  // New endpoint to enqueue mock/manual job
  @Post('enqueue')
  async enqueueJob(
    @Body() body: { name: string; data: any; opts?: any } // add optional opts for delay/retries
  ) {
    const { name, data, opts } = body;
    const job = await this.taskQueue.add(name, data, opts);
    return {
      message: `Job '${name}' added to queue`,
      jobId: job.id,
      data: job.data,
    };
  }
}
