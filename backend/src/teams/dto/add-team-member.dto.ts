import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsIn, IsUUID } from 'class-validator';

export class AddTeamMemberDto {
  @ApiProperty({ example: 'user-uuid-1234', description: 'User UUID to add to the team' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    example: 'MEMBER',
    enum: ['LEADER', 'MEMBER'],
    default: 'MEMBER',
    description: 'Member role in the team',
  })
  @IsOptional()
  @IsIn(['LEADER', 'MEMBER'])
  role?: string = 'MEMBER';
}
