import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsIn, IsUUID } from 'class-validator';

export class AddWorkspaceMemberDto {
  @ApiProperty({ example: 'b0e008ff-7ad7-4e6e-a226-f7a3f5a11111', description: 'User UUID to add' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    example: 'MEMBER',
    enum: ['ADMIN', 'MEMBER', 'VIEWER'],
    default: 'MEMBER',
    description: 'Workspace member role',
  })
  @IsOptional()
  @IsIn(['ADMIN', 'MEMBER', 'VIEWER'])
  role?: string = 'MEMBER';
}
