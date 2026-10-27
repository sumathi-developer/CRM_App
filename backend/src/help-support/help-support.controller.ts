import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
  ApiQuery,
} from '@nestjs/swagger';
import { HelpSupportService } from './help-support.service';
import { CreateHelpCategoryDto } from './dto/create-help-category.dto';
import { UpdateHelpCategoryDto } from './dto/update-help-category.dto';
import { CreateHelpArticleDto } from './dto/create-help-article.dto';
import { UpdateHelpArticleDto } from './dto/update-help-article.dto';
import { HelpQueryDto } from './dto/help-query.dto';
import { CreateDocCategoryDto } from './dto/create-doc-category.dto';
import { UpdateDocCategoryDto } from './dto/update-doc-category.dto';
import { CreateDocPageDto } from './dto/create-doc-page.dto';
import { UpdateDocPageDto } from './dto/update-doc-page.dto';
import { DocQueryDto } from './dto/doc-query.dto';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { FaqQueryDto } from './dto/faq-query.dto';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { AddTicketMessageDto } from './dto/add-ticket-message.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { FeedbackQueryDto } from './dto/feedback-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Help & Support')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('help-support')
export class HelpSupportController {
  constructor(private readonly service: HelpSupportService) {}

  // ==========================================
  // 1. HELP CENTER
  // ==========================================

  @Get('help-center/categories')
  @ApiOperation({ summary: 'List Help Center categories with article counts' })
  @ApiQuery({ name: 'workspaceId', required: false })
  @ApiQuery({ name: 'isPublished', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of Help Center categories' })
  async getHelpCategories(
    @Query('workspaceId') workspaceId?: string,
    @Query('isPublished') isPublished?: string,
  ) {
    const published = isPublished !== undefined ? isPublished === 'true' : undefined;
    return this.service.findAllHelpCategories(workspaceId, published);
  }

  @Post('help-center/categories')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create Help Center category (Admin/Manager)' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async createHelpCategory(
    @Body() dto: CreateHelpCategoryDto,
    @CurrentUser() user: any,
  ) {
    return this.service.createHelpCategory(dto, user);
  }

  @Patch('help-center/categories/:id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update Help Center category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  async updateHelpCategory(
    @Param('id') id: string,
    @Body() dto: UpdateHelpCategoryDto,
  ) {
    return this.service.updateHelpCategory(id, dto);
  }

  @Delete('help-center/categories/:id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Delete Help Center category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  async deleteHelpCategory(@Param('id') id: string) {
    return this.service.deleteHelpCategory(id);
  }

  @Get('help-center/articles')
  @ApiOperation({ summary: 'Search and list Help Center articles' })
  @ApiResponse({ status: 200, description: 'Paginated list of articles' })
  async getHelpArticles(
    @Query() query: HelpQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.service.findAllHelpArticles(query, user);
  }

  @Post('help-center/articles')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create Help Center article (Admin/Manager)' })
  @ApiResponse({ status: 201, description: 'Article created' })
  async createHelpArticle(
    @Body() dto: CreateHelpArticleDto,
    @CurrentUser() user: any,
  ) {
    return this.service.createHelpArticle(dto, user);
  }

  @Get('help-center/articles/:id')
  @ApiOperation({ summary: 'Get Help Center article details and related articles' })
  @ApiParam({ name: 'id', description: 'Article UUID' })
  @ApiResponse({ status: 200, description: 'Article details' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async getHelpArticleById(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.service.findHelpArticleById(id, user);
  }

  @Patch('help-center/articles/:id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update Help Center article' })
  @ApiParam({ name: 'id', description: 'Article UUID' })
  @ApiResponse({ status: 200, description: 'Article updated' })
  async updateHelpArticle(
    @Param('id') id: string,
    @Body() dto: UpdateHelpArticleDto,
  ) {
    return this.service.updateHelpArticle(id, dto);
  }

  @Delete('help-center/articles/:id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Delete Help Center article' })
  @ApiParam({ name: 'id', description: 'Article UUID' })
  @ApiResponse({ status: 200, description: 'Article deleted' })
  async deleteHelpArticle(@Param('id') id: string) {
    return this.service.deleteHelpArticle(id);
  }

  @Post('help-center/articles/:id/vote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit helpful / unhelpful vote on an article' })
  @ApiParam({ name: 'id', description: 'Article UUID' })
  @ApiQuery({ name: 'isHelpful', type: Boolean, description: 'True if helpful, false if not' })
  @ApiResponse({ status: 200, description: 'Feedback vote recorded' })
  async voteHelpArticle(
    @Param('id') id: string,
    @Query('isHelpful') isHelpful: string,
  ) {
    return this.service.voteHelpArticle(id, isHelpful === 'true');
  }

