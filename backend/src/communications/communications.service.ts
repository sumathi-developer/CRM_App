import { Injectable } from '@nestjs/common';
import { CommunicationCenterService } from './services/communication-center.service';
import { EmailsService } from './services/emails.service';
import { CommentsService } from './services/comments.service';
import { TemplatesService } from './services/templates.service';
import { CommunicationHistoryService } from './services/communication-history.service';
import { EmailIntegrationsService } from './services/email-integrations.service';
import { ComposeEmailDto } from './dto/compose-email.dto';
import { EmailQueryDto } from './dto/email-query.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { BatchEmailsDto } from './dto/batch-emails.dto';
import { ReplyEmailDto, ForwardEmailDto } from './dto/reply-forward.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentQueryDto } from './dto/comment-query.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplateQueryDto } from './dto/template-query.dto';
import { RenderTemplateDto } from './dto/render-template.dto';
import { CommunicationHistoryQueryDto } from './dto/communication-history-query.dto';
import { CreateEmailIntegrationDto } from './dto/create-email-integration.dto';
import { UpdateEmailIntegrationDto } from './dto/update-email-integration.dto';
import { EmailIntegrationQueryDto } from './dto/email-integration-query.dto';
import { IntegrationWebhookDto } from './dto/integration-webhook.dto';

@Injectable()
export class CommunicationsService {
  constructor(
    public readonly center: CommunicationCenterService,
    public readonly emails: EmailsService,
    public readonly comments: CommentsService,
    public readonly templates: TemplatesService,
    public readonly history: CommunicationHistoryService,
    public readonly integrations: EmailIntegrationsService,
  ) {}

  // Center
  async getCenterStats(workspaceId?: string) {
    return this.center.getCenterStats(workspaceId);
  }

  async getCenterStream(workspaceId?: string) {
    return this.center.getStream(workspaceId);
  }

  // Emails & Folders
  async findAllEmails(query: EmailQueryDto) {
    return this.emails.findAll(query);
  }

  async getInbox(query: EmailQueryDto) {
    return this.emails.getInbox(query);
  }

  async getSent(query: EmailQueryDto) {
    return this.emails.getSent(query);
  }

  async getDrafts(query: EmailQueryDto) {
    return this.emails.getDrafts(query);
  }

  async getTrash(query: EmailQueryDto) {
    return this.emails.getTrash(query);
  }

  async getStarred(query: EmailQueryDto) {
    return this.emails.getStarred(query);
  }

  async findEmailById(id: string) {
    return this.emails.findOne(id, true);
  }

  async composeEmail(dto: ComposeEmailDto, user?: any) {
    return this.emails.compose(dto, user);
  }

  async replyEmail(id: string, dto: ReplyEmailDto, user?: any) {
    return this.emails.reply(id, dto, user);
  }

  async forwardEmail(id: string, dto: ForwardEmailDto, user?: any) {
    return this.emails.forward(id, dto, user);
  }

  async updateEmail(id: string, dto: UpdateEmailDto) {
    return this.emails.update(id, dto);
  }

  async batchEmailAction(dto: BatchEmailsDto) {
    return this.emails.batchAction(dto);
  }

  async deleteEmail(id: string) {
    return this.emails.remove(id);
  }

  // Comments & Mentions
  async findAllComments(query: CommentQueryDto) {
    return this.comments.findAll(query);
  }

  async findCommentById(id: string) {
    return this.comments.findOne(id);
  }

  async createComment(dto: CreateCommentDto, user?: any) {
    return this.comments.create(dto, user?.id);
  }

  async updateComment(id: string, dto: UpdateCommentDto, user?: any) {
    return this.comments.update(id, dto, user?.id);
  }

  async deleteComment(id: string, user?: any) {
    return this.comments.remove(id, user?.id);
  }

  // Templates
  async findAllTemplates(query: TemplateQueryDto) {
    return this.templates.findAll(query);
  }

  async findTemplateById(id: string) {
    return this.templates.findOne(id);
  }

  async createTemplate(dto: CreateTemplateDto, user?: any) {
    return this.templates.create(dto, user?.id);
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto) {
    return this.templates.update(id, dto);
  }

  async deleteTemplate(id: string) {
    return this.templates.remove(id);
  }

  async cloneTemplate(id: string, user?: any) {
    return this.templates.clone(id, user?.id);
  }

  async renderTemplate(id: string, dto: RenderTemplateDto, user?: any) {
    return this.templates.render(id, dto, user);
  }

  getTemplateVariablesCatalog() {
    return this.templates.getAvailableVariablesCatalog();
  }

  // History
  async getHistoryTimeline(query: CommunicationHistoryQueryDto) {
    return this.history.getTimeline(query);
  }

  // Module 25 Integrations
  async findAllIntegrations(query: EmailIntegrationQueryDto) {
    return this.integrations.findAll(query);
  }

  async findIntegrationById(id: string) {
    return this.integrations.findOne(id);
  }

  async createIntegration(dto: CreateEmailIntegrationDto, user?: any) {
    return this.integrations.create(dto, user?.id);
  }

  async updateIntegration(id: string, dto: UpdateEmailIntegrationDto) {
    return this.integrations.update(id, dto);
  }

  async deleteIntegration(id: string) {
    return this.integrations.remove(id);
  }

  async setIntegrationDefault(id: string) {
    return this.integrations.setDefault(id);
  }

  async testIntegration(id: string) {
    return this.integrations.testConnection(id);
  }

  async handleIntegrationWebhook(dto: IntegrationWebhookDto) {
    return this.integrations.handleWebhook(dto);
  }
}
