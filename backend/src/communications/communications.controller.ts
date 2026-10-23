import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CommunicationsService } from './communications.service';
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
import {
  CommunicationHistoryQueryDto,
  CommunicationEntityType,
} from './dto/communication-history-query.dto';
import { CreateEmailIntegrationDto } from './dto/create-email-integration.dto';
import { UpdateEmailIntegrationDto } from './dto/update-email-integration.dto';
import { EmailIntegrationQueryDto } from './dto/email-integration-query.dto';
import { IntegrationWebhookDto } from './dto/integration-webhook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Communications')
@Controller('communications')
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  // ==========================================
  // Communication Center Endpoints
  // ==========================================

  @Get('center/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get unified Communication Center metrics, counters, and delivery stats' })
  @ApiResponse({ status: 200, description: 'Aggregated communications statistics' })
  async getCenterStats(@Query('workspaceId') workspaceId?: string) {
    return this.communicationsService.getCenterStats(workspaceId);
  }

  @Get('center/stream')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get real-time communication stream feed across channels' })
  @ApiResponse({ status: 200, description: 'Live communications stream' })
  async getCenterStream(@Query('workspaceId') workspaceId?: string) {
    return this.communicationsService.getCenterStream(workspaceId);
  }

  // ==========================================
  // Email Inbox & Folders
  // ==========================================

  @Get('emails')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all emails with filters, search, and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of emails' })
  async findAllEmails(@Query() query: EmailQueryDto) {
    return this.communicationsService.findAllEmails(query);
  }

  @Get('emails/inbox')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get Inbox emails' })
  @ApiResponse({ status: 200, description: 'Inbox emails' })
  async getInbox(@Query() query: EmailQueryDto) {
    return this.communicationsService.getInbox(query);
  }

  @Get('emails/sent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get Sent emails with delivery tracking status' })
  @ApiResponse({ status: 200, description: 'Sent emails' })
  async getSent(@Query() query: EmailQueryDto) {
    return this.communicationsService.getSent(query);
  }

  @Get('emails/drafts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get Draft emails' })
  @ApiResponse({ status: 200, description: 'Draft emails' })
  async getDrafts(@Query() query: EmailQueryDto) {
    return this.communicationsService.getDrafts(query);
  }

  @Get('emails/trash')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get Trash emails' })
  @ApiResponse({ status: 200, description: 'Trash emails' })
  async getTrash(@Query() query: EmailQueryDto) {
    return this.communicationsService.getTrash(query);
  }

  @Get('emails/starred')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get Starred emails' })
  @ApiResponse({ status: 200, description: 'Starred emails' })
  async getStarred(@Query() query: EmailQueryDto) {
    return this.communicationsService.getStarred(query);
  }

  // ==========================================
  // Compose, Reply, Forward & Batch Actions
  // ==========================================

  @Post('emails/compose')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Compose and dispatch email or save as draft' })
  @ApiResponse({ status: 201, description: 'Email composed and dispatched' })
  async composeEmail(
    @Body() dto: ComposeEmailDto,
    @CurrentUser() user: any,
  ) {
    return this.communicationsService.composeEmail(dto, user);
  }

  @Patch('emails/batch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Batch perform actions (mark read/unread, star, archive, move, delete)' })
  @ApiResponse({ status: 200, description: 'Batch action executed' })
  async batchEmailAction(@Body() dto: BatchEmailsDto) {
    return this.communicationsService.batchEmailAction(dto);
  }

  // ==========================================
  // Email Details, Threading & Replies
  // ==========================================

  @Get('emails/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get email details, full conversation thread, and internal comments' })
  @ApiParam({ name: 'id', description: 'EmailMessage UUID' })
  @ApiResponse({ status: 200, description: 'Email message details with thread' })
  async findEmailById(@Param('id') id: string) {
    return this.communicationsService.findEmailById(id);
  }

  @Patch('emails/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update email attributes (read status, star, folder, draft edits)' })
  @ApiParam({ name: 'id', description: 'EmailMessage UUID' })
  @ApiResponse({ status: 200, description: 'Email updated' })
  async updateEmail(
    @Param('id') id: string,
    @Body() dto: UpdateEmailDto,
  ) {
    return this.communicationsService.updateEmail(id, dto);
  }

  @Delete('emails/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete email (moves to Trash, or permanently deletes if already in Trash)' })
  @ApiParam({ name: 'id', description: 'EmailMessage UUID' })
  @ApiResponse({ status: 200, description: 'Email deleted or trashed' })
  async deleteEmail(@Param('id') id: string) {
    return this.communicationsService.deleteEmail(id);
  }

  @Post('emails/:id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reply to an email in thread' })
  @ApiParam({ name: 'id', description: 'EmailMessage UUID to reply to' })
  @ApiResponse({ status: 201, description: 'Reply email sent' })
  async replyEmail(
    @Param('id') id: string,
    @Body() dto: ReplyEmailDto,
    @CurrentUser() user: any,
  ) {
    return this.communicationsService.replyEmail(id, dto, user);
  }

  @Post('emails/:id/forward')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Forward an email in thread' })
  @ApiParam({ name: 'id', description: 'EmailMessage UUID to forward' })
  @ApiResponse({ status: 201, description: 'Forward email sent' })
  async forwardEmail(
    @Param('id') id: string,
    @Body() dto: ForwardEmailDto,
    @CurrentUser() user: any,
  ) {
    return this.communicationsService.forwardEmail(id, dto, user);
  }

  // ==========================================
  // Internal Comments & Mentions
  // ==========================================

  @Get('comments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List internal team comments with entity and mention filters' })
  @ApiResponse({ status: 200, description: 'Paginated internal comments' })
  async findAllComments(@Query() query: CommentQueryDto) {
    return this.communicationsService.findAllComments(query);
  }

  @Post('comments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create internal comment with @user mentions (generates notifications)' })
  @ApiResponse({ status: 201, description: 'Internal comment created' })
  async createComment(
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.communicationsService.createComment(dto, user);
  }

  @Get('comments/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get internal comment by ID' })
  @ApiParam({ name: 'id', description: 'Comment UUID' })
  @ApiResponse({ status: 200, description: 'Comment details' })
  async findCommentById(@Param('id') id: string) {
    return this.communicationsService.findCommentById(id);
  }

  @Patch('comments/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update internal comment content and mentions' })
  @ApiParam({ name: 'id', description: 'Comment UUID' })
  @ApiResponse({ status: 200, description: 'Comment updated' })
  async updateComment(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.communicationsService.updateComment(id, dto, user);
  }

  @Delete('comments/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete internal comment' })
  @ApiParam({ name: 'id', description: 'Comment UUID' })
  @ApiResponse({ status: 200, description: 'Comment deleted' })
  async deleteComment(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.communicationsService.deleteComment(id, user);
  }

  @Get('emails/:id/comments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get internal comments attached to an email' })
  @ApiParam({ name: 'id', description: 'EmailMessage UUID' })
  @ApiResponse({ status: 200, description: 'Email internal comments' })
  async getCommentsByEmail(@Param('id') id: string) {
    return this.communicationsService.comments.getByEmail(id);
  }

  // ==========================================
  // Email Templates & Dynamic Variables
  // ==========================================

  @Get('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List email templates with category and search filters' })
  @ApiResponse({ status: 200, description: 'Paginated templates' })
  async findAllTemplates(@Query() query: TemplateQueryDto) {
    return this.communicationsService.findAllTemplates(query);
  }

  @Get('templates/variables/available')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Catalog of supported template dynamic tokens (contact, lead, deal, user)' })
  @ApiResponse({ status: 200, description: 'Available template tokens catalog' })
  async getTemplateVariables() {
    return this.communicationsService.getTemplateVariablesCatalog();
  }

  @Post('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create email template with subject and body variables' })
  @ApiResponse({ status: 201, description: 'Template created' })
  async createTemplate(
    @Body() dto: CreateTemplateDto,
    @CurrentUser() user: any,
  ) {
    return this.communicationsService.createTemplate(dto, user);
  }

  @Get('templates/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiParam({ name: 'id', description: 'EmailTemplate UUID' })
  @ApiResponse({ status: 200, description: 'Template details' })
  async findTemplateById(@Param('id') id: string) {
    return this.communicationsService.findTemplateById(id);
  }

  @Patch('templates/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update email template' })
  @ApiParam({ name: 'id', description: 'EmailTemplate UUID' })
  @ApiResponse({ status: 200, description: 'Template updated' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.communicationsService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete email template' })
  @ApiParam({ name: 'id', description: 'EmailTemplate UUID' })
  @ApiResponse({ status: 200, description: 'Template deleted' })
  async deleteTemplate(@Param('id') id: string) {
    return this.communicationsService.deleteTemplate(id);
  }

  @Post('templates/:id/clone')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Duplicate an existing template' })
  @ApiParam({ name: 'id', description: 'EmailTemplate UUID' })
  @ApiResponse({ status: 201, description: 'Template cloned' })
  async cloneTemplate(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.communicationsService.cloneTemplate(id, user);
  }

  @Post('templates/:id/render')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Preview/Render template with real CRM entity values' })
  @ApiParam({ name: 'id', description: 'EmailTemplate UUID' })
  @ApiResponse({ status: 200, description: 'Interpolated subject and body preview' })
  async renderTemplate(
    @Param('id') id: string,
    @Body() dto: RenderTemplateDto,
    @CurrentUser() user: any,
  ) {
    return this.communicationsService.renderTemplate(id, dto, user);
  }

  // ==========================================
  // Communication History
  // ==========================================

  @Get('history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Unified communication history timeline (emails, calls, meetings, notes, comments)' })
  @ApiResponse({ status: 200, description: 'Aggregated timeline with channel summaries' })
  async getHistoryTimeline(@Query() query: CommunicationHistoryQueryDto) {
    return this.communicationsService.getHistoryTimeline(query);
  }

  @Get('contacts/:id/communications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get unified communication history for a specific Contact' })
  @ApiParam({ name: 'id', description: 'Contact UUID' })
  @ApiResponse({ status: 200, description: 'Contact communication history' })
  async getContactCommunications(
    @Param('id') contactId: string,
    @Query() query: CommunicationHistoryQueryDto,
  ) {
    return this.communicationsService.getHistoryTimeline({
      ...query,
      contactId,
      entityType: CommunicationEntityType.CONTACT,
      entityId: contactId,
    });
  }

  @Get('leads/:id/communications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get unified communication history for a specific Lead' })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({ status: 200, description: 'Lead communication history' })
  async getLeadCommunications(
    @Param('id') leadId: string,
    @Query() query: CommunicationHistoryQueryDto,
  ) {
    return this.communicationsService.getHistoryTimeline({
      ...query,
      leadId,
      entityType: CommunicationEntityType.LEAD,
      entityId: leadId,
    });
  }

  @Get('deals/:id/communications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get unified communication history for a specific Deal' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal communication history' })
  async getDealCommunications(
    @Param('id') dealId: string,
    @Query() query: CommunicationHistoryQueryDto,
  ) {
    return this.communicationsService.getHistoryTimeline({
      ...query,
      dealId,
      entityType: CommunicationEntityType.DEAL,
      entityId: dealId,
    });
  }

  // ==========================================
  // Module 25: Email Integrations (Zero-Credential Exposure)
  // ==========================================

  @Get('integrations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List email provider configurations (credentials are strictly masked/omitted)' })
  @ApiResponse({ status: 200, description: 'Active email integrations' })
  async findAllIntegrations(@Query() query: EmailIntegrationQueryDto) {
    return this.communicationsService.findAllIntegrations(query);
  }

  @Post('integrations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Configure new email integration provider (passwords/API keys encrypted securely)' })
  @ApiResponse({ status: 201, description: 'Email integration created' })
  async createIntegration(
    @Body() dto: CreateEmailIntegrationDto,
    @CurrentUser() user: any,
  ) {
    return this.communicationsService.createIntegration(dto, user);
  }

  @Get('integrations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get email provider integration by ID' })
  @ApiParam({ name: 'id', description: 'Integration UUID' })
  @ApiResponse({ status: 200, description: 'Integration details (masked credentials)' })
  async findIntegrationById(@Param('id') id: string) {
    return this.communicationsService.findIntegrationById(id);
  }

  @Patch('integrations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update email integration settings' })
  @ApiParam({ name: 'id', description: 'Integration UUID' })
  @ApiResponse({ status: 200, description: 'Integration updated' })
  async updateIntegration(
    @Param('id') id: string,
    @Body() dto: UpdateEmailIntegrationDto,
  ) {
    return this.communicationsService.updateIntegration(id, dto);
  }

  @Delete('integrations/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete email integration' })
  @ApiParam({ name: 'id', description: 'Integration UUID' })
  @ApiResponse({ status: 200, description: 'Integration deleted' })
  async deleteIntegration(@Param('id') id: string) {
    return this.communicationsService.deleteIntegration(id);
  }

  @Post('integrations/:id/set-default')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Set provider as default sender for workspace' })
  @ApiParam({ name: 'id', description: 'Integration UUID' })
  @ApiResponse({ status: 200, description: 'Set as default provider' })
  async setIntegrationDefault(@Param('id') id: string) {
    return this.communicationsService.setIntegrationDefault(id);
  }

  @Post('integrations/:id/test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Test provider connection / ping SMTP or API credentials' })
  @ApiParam({ name: 'id', description: 'Integration UUID' })
  @ApiResponse({ status: 200, description: 'Connection test result' })
  async testIntegration(@Param('id') id: string) {
    return this.communicationsService.testIntegration(id);
  }

  @Post('integrations/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook endpoint for email delivery, open, click, bounce events' })
  @ApiResponse({ status: 200, description: 'Webhook event processed' })
  async handleIntegrationWebhook(@Body() dto: IntegrationWebhookDto) {
    return this.communicationsService.handleIntegrationWebhook(dto);
  }
}
