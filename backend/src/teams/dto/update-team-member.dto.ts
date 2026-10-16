import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsIn } from 'class-validator';

export class UpdateTeamMemberDto {
  @ApiProperty({
    example: 'LEADER',
    enum: ['LEADER', 'MEMBER'],
    description: 'Updated role for team member',
  })
  @IsNotEmpty()
  @IsIn(['LEADER', 'MEMBER'])
  role: 'LEADER' | 'MEMBER';
}
