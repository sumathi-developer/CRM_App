import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class SwitchWorkspaceDto {
  @ApiProperty({ example: 'a0b1c2d3-e4f5-4a5b-8c9d-0e1f2a3b4c5d', description: 'Workspace UUID to switch to' })
  @IsUUID()
  @IsNotEmpty()
  workspaceId: string;
}
