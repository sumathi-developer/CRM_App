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
  ApiQuery,
} from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagQueryDto } from './dto/tag-query.dto';
import { AttachTagsDto } from './dto/attach-tags.dto';
import { DetachTagsDto } from './dto/detach-tags.dto';
import { BulkTagAssignDto } from './dto/bulk-tag-assign.dto';
import { BulkTagDetachDto } from './dto/bulk-tag-detach.dto';
import { TagEntityType } from './enums/tag-entity-type.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Tags')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  // ==========================================
  // Tag CRUD & Usage Summary
  // ==========================================

  @Post()
  @ApiOperation({ summary: 'Create a new tag within a workspace' })
  @ApiResponse({ status: 201, description: 'Tag created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or empty tag name' })
  @ApiResponse({ status: 409, description: 'Tag name already exists in this workspace' })
  async create(@Body() createTagDto: CreateTagDto, @CurrentUser() user: any) {
    return this.tagsService.create(createTagDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List all tags with search, filtering, and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of tags with usage counts' })
  async findAll(@Query() query: TagQueryDto, @CurrentUser() user: any) {
    return this.tagsService.findAll(query, user);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get global tag usage statistics across CRM entities' })
  @ApiQuery({
    name: 'workspaceId',
    required: false,
    description: 'Filter usage statistics by workspace ID',
  })
  @ApiResponse({ status: 200, description: 'Tag usage summary breakdown and top tags' })
  async getGlobalUsageSummary(@Query('workspaceId') workspaceId?: string) {
    return this.tagsService.getGlobalUsageSummary(workspaceId);
  }

  // ==========================================
  // Bulk Entity Tagging
  // ==========================================

  @Post('bulk-assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk assign tags to multiple CRM entities' })
  @ApiResponse({ status: 200, description: 'Tags assigned to entities successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or entity type' })
  async bulkAssign(@Body() dto: BulkTagAssignDto, @CurrentUser() user: any) {
    return this.tagsService.bulkAssign(dto, user);
  }

  @Post('bulk-detach')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk remove tags from multiple CRM entities' })
  @ApiResponse({ status: 200, description: 'Tags detached from entities successfully' })
  async bulkDetach(@Body() dto: BulkTagDetachDto) {
    return this.tagsService.bulkDetach(dto);
  }

  // ==========================================
  // Entity-Specific Tagging (Leads, Contacts, Companies, Deals, Activities, Documents)
  // ==========================================

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get all tags attached to a specific CRM entity' })
  @ApiParam({
    name: 'entityType',
    enum: TagEntityType,
    description: 'Target CRM entity type (LEAD, CONTACT, COMPANY, DEAL, ACTIVITY, DOCUMENT)',
  })
  @ApiParam({ name: 'entityId', description: 'Target entity UUID' })
  @ApiResponse({ status: 200, description: 'List of tags attached to the entity' })
  @ApiResponse({ status: 404, description: 'Target entity not found' })
  async getEntityTags(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.tagsService.getEntityTags(entityType, entityId);
  }

  @Post('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Attach tags to a specific CRM entity' })
  @ApiParam({
    name: 'entityType',
    enum: TagEntityType,
    description: 'Target CRM entity type (LEAD, CONTACT, COMPANY, DEAL, ACTIVITY, DOCUMENT)',
  })
  @ApiParam({ name: 'entityId', description: 'Target entity UUID' })
  @ApiResponse({ status: 201, description: 'Tags attached successfully to the entity' })
  @ApiResponse({ status: 400, description: 'Invalid tag input or archived tag' })
  @ApiResponse({ status: 404, description: 'Entity or tag not found' })
  async attachTags(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body() dto: AttachTagsDto,
    @CurrentUser() user: any,
  ) {
    return this.tagsService.attachTags(entityType, entityId, dto, user);
  }

  @Delete('entity/:entityType/:entityId/:tagId')
  @ApiOperation({ summary: 'Remove a specific tag from a CRM entity' })
  @ApiParam({
    name: 'entityType',
    enum: TagEntityType,
    description: 'Target CRM entity type (LEAD, CONTACT, COMPANY, DEAL, ACTIVITY, DOCUMENT)',
  })
  @ApiParam({ name: 'entityId', description: 'Target entity UUID' })
  @ApiParam({ name: 'tagId', description: 'Tag UUID to detach' })
  @ApiResponse({ status: 200, description: 'Tag removed from entity' })
  @ApiResponse({ status: 404, description: 'Entity or tag assignment not found' })
  async detachTag(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Param('tagId') tagId: string,
  ) {
    return this.tagsService.detachTag(entityType, entityId, tagId);
  }

  @Post('entity/:entityType/:entityId/detach')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove multiple tags from a CRM entity' })
  @ApiParam({
    name: 'entityType',
    enum: TagEntityType,
    description: 'Target CRM entity type (LEAD, CONTACT, COMPANY, DEAL, ACTIVITY, DOCUMENT)',
  })
  @ApiParam({ name: 'entityId', description: 'Target entity UUID' })
  @ApiResponse({ status: 200, description: 'Tags detached from entity' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async detachTags(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body() dto: DetachTagsDto,
  ) {
    return this.tagsService.detachTags(entityType, entityId, dto);
  }

  // ==========================================
  // Single Tag Management
  // ==========================================

  @Get(':id')
  @ApiOperation({ summary: 'Get tag details by ID' })
  @ApiParam({ name: 'id', description: 'Tag UUID' })
  @ApiResponse({ status: 200, description: 'Tag details with usage count' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async findOne(@Param('id') id: string) {
    return this.tagsService.findOne(id);
  }

  @Get(':id/usage')
  @ApiOperation({ summary: 'Get detailed usage statistics and recent entities for a tag' })
  @ApiParam({ name: 'id', description: 'Tag UUID' })
  @ApiResponse({ status: 200, description: 'Usage breakdown by entity type and recent assignments' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async getTagUsage(@Param('id') id: string) {
    return this.tagsService.getTagUsage(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit tag (name, color, description, status, protection)' })
  @ApiParam({ name: 'id', description: 'Tag UUID' })
  @ApiResponse({ status: 200, description: 'Tag updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or empty tag name' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  @ApiResponse({ status: 409, description: 'Updated name conflicts with an existing tag in workspace' })
  async update(
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto,
    @CurrentUser() user: any,
  ) {
    return this.tagsService.update(id, updateTagDto, user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete tag (prevents deleting protected tags; safe archiving or force delete)',
  })
  @ApiParam({ name: 'id', description: 'Tag UUID' })
  @ApiQuery({
    name: 'hardDelete',
    required: false,
    type: Boolean,
    description: 'Permanently remove tag from database (default: false archives tag safely)',
  })
  @ApiQuery({
    name: 'force',
    required: false,
    type: Boolean,
    description: 'If hardDelete=true and tag has active entity assignments, force=true allows detachment',
  })
  @ApiResponse({ status: 200, description: 'Tag archived or deleted safely' })
  @ApiResponse({ status: 400, description: 'Tag has active relationships and force is false' })
  @ApiResponse({ status: 403, description: 'Protected tag cannot be deleted' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async remove(
    @Param('id') id: string,
    @Query('hardDelete') hardDelete?: string,
    @Query('force') force?: string,
  ) {
    const isHard = hardDelete === 'true';
    const isForced = force === 'true';
    return this.tagsService.remove(id, isHard, isForced);
  }
}
