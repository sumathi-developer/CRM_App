import { IsString, IsNotEmpty, IsOptional, IsUUID, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Internal comment content. Can contain @username or @userEmail mentions.',
    example: 'Hey @alex, please review this thread before we send the formal contract.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Associated EmailMessage UUID' })
  @IsOptional()
  @IsUUID()
  emailId?: string;

  @ApiPropertyOptional({ description: 'Associated conversation thread UUID' })
  @IsOptional()
  @IsString()
  threadId?: string;

  @ApiPropertyOptional({ description: 'Associated Contact UUID' })
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional({ description: 'Associated Lead UUID' })
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional({ description: 'Associated Deal UUID' })
  @IsOptional()
  @IsUUID()
  dealId?: string;

  @ApiPropertyOptional({ description: 'Associated Workspace UUID' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @ApiPropertyOptional({
    description: 'Explicit list of User UUIDs mentioned in this internal comment',
    example: ['user-uuid-1', 'user-uuid-2'],
  })
  @IsOptional()
  @IsArray()
  mentionedUserIds?: string[];

  @ApiPropertyOptional({
    description: 'Flag ensuring comment remains strictly internal (never sent to external email)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}
