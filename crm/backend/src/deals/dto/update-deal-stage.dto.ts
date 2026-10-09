import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateDealStageDto {
  @ApiProperty({ example: 'stage-uuid-here', description: 'Pipeline Stage UUID' })
  @IsString()
  @IsNotEmpty()
  stageId: string;
}
