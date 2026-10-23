import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CommunicationsController } from './communications.controller';
import { CommunicationsService } from './communications.service';
import { CommunicationCenterService } from './services/communication-center.service';
import { EmailsService } from './services/emails.service';
import { CommentsService } from './services/comments.service';
import { TemplatesService } from './services/templates.service';
import { CommunicationHistoryService } from './services/communication-history.service';
import { EmailIntegrationsService } from './services/email-integrations.service';
import { EmailProviderFactory } from './providers/email-provider.factory';

@Module({
  imports: [DatabaseModule],
  controllers: [CommunicationsController],
  providers: [
    CommunicationsService,
    CommunicationCenterService,
    EmailsService,
    CommentsService,
    TemplatesService,
    CommunicationHistoryService,
    EmailIntegrationsService,
    EmailProviderFactory,
  ],
  exports: [
    CommunicationsService,
    CommunicationCenterService,
    EmailsService,
    CommentsService,
    TemplatesService,
    CommunicationHistoryService,
    EmailIntegrationsService,
    EmailProviderFactory,
  ],
})
export class CommunicationsModule {}
