import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AcceptWorkspaceInviteDto {
  @ApiProperty({ example: '8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c', description: 'Invitation token' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
