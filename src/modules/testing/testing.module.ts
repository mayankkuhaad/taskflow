import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { TestingController } from './testing.controller';
import { Task } from '@modules/tasks/entities/task.entity';
import { OverdueTasksService } from '@queues/scheduled-tasks/overdue-tasks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    BullModule.registerQueue({
      name: 'task-processing',
    }),
  ],
  controllers: [TestingController],
  providers: [OverdueTasksService],
})
export class TestingModule {}
