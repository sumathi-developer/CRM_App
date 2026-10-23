import { IsArray, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmailFolder } from './email-query.dto';

export enum BatchEmailAction {
  MARK_READ = 'MARK_READ',
  MARK_UNREAD = 'MARK_UNREAD',
  STAR = 'STAR',
  UNSTAR = 'UNSTAR',
  ARCHIVE = 'ARCHIVE',
  UNARCHIVE = 'UNARCHIVE',
  MOVE_TO_FOLDER = 'MOVE_TO_FOLDER',
  DELETE = 'DELETE',
}

export class BatchEmailsDto {
  @ApiProperty({ description: 'Array of EmailMessage UUIDs', example: ['uuid-1', 'uuid-2'] })
  @IsArray()
  @IsNotEmpty()
  emailIds: string[];

  @ApiProperty({ enum: BatchEmailAction, description: 'Action to perform on selected emails' })
  @IsEnum(BatchEmailAction)
  action: BatchEmailAction;

  @ApiPropertyOptional({
    enum: EmailFolder,
    description: 'Target folder when action is MOVE_TO_FOLDER',
  })
  @IsOptional()
  @IsEnum(EmailFolder)
  targetFolder?: EmailFolder;
}
