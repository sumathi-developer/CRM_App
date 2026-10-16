import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
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
  ApiQuery,
} from '@nestjs/swagger';
import { LeadGenerationService } from './lead-generation.service';
import { CreateLeadSourceDto } from './dto/create-lead-source.dto';
import { UpdateLeadSourceDto } from './dto/update-lead-source.dto';
import { LeadSourceQueryDto } from './dto/lead-source-query.dto';
import { CreateWebFormDto } from './dto/create-web-form.dto';
import { UpdateWebFormDto } from './dto/update-web-form.dto';
import { WebFormQueryDto } from './dto/web-form-query.dto';
import { PublicFormSubmitDto } from './dto/public-form-submit.dto';
import { SubmissionQueryDto } from './dto/submission-query.dto';
import { ChannelLeadQueryDto } from './dto/channel-lead-query.dto';
import { ManualLeadCaptureDto } from './dto/manual-lead-capture.dto';
import { CreateScoringRuleDto } from './dto/create-scoring-rule.dto';
import { UpdateScoringRuleDto } from './dto/update-scoring-rule.dto';
import { ScorePreviewDto } from './dto/score-preview.dto';
import { CreateQualificationRuleDto } from './dto/create-qualification-rule.dto';
import { UpdateQualificationRuleDto } from './dto/update-qualification-rule.dto';
import { QualificationPreviewDto } from './dto/qualification-preview.dto';
import { CreateAssignmentRuleDto } from './dto/create-assignment-rule.dto';
import { UpdateAssignmentRuleDto } from './dto/update-assignment-rule.dto';
import { RouteLeadDto } from './dto/route-lead.dto';
import { BulkAssignDto } from './dto/bulk-assign.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Lead Generation')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lead-generation')
export class LeadGenerationController {
  constructor(private readonly leadGenService: LeadGenerationService) {}

  // ==========================================
  // 1. LEAD GENERATION OVERVIEW & ANALYTICS
  // ==========================================

  @Get('overview')
  @ApiOperation({ summary: 'Get Lead Generation overview metrics, funnels, and KPIs' })
  @ApiQuery({ name: 'workspaceId', required: false })
  @ApiResponse({ status: 200, description: 'Comprehensive lead generation dashboard overview' })
  async getOverview(@Query('workspaceId') workspaceId?: string) {
    return this.leadGenService.analytics.getOverview(workspaceId);
  }

  @Get('analytics/overview')
  @ApiOperation({ summary: 'Get generation analytics and time-series performance' })
  @ApiQuery({ name: 'workspaceId', required: false })
  @ApiResponse({ status: 200, description: 'Lead generation analytics' })
  async getGenerationAnalytics(@Query('workspaceId') workspaceId?: string) {
    return this.leadGenService.analytics.getOverview(workspaceId);
  }

  @Get('analytics/sources')
  @ApiOperation({ summary: 'Get deep-dive Lead Source analytics with CAC, CPL, and ROI' })
  @ApiQuery({ name: 'workspaceId', required: false })
  @ApiResponse({ status: 200, description: 'Lead source performance metrics' })
  async getSourceAnalytics(@Query('workspaceId') workspaceId?: string) {
    return this.leadGenService.analytics.getSourcesAnalytics(workspaceId);
  }

  @Get('analytics/forms')
  @ApiOperation({ summary: 'Get web form and landing page conversion analytics' })
  @ApiQuery({ name: 'workspaceId', required: false })
  @ApiResponse({ status: 200, description: 'Web forms conversion analytics' })
  async getFormAnalytics(@Query('workspaceId') workspaceId?: string) {
    return this.leadGenService.analytics.getFormsAnalytics(workspaceId);
  }

  // ==========================================
  // 2. LEAD SOURCES CRUD
  // ==========================================

  @Post('sources')
  @ApiOperation({ summary: 'Create a new lead source' })
  @ApiResponse({ status: 201, description: 'Lead source created successfully' })
  async createSource(@Body() dto: CreateLeadSourceDto) {
    return this.leadGenService.sources.create(dto);
  }

  @Get('sources')
  @ApiOperation({ summary: 'List lead sources with pagination, search, and type filters' })
  @ApiResponse({ status: 200, description: 'Paginated lead sources' })
  async findAllSources(@Query() query: LeadSourceQueryDto) {
    return this.leadGenService.sources.findAll(query);
  }

