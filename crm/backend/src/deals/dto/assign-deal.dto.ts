import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignDealDto {
  @ApiProperty({ example: 'user-uuid-here', description: 'Owner User UUID' })
  @IsString()
  @IsNotEmpty()
  ownerId: string;
}
