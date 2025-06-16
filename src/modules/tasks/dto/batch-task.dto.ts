import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsUUID } from 'class-validator';
import { TaskStatus } from '../enums/task-status.enum';

export class BatchTaskDto {
  @ApiProperty({ example: ['uuid-1', 'uuid-2'], isArray: true })
  @IsArray()
  @IsUUID('all', { each: true })
  tasks: string[];

  @ApiProperty({ example: 'complete', enum: ['complete', 'delete'] })
  @IsEnum(['complete', 'delete'])
  action: 'complete' | 'delete';
}
