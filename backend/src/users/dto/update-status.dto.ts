import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({ example: 'INACTIVE', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] })
  @IsNotEmpty()
  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  status: string;
}
