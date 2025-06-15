import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TaskStatus } from './enums/task-status.enum';
import { TaskPriority } from './enums/task-priority.enum';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { TaskFilterDto } from './dto/task-filter.dto';
import { User } from '@modules/users/entities/user.entity';
import { GetUser } from '@common/decorators/get-user.decorator';
import { TaskResponseDto } from './dto/task-response.dto';
import { toTaskResponseDto } from './utils/task.mapper';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RateLimitGuard)
@RateLimit({ limit: 100, windowMs: 60000 })
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

@Post()
@ApiOperation({ summary: 'Create a new task' })
@ApiResponse({ status: 201, type: TaskResponseDto })
async create(
  @Body() createTaskDto: CreateTaskDto,
  @GetUser() user: User,
): Promise<{ success: true; message: string; data: TaskResponseDto }> {
  const task = await this.tasksService.create(createTaskDto, user);
  return {
    success: true,
    message: 'Task created successfully',
    data: toTaskResponseDto(task),
  };
}

  @Get()
  @ApiOperation({ summary: 'Get all tasks with optional filters' })
  @ApiQuery({ name: 'status', enum: TaskStatus, required: false })
  @ApiQuery({ name: 'priority', enum: TaskPriority, required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'dueDateBefore', required: false })
  @ApiQuery({ name: 'dueDateAfter', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query() filterDto: TaskFilterDto,
    @GetUser() user: User,
  ) {
    const result = await this.tasksService.findAll(filterDto, user);
    return {
      success: true,
      message: 'Tasks fetched successfully',
      ...result,
    };
  }

 @Get('stats')
@ApiOperation({ summary: 'Get task statistics' })
@UseGuards(JwtAuthGuard)
async getStats(@GetUser() user: User) {
  const stats = await this.tasksService.getStats(user.id);
  return {
    success: true,
    message: 'Task statistics fetched',
    data: stats,
  };
}


@Get(':id')
@ApiOperation({ summary: 'Find a task by ID' })
@ApiResponse({ status: 200, type: TaskResponseDto })
async findOne(@Param('id') id: string, @GetUser() user: User) {
  const task = await this.tasksService.findOne(id, user);
  return {
    success: true,
    message: 'Task fetched successfully',
    data: toTaskResponseDto(task),
  };
}


  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @GetUser() user: User,
  ) {
    const updated = await this.tasksService.update(id, updateTaskDto, user);
    return {
      success: true,
      message: 'Task updated successfully',
      data: toTaskResponseDto(updated),
    };
  }

@Patch(':id/status')
@ApiOperation({ summary: 'Update task status' })
@ApiResponse({ status: 200, type: TaskResponseDto })
async updateStatus(
  @Param('id') id: string,
  @Body('status') status: TaskStatus,
  @GetUser() user: User,
) {
  const task = await this.tasksService.updateStatus(id, status, user);
  return {
    success: true,
    message: 'Task status updated successfully',
    data: toTaskResponseDto(task),
  };
}

@Delete(':id')
@ApiOperation({ summary: 'Delete a task' })
async remove(@Param('id') id: string, @GetUser() user: User) {
  await this.tasksService.remove(id, user);
  return {
    success: true,
    message: 'Task deleted successfully',
  };
}

@Post('batch')
@ApiOperation({ summary: 'Batch process multiple tasks (complete/delete)' })
@UseGuards(JwtAuthGuard)
async batchProcess(
  @Body() operations: { tasks: string[]; action: 'complete' | 'delete' },
  @GetUser() user: User
) {
  const { tasks: taskIds, action } = operations;

  if (!['complete', 'delete'].includes(action)) {
    throw new HttpException(`Unsupported action: ${action}`, HttpStatus.BAD_REQUEST);
  }

  const results = await this.tasksService.batchProcess(taskIds, action, user.id);

 return {
  success: true,
  message: 'Batch operation completed',
  ...results,
};

}

}
