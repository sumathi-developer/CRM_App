import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateDealStatusDto {
  @ApiProperty({ example: 'WON', enum: ['OPEN', 'WON', 'LOST'] })
  @IsNotEmpty()
  @IsIn(['OPEN', 'WON', 'LOST'])
  status: string;
}
