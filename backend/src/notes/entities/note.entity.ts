import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NoteEntity {
  @ApiProperty({ example: 'note-uuid-1' })
  id: string;

  @ApiPropertyOptional({ example: 'Meeting summary' })
  title?: string;

  @ApiProperty({ example: 'Customer mentioned they are ready to sign after budget approval next week.' })
  content: string;

  @ApiPropertyOptional({ example: 'contact-uuid' })
  contactId?: string;

  @ApiPropertyOptional({ example: 'lead-uuid' })
  leadId?: string;

  @ApiPropertyOptional({ example: 'deal-uuid' })
  dealId?: string;

  @ApiPropertyOptional({ example: 'user-uuid' })
  authorId?: string;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  updatedAt: Date;
}
