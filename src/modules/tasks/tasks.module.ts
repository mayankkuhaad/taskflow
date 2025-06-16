import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { SharedModule } from '@common/shared.module';
import { TaskProcessorService } from '@queues/task-processor/task-processor.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    BullModule.registerQueue({
      name: 'task-processing',
    }),
    SharedModule
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskProcessorService],
  exports: [TasksService],
})
export class TasksModule {} 