  @Get('sources/:id')
  @ApiOperation({ summary: 'Get lead source details and performance stats by ID' })
  @ApiParam({ name: 'id', description: 'Lead Source UUID' })
  @ApiResponse({ status: 200, description: 'Lead source details' })
  async findOneSource(@Param('id') id: string) {
    return this.leadGenService.sources.findOne(id);
  }

  @Patch('sources/:id')
  @ApiOperation({ summary: 'Update lead source attributes' })
  @ApiParam({ name: 'id', description: 'Lead Source UUID' })
  @ApiResponse({ status: 200, description: 'Lead source updated' })
  async updateSource(@Param('id') id: string, @Body() dto: UpdateLeadSourceDto) {
    return this.leadGenService.sources.update(id, dto);
  }

  @Delete('sources/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete or archive lead source' })
  @ApiParam({ name: 'id', description: 'Lead Source UUID' })
  @ApiResponse({ status: 200, description: 'Lead source removed' })
  async removeSource(@Param('id') id: string) {
    return this.leadGenService.sources.remove(id);
  }

  // ==========================================
  // 3. WEB FORMS & CAPTURE FORMS CRUD
  // ==========================================

  @Post('forms')
  @ApiOperation({ summary: 'Create a new web capture form or landing page' })
  @ApiResponse({ status: 201, description: 'Web form created successfully' })
  async createForm(@Body() dto: CreateWebFormDto) {
    return this.leadGenService.forms.create(dto);
  }

  @Get('forms')
  @ApiOperation({ summary: 'List web forms and landing pages' })
  @ApiResponse({ status: 200, description: 'Paginated list of forms' })
  async findAllForms(@Query() query: WebFormQueryDto) {
    return this.leadGenService.forms.findAll(query);
  }

  @Get('forms/public/:slug')
  @Public()
  @ApiOperation({ summary: 'Publicly retrieve published form schema for web rendering' })
  @ApiParam({ name: 'slug', description: 'Form public slug' })
  @ApiResponse({ status: 200, description: 'Form schema, styling, and fields' })
  async getPublicForm(@Param('slug') slug: string) {
    return this.leadGenService.forms.getPublicForm(slug);
  }

  @Post('forms/public/:slug/submit')
  @Public()
  @ApiOperation({ summary: 'Public lead form submission (with anti-spam, scoring, qualification, and routing)' })
  @ApiParam({ name: 'slug', description: 'Form public slug' })
  @ApiResponse({ status: 200, description: 'Form submission processed and lead created' })
  async submitPublicForm(
    @Param('slug') slug: string,
    @Body() dto: PublicFormSubmitDto,
    @Req() req: any,
  ) {
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const referer = req.headers['referer'] || req.headers['referrer'];

    return this.leadGenService.forms.submitPublicForm(slug, dto, {
      ipAddress,
      userAgent,
      referer,
    });
  }

  @Get('forms/:id')
  @ApiOperation({ summary: 'Get web form details, field definitions, and embed code' })
  @ApiParam({ name: 'id', description: 'Web Form UUID' })
  @ApiResponse({ status: 200, description: 'Web form configuration' })
  async findOneForm(@Param('id') id: string) {
    return this.leadGenService.forms.findOne(id);
  }

  @Patch('forms/:id')
  @ApiOperation({ summary: 'Update web form configuration, fields, or styling' })
  @ApiParam({ name: 'id', description: 'Web Form UUID' })
  @ApiResponse({ status: 200, description: 'Web form updated' })
  async updateForm(@Param('id') id: string, @Body() dto: UpdateWebFormDto) {
    return this.leadGenService.forms.update(id, dto);
  }

  @Delete('forms/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete web form' })
  @ApiParam({ name: 'id', description: 'Web Form UUID' })
  @ApiResponse({ status: 200, description: 'Web form deleted' })
  async removeForm(@Param('id') id: string) {
    return this.leadGenService.forms.remove(id);
  }

  @Post('forms/:id/publish')
  @ApiOperation({ summary: 'Publish form, activating public URL and embed snippet' })
  @ApiParam({ name: 'id', description: 'Web Form UUID' })
  @ApiResponse({ status: 200, description: 'Form published' })
  async publishForm(@Param('id') id: string) {
    return this.leadGenService.forms.publish(id);
  }

  @Post('forms/:id/unpublish')
  @ApiOperation({ summary: 'Unpublish/archive web form' })
  @ApiParam({ name: 'id', description: 'Web Form UUID' })
  @ApiResponse({ status: 200, description: 'Form unpublished' })
  async unpublishForm(@Param('id') id: string) {
    return this.leadGenService.forms.unpublish(id);
  }

  // ==========================================
  // 4. FORM SUBMISSION MANAGEMENT
  // ==========================================

  @Get('submissions')
  @ApiOperation({ summary: 'List form submissions with filters' })
  @ApiResponse({ status: 200, description: 'Paginated form submissions' })
  async findAllSubmissions(@Query() query: SubmissionQueryDto) {
    return this.leadGenService.forms.findAllSubmissions(query);
  }

  @Get('submissions/:id')
  @ApiOperation({ summary: 'Get submission details by ID' })
  @ApiParam({ name: 'id', description: 'Submission UUID' })
  @ApiResponse({ status: 200, description: 'Submission payload and audit metadata' })
  async findOneSubmission(@Param('id') id: string) {
    return this.leadGenService.forms.findSubmissionById(id);
  }

  @Patch('submissions/:id/mark-spam')
  @ApiOperation({ summary: 'Flag or unflag a submission as spam' })
  @ApiParam({ name: 'id', description: 'Submission UUID' })
  @ApiResponse({ status: 200, description: 'Submission spam status updated' })
  async markSpam(@Param('id') id: string, @Body('isSpam') isSpam: boolean) {
    return this.leadGenService.forms.markSubmissionSpam(id, Boolean(isSpam));
  }

  @Post('submissions/:id/reprocess')
  @ApiOperation({ summary: 'Reprocess a submission into a lead' })
  @ApiParam({ name: 'id', description: 'Submission UUID' })
  @ApiResponse({ status: 200, description: 'Submission reprocessed' })
  async reprocessSubmission(@Param('id') id: string) {
    return this.leadGenService.forms.reprocessSubmission(id);
  }

  // ==========================================
  // 5. CHANNEL-SPECIFIC LEAD RETRIEVAL
  // ==========================================

  @Get('leads/campaign')
  @ApiOperation({ summary: 'Retrieve Campaign leads (filtered by campaign, medium, paid search)' })
  @ApiResponse({ status: 200, description: 'Paginated campaign leads' })
  async getCampaignLeads(@Query() query: ChannelLeadQueryDto) {
    return this.leadGenService.getCampaignLeads(query);
  }

  @Get('leads/social')
  @ApiOperation({ summary: 'Retrieve Social Media leads (LinkedIn, Twitter, Facebook, etc.)' })
  @ApiResponse({ status: 200, description: 'Paginated social media leads' })
  async getSocialLeads(@Query() query: ChannelLeadQueryDto) {
    return this.leadGenService.getSocialLeads(query);
  }

  @Get('leads/website')
  @ApiOperation({ summary: 'Retrieve Website leads (organic visitors, contact forms, widgets)' })
  @ApiResponse({ status: 200, description: 'Paginated website leads' })
  async getWebsiteLeads(@Query() query: ChannelLeadQueryDto) {
    return this.leadGenService.getWebsiteLeads(query);
  }

  @Get('leads/landing-page')
  @ApiOperation({ summary: 'Retrieve Landing Page leads' })
  @ApiResponse({ status: 200, description: 'Paginated landing page leads' })
  async getLandingPageLeads(@Query() query: ChannelLeadQueryDto) {
    return this.leadGenService.getLandingPageLeads(query);
  }

  @Get('leads/email')
  @ApiOperation({ summary: 'Retrieve Email leads (newsletters, inbound email campaigns)' })
  @ApiResponse({ status: 200, description: 'Paginated email leads' })
  async getEmailLeads(@Query() query: ChannelLeadQueryDto) {
    return this.leadGenService.getEmailLeads(query);
  }

  @Get('leads/referral')
  @ApiOperation({ summary: 'Retrieve Referral leads (partner and client referrals)' })
  @ApiResponse({ status: 200, description: 'Paginated referral leads' })
  async getReferralLeads(@Query() query: ChannelLeadQueryDto) {
    return this.leadGenService.getReferralLeads(query);
  }

  @Get('leads/manual')
  @ApiOperation({ summary: 'Retrieve Manually Captured leads' })
  @ApiResponse({ status: 200, description: 'Paginated manual leads' })
  async getManualLeads(@Query() query: ChannelLeadQueryDto) {
    return this.leadGenService.getManualLeads(query);
  }

  // ==========================================
  // 6. MANUAL LEAD CAPTURE
  // ==========================================

  @Post('leads/manual')
  @ApiOperation({ summary: 'Manually capture a lead with instant scoring, qualification, and routing' })
  @ApiResponse({ status: 201, description: 'Lead captured and processed' })
  async captureManualLead(
    @Body() dto: ManualLeadCaptureDto,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.leadGenService.captureManualLead(dto, currentUserId);
  }

  // ==========================================
  // 7. LEAD SCORING RULES & SCORE CALCULATION
  // ==========================================

  @Post('scoring-rules')
  @ApiOperation({ summary: 'Create a lead scoring rule' })
  @ApiResponse({ status: 201, description: 'Scoring rule created' })
  async createScoringRule(@Body() dto: CreateScoringRuleDto) {
    return this.leadGenService.scoring.create(dto);
  }

  @Get('scoring-rules')
  @ApiOperation({ summary: 'List all lead scoring rules' })
  @ApiResponse({ status: 200, description: 'List of scoring rules' })
  async findAllScoringRules(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('category') category?: string,
    @Query('isActive') isActive?: boolean,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.leadGenService.scoring.findAll({ page, limit, category, isActive, workspaceId });
  }

  @Get('scoring-rules/:id')
  @ApiOperation({ summary: 'Get scoring rule details by ID' })
  @ApiParam({ name: 'id', description: 'Rule UUID' })
  @ApiResponse({ status: 200, description: 'Scoring rule' })
  async findOneScoringRule(@Param('id') id: string) {
    return this.leadGenService.scoring.findOne(id);
  }

  @Patch('scoring-rules/:id')
  @ApiOperation({ summary: 'Update scoring rule' })
  @ApiParam({ name: 'id', description: 'Rule UUID' })
  @ApiResponse({ status: 200, description: 'Scoring rule updated' })
  async updateScoringRule(@Param('id') id: string, @Body() dto: UpdateScoringRuleDto) {
    return this.leadGenService.scoring.update(id, dto);
  }

  @Delete('scoring-rules/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete scoring rule' })
  @ApiParam({ name: 'id', description: 'Rule UUID' })
  @ApiResponse({ status: 200, description: 'Scoring rule deleted' })
  async removeScoringRule(@Param('id') id: string) {
    return this.leadGenService.scoring.remove(id);
  }

  @Post('leads/:leadId/calculate-score')
  @ApiOperation({ summary: 'Recalculate and update score for an existing lead in Module 06' })
  @ApiParam({ name: 'leadId', description: 'Lead UUID' })
  @ApiResponse({ status: 200, description: 'Lead score recalculated and applied' })
  async calculateLeadScore(@Param('leadId') leadId: string) {
    return this.leadGenService.scoring.calculateAndApply(leadId);
  }

  @Post('scoring/preview')
  @ApiOperation({ summary: 'Preview score calculation for a hypothetical lead payload' })
  @ApiResponse({ status: 200, description: 'Preview score breakdown' })
  async previewScore(@Body() dto: ScorePreviewDto) {
    return this.leadGenService.scoring.calculateScore(dto.lead, dto.workspaceId);
  }

  // ==========================================
  // 8. LEAD QUALIFICATION RULES & EVALUATION
  // ==========================================

  @Post('qualification-rules')
  @ApiOperation({ summary: 'Create a qualification rule' })
  @ApiResponse({ status: 201, description: 'Qualification rule created' })
  async createQualificationRule(@Body() dto: CreateQualificationRuleDto) {
    return this.leadGenService.qualification.create(dto);
  }

  @Get('qualification-rules')
  @ApiOperation({ summary: 'List qualification rules' })
  @ApiResponse({ status: 200, description: 'List of qualification rules' })
  async findAllQualificationRules(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('targetStatus') targetStatus?: string,
    @Query('isActive') isActive?: boolean,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.leadGenService.qualification.findAll({ page, limit, targetStatus, isActive, workspaceId });
  }

  @Get('qualification-rules/:id')
  @ApiOperation({ summary: 'Get qualification rule details by ID' })
  @ApiParam({ name: 'id', description: 'Rule UUID' })
  @ApiResponse({ status: 200, description: 'Qualification rule details' })
  async findOneQualificationRule(@Param('id') id: string) {
    return this.leadGenService.qualification.findOne(id);
  }

  @Patch('qualification-rules/:id')
  @ApiOperation({ summary: 'Update qualification rule' })
  @ApiParam({ name: 'id', description: 'Rule UUID' })
  @ApiResponse({ status: 200, description: 'Qualification rule updated' })
  async updateQualificationRule(@Param('id') id: string, @Body() dto: UpdateQualificationRuleDto) {
    return this.leadGenService.qualification.update(id, dto);
  }

  @Delete('qualification-rules/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete qualification rule' })
  @ApiParam({ name: 'id', description: 'Rule UUID' })
  @ApiResponse({ status: 200, description: 'Qualification rule deleted' })
  async removeQualificationRule(@Param('id') id: string) {
    return this.leadGenService.qualification.remove(id);
  }

  @Post('leads/:leadId/evaluate-qualification')
  @ApiOperation({ summary: 'Evaluate qualification rules for a lead and optionally auto-qualify' })
  @ApiParam({ name: 'leadId', description: 'Lead UUID' })
  @ApiResponse({ status: 200, description: 'Qualification evaluation result' })
  async evaluateLeadQualification(@Param('leadId') leadId: string) {
    return this.leadGenService.qualification.evaluateAndApply(leadId);
  }

  @Post('qualification/preview')
  @ApiOperation({ summary: 'Preview qualification evaluation for a hypothetical lead payload' })
  @ApiResponse({ status: 200, description: 'Preview qualification result' })
  async previewQualification(@Body() dto: QualificationPreviewDto) {
    return this.leadGenService.qualification.evaluate(dto.lead, dto.workspaceId);
  }

  // ==========================================
  // 9. LEAD ROUTING & ASSIGNMENT RULES
  // ==========================================

  @Post('assignment-rules')
  @ApiOperation({ summary: 'Create a lead routing & assignment rule' })
  @ApiResponse({ status: 201, description: 'Assignment rule created' })
  async createAssignmentRule(@Body() dto: CreateAssignmentRuleDto) {
    return this.leadGenService.routing.create(dto);
  }

  @Get('assignment-rules')
  @ApiOperation({ summary: 'List lead routing and assignment rules' })
  @ApiResponse({ status: 200, description: 'List of assignment rules' })
  async findAllAssignmentRules(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('strategy') strategy?: string,
    @Query('isActive') isActive?: boolean,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.leadGenService.routing.findAll({ page, limit, strategy, isActive, workspaceId });
  }

  @Get('assignment-rules/:id')
  @ApiOperation({ summary: 'Get assignment rule details by ID' })
  @ApiParam({ name: 'id', description: 'Rule UUID' })
  @ApiResponse({ status: 200, description: 'Assignment rule details' })
  async findOneAssignmentRule(@Param('id') id: string) {
    return this.leadGenService.routing.findOne(id);
  }

  @Patch('assignment-rules/:id')
  @ApiOperation({ summary: 'Update assignment rule' })
  @ApiParam({ name: 'id', description: 'Rule UUID' })
  @ApiResponse({ status: 200, description: 'Assignment rule updated' })
  async updateAssignmentRule(@Param('id') id: string, @Body() dto: UpdateAssignmentRuleDto) {
    return this.leadGenService.routing.update(id, dto);
  }

  @Delete('assignment-rules/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete assignment rule' })
  @ApiParam({ name: 'id', description: 'Rule UUID' })
  @ApiResponse({ status: 200, description: 'Assignment rule deleted' })
  async removeAssignmentRule(@Param('id') id: string) {
    return this.leadGenService.routing.remove(id);
  }

  @Post('leads/:leadId/route')
  @ApiOperation({ summary: 'Route and assign an existing lead via rules or direct user' })
  @ApiParam({ name: 'leadId', description: 'Lead UUID' })
  @ApiResponse({ status: 200, description: 'Lead routed and assigned' })
  async routeLead(@Param('leadId') leadId: string, @Body() dto: RouteLeadDto) {
    return this.leadGenService.routing.routeLead(leadId, dto.ruleId, dto.targetUserId);
  }

  @Post('assignment/bulk')
  @ApiOperation({ summary: 'Bulk assign multiple leads using routing rules or specific owner' })
  @ApiResponse({ status: 200, description: 'Bulk routing execution results' })
  async bulkAssign(@Body() dto: BulkAssignDto) {
    return this.leadGenService.routing.bulkAssign(dto.leadIds, dto.ownerId, dto.ruleId);
  }
}