  // ==========================================
  // 2. DOCUMENTATION
  // ==========================================

  @Get('docs/categories')
  @ApiOperation({ summary: 'List documentation categories with page counts' })
  @ApiQuery({ name: 'workspaceId', required: false })
  @ApiQuery({ name: 'version', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'List of doc categories' })
  async getDocCategories(
    @Query('workspaceId') workspaceId?: string,
    @Query('version') version?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAllDocCategories(workspaceId, version, status);
  }

  @Post('docs/categories')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create documentation category' })
  @ApiResponse({ status: 201, description: 'Doc category created' })
  async createDocCategory(
    @Body() dto: CreateDocCategoryDto,
    @CurrentUser() user: any,
  ) {
    return this.service.createDocCategory(dto, user);
  }

  @Patch('docs/categories/:id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update documentation category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Doc category updated' })
  async updateDocCategory(
    @Param('id') id: string,
    @Body() dto: UpdateDocCategoryDto,
  ) {
    return this.service.updateDocCategory(id, dto);
  }

  @Delete('docs/categories/:id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Delete documentation category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Doc category deleted' })
  async deleteDocCategory(@Param('id') id: string) {
    return this.service.deleteDocCategory(id);
  }

  @Get('docs/pages')
  @ApiOperation({ summary: 'Search and list documentation pages' })
  @ApiResponse({ status: 200, description: 'Paginated list of documentation pages' })
  async getDocPages(
    @Query() query: DocQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.service.findAllDocPages(query, user);
  }

  @Post('docs/pages')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create documentation page' })
  @ApiResponse({ status: 201, description: 'Doc page created' })
  async createDocPage(
    @Body() dto: CreateDocPageDto,
    @CurrentUser() user: any,
  ) {
    return this.service.createDocPage(dto, user);
  }

  @Get('docs/pages/:id')
  @ApiOperation({ summary: 'Get documentation page details' })
  @ApiParam({ name: 'id', description: 'Page UUID' })
  @ApiResponse({ status: 200, description: 'Doc page details' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async getDocPageById(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.service.findDocPageById(id, user);
  }

  @Patch('docs/pages/:id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update documentation page' })
  @ApiParam({ name: 'id', description: 'Page UUID' })
  @ApiResponse({ status: 200, description: 'Doc page updated' })
  async updateDocPage(
    @Param('id') id: string,
    @Body() dto: UpdateDocPageDto,
  ) {
    return this.service.updateDocPage(id, dto);
  }

  @Delete('docs/pages/:id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Delete documentation page' })
  @ApiParam({ name: 'id', description: 'Page UUID' })
  @ApiResponse({ status: 200, description: 'Doc page deleted' })
  async deleteDocPage(@Param('id') id: string) {
    return this.service.deleteDocPage(id);
  }

  // ==========================================
  // 3. FAQS
  // ==========================================

  @Get('faqs')
  @ApiOperation({ summary: 'List and search frequently asked questions' })
  @ApiResponse({ status: 200, description: 'Paginated list of FAQs' })
  async getFaqs(
    @Query() query: FaqQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.service.findAllFaqs(query, user);
  }

  @Post('faqs')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a new FAQ (Admin/Manager)' })
  @ApiResponse({ status: 201, description: 'FAQ created' })
  async createFaq(
    @Body() dto: CreateFaqDto,
    @CurrentUser() user: any,
  ) {
    return this.service.createFaq(dto, user);
  }

  @Get('faqs/:id')
  @ApiOperation({ summary: 'Get FAQ details by ID' })
  @ApiParam({ name: 'id', description: 'FAQ UUID' })
  @ApiResponse({ status: 200, description: 'FAQ details' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  async getFaqById(@Param('id') id: string) {
    return this.service.findFaqById(id);
  }

  @Patch('faqs/:id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update FAQ' })
  @ApiParam({ name: 'id', description: 'FAQ UUID' })
  @ApiResponse({ status: 200, description: 'FAQ updated' })
  async updateFaq(
    @Param('id') id: string,
    @Body() dto: UpdateFaqDto,
  ) {
    return this.service.updateFaq(id, dto);
  }

  @Delete('faqs/:id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Delete FAQ' })
  @ApiParam({ name: 'id', description: 'FAQ UUID' })
  @ApiResponse({ status: 200, description: 'FAQ deleted' })
  async deleteFaq(@Param('id') id: string) {
    return this.service.deleteFaq(id);
  }

  // ==========================================
  // 4. CONTACT SUPPORT & TICKET MANAGEMENT
  // ==========================================

  @Post('tickets')
  @ApiOperation({ summary: 'Create support request ticket' })
  @ApiResponse({ status: 201, description: 'Support ticket created successfully' })
  async createTicket(
    @Body() dto: CreateSupportTicketDto,
    @CurrentUser() user: any,
  ) {
    return this.service.createSupportTicket(dto, user);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'List support tickets (Normal users see own; Admins see all)' })
  @ApiResponse({ status: 200, description: 'Paginated list of support tickets' })
  async getTickets(
    @Query() query: TicketQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.service.findAllTickets(query, user);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get ticket details with thread messages and history' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket details (internal staff notes filtered for normal users)' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async getTicketById(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.service.findTicketById(id, user);
  }

  @Patch('tickets/:id/status')
  @ApiOperation({ summary: 'Update ticket status (Admin/Support, or ticket owner resolving/closing)' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket status updated' })
  async updateTicketStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateTicketStatus(id, dto, user);
  }

  @Patch('tickets/:id/assign')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Assign ticket to support agent or admin' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket assigned' })
  async assignTicket(
    @Param('id') id: string,
    @Body() dto: AssignTicketDto,
    @CurrentUser() user: any,
  ) {
    return this.service.assignTicket(id, dto, user);
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Add reply message to ticket thread (supports staff internal notes)' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 201, description: 'Message added to ticket' })
  async addTicketMessage(
    @Param('id') id: string,
    @Body() dto: AddTicketMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.service.addTicketMessage(id, dto, user);
  }

  // ==========================================
  // 5. FEEDBACK
  // ==========================================

  @Post('feedback')
  @ApiOperation({ summary: 'Submit product feedback or rating' })
  @ApiResponse({ status: 201, description: 'Feedback submitted' })
  async submitFeedback(
    @Body() dto: SubmitFeedbackDto,
    @CurrentUser() user: any,
  ) {
    return this.service.submitFeedback(dto, user);
  }

  @Get('feedback')
  @ApiOperation({ summary: 'List user feedback entries (Admin notes filtered for regular users)' })
  @ApiResponse({ status: 200, description: 'Paginated list of feedback' })
  async getFeedback(
    @Query() query: FeedbackQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.service.findAllFeedback(query, user);
  }

  @Get('feedback/:id')
  @ApiOperation({ summary: 'Get feedback details by ID' })
  @ApiParam({ name: 'id', description: 'Feedback UUID' })
  @ApiResponse({ status: 200, description: 'Feedback details' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  async getFeedbackById(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.service.findFeedbackById(id, user);
  }

  @Patch('feedback/:id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update feedback status and admin internal notes (Admin only)' })
  @ApiParam({ name: 'id', description: 'Feedback UUID' })
  @ApiResponse({ status: 200, description: 'Feedback updated' })
  async updateFeedback(
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateFeedback(id, dto, user);
  }
}
