import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FormSubmissionEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  formId: string;

  @ApiPropertyOptional()
  leadId?: string;

  @ApiPropertyOptional()
  leadSourceId?: string;

  @ApiProperty()
  payload: any;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  ipAddress?: string;

  @ApiPropertyOptional()
  userAgent?: string;

  @ApiPropertyOptional()
  referer?: string;

  @ApiProperty()
  spamScore: number;

  @ApiProperty()
  isSpam: boolean;

  @ApiPropertyOptional()
  errorMessage?: string;

  @ApiProperty()
  submittedAt: Date;

  @ApiPropertyOptional()
  workspaceId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
