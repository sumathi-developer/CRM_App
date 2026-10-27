import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TicketCategory } from '../enums/ticket-category.enum';
import { TicketPriority } from '../enums/ticket-priority.enum';

export class CreateSupportTicketDto {
  @ApiProperty({ description: 'Summary of the issue or question', example: 'Cannot sync Google Calendar' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @ApiProperty({ description: 'Detailed problem description with reproduction steps or context' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'Ticket classification category',
    enum: TicketCategory,
    default: TicketCategory.TECHNICAL,
  })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @ApiPropertyOptional({
    description: 'Urgency level',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({
    description: 'Array of attachments (file metadata, screenshots, or URLs)',
    example: [{ name: 'screenshot.png', url: 'https://...', size: 102400, mimeType: 'image/png' }],
  })
  @IsOptional()
  @IsArray()
  attachments?: Array<{
    name: string;
    url: string;
    size?: number;
    mimeType?: string;
  }>;

  @ApiPropertyOptional({ description: 'Workspace UUID' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}
