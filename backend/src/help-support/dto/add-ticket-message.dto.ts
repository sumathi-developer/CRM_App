import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
} from 'class-validator';

export class AddTicketMessageDto {
  @ApiProperty({ description: 'Message or reply body' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Array of attachments',
  })
  @IsOptional()
  @IsArray()
  attachments?: Array<{
    name: string;
    url: string;
    size?: number;
    mimeType?: string;
  }>;

  @ApiPropertyOptional({
    description: 'If true, this message is visible ONLY to support/admin staff (Normal users will not see it)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isInternalNote?: boolean;
}
