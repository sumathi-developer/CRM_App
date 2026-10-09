import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignTaskDto {
  @ApiProperty({ example: 'user-uuid-here', description: 'User ID to assign the task to' })
  @IsString()
  @IsNotEmpty()
  assignedToId: string;
}
