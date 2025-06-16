import { Task } from '../entities/task.entity';
import { TaskResponseDto } from '../dto/task-response.dto';

export const toTaskResponseDto = (task: Task): TaskResponseDto => ({
  id: task.id,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  dueDate: task.dueDate,
  userId: task.userId,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});
