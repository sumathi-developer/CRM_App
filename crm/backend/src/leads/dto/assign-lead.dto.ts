import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignLeadDto {
  @ApiProperty({ example: 'user-uuid-here', description: 'User ID to assign the lead to' })
  @IsString()
  @IsNotEmpty()
  ownerId: string;
}
