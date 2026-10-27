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
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CustomFieldsService } from './services/custom-fields.service';
import { CustomFieldValuesService } from './services/custom-field-values.service';
import { CustomFieldTypeMigrationService } from './services/custom-field-type-migration.service';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
import { CustomFieldQueryDto } from './dto/custom-field-query.dto';
import { CreateFieldOptionDto } from './dto/create-field-option.dto';
import { UpdateFieldOptionDto } from './dto/update-field-option.dto';
import { ReorderOptionsDto } from './dto/reorder-options.dto';
import { ReorderFieldsDto } from './dto/reorder-fields.dto';
import { ChangeFieldTypeDto } from './dto/change-field-type.dto';
import { SetCustomFieldValuesDto } from './dto/set-custom-field-values.dto';
import { FilterEntitiesByCustomFieldsDto } from './dto/filter-entities-by-custom-fields.dto';
import { CustomFieldEntityType } from './enums/custom-field-entity-type.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Custom Fields')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('custom-fields')
export class CustomFieldsController {
  constructor(
    private readonly customFieldsService: CustomFieldsService,
    private readonly customFieldValuesService: CustomFieldValuesService,
    private readonly typeMigrationService: CustomFieldTypeMigrationService,
  ) {}

  // ==========================================
  // Custom Field CRUD
  // ==========================================

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a new custom field definition' })
  @ApiResponse({ status: 201, description: 'Custom field created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or missing options' })
  @ApiResponse({ status: 409, description: 'Field key already exists for this entity' })
  async create(@Body() createDto: CreateCustomFieldDto, @CurrentUser() user: any) {
    return this.customFieldsService.create(createDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List custom fields with filtering, search, and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of custom fields' })
  async findAll(@Query() query: CustomFieldQueryDto, @CurrentUser() user: any) {
    return this.customFieldsService.findAll(query, user);
  }

  @Get('layout/:entityType')
  @ApiOperation({ summary: 'Get dynamic form layout and schema for a CRM entity type' })
  @ApiParam({
    name: 'entityType',
    enum: CustomFieldEntityType,
    description: 'Target CRM entity type (LEAD, CONTACT, COMPANY, DEAL, ACTIVITY)',
  })
  @ApiQuery({
    name: 'workspaceId',
    required: false,
    description: 'Workspace isolation UUID',
  })
  @ApiResponse({ status: 200, description: 'Structured layout with ordered sections and fields' })
  async getLayout(
    @Param('entityType') entityType: CustomFieldEntityType,
    @CurrentUser() user: any,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.customFieldsService.getLayout(entityType, user, workspaceId);
  }

  @Post('layout/reorder')
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder fields and organize layout sections' })
  @ApiResponse({ status: 200, description: 'Fields reordered successfully' })
  async reorderFields(@Body() dto: ReorderFieldsDto) {
    return this.customFieldsService.reorderFields(dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search across all searchable custom field values' })
  @ApiQuery({ name: 'q', description: 'Search term', required: true })
  @ApiQuery({ name: 'entityType', enum: CustomFieldEntityType, required: false })
  @ApiQuery({ name: 'workspaceId', required: false })
  @ApiResponse({ status: 200, description: 'List of matching records' })
  async searchCustomFieldValues(
    @Query('q') query: string,
    @Query('entityType') entityType?: CustomFieldEntityType,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.customFieldValuesService.searchCustomFieldValues(query, entityType, workspaceId);
  }

  @Post('filter')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Filter CRM entities by custom field conditions' })
  @ApiResponse({ status: 200, description: 'Paginated matching entities with custom fields' })
  async filterEntities(
    @Body() dto: FilterEntitiesByCustomFieldsDto,
    @CurrentUser() user: any,
  ) {
    return this.customFieldValuesService.filterEntities(dto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get custom field definition details by ID' })
  @ApiParam({ name: 'id', description: 'Custom field UUID' })
  @ApiResponse({ status: 200, description: 'Custom field details' })
  @ApiResponse({ status: 404, description: 'Custom field not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.customFieldsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update custom field configuration' })
  @ApiParam({ name: 'id', description: 'Custom field UUID' })
  @ApiResponse({ status: 200, description: 'Custom field updated' })
  @ApiResponse({ status: 404, description: 'Custom field not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCustomFieldDto,
    @CurrentUser() user: any,
  ) {
    return this.customFieldsService.update(id, updateDto, user);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Archive (soft-delete) or permanently delete a custom field' })
  @ApiParam({ name: 'id', description: 'Custom field UUID' })
  @ApiQuery({
    name: 'hardDelete',
    required: false,
    type: Boolean,
    description: 'Permanently remove field and all stored values (default: false)',
  })
  @ApiResponse({ status: 200, description: 'Custom field archived or deleted' })
  async remove(
    @Param('id') id: string,
    @Query('hardDelete') hardDelete?: string,
  ) {
    const isHard = hardDelete === 'true';
    return this.customFieldsService.remove(id, isHard);
  }

  // ==========================================
  // Field Type Migration (Safe, Lossless)
  // ==========================================

  @Post(':id/change-type/preview')
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview field type migration and verify data compatibility without modifying data' })
  @ApiParam({ name: 'id', description: 'Custom field UUID' })
  @ApiResponse({ status: 200, description: 'Migration preview analysis and compatibility report' })
  async previewTypeChange(
    @Param('id') id: string,
    @Body() dto: ChangeFieldTypeDto,
  ) {
    return this.typeMigrationService.previewTypeChange(
      id,
      dto.targetType,
      dto.strategy,
      dto.newOptions,
    );
  }

  @Post(':id/change-type')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Safely change field type and convert existing values without data corruption' })
  @ApiParam({ name: 'id', description: 'Custom field UUID' })
  @ApiResponse({ status: 200, description: 'Field type migrated successfully with audit history' })
  @ApiResponse({ status: 400, description: 'Incompatible conversion without force=true' })
  async changeType(
    @Param('id') id: string,
    @Body() dto: ChangeFieldTypeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.typeMigrationService.executeTypeChange(
      id,
      dto.targetType,
      dto.strategy,
      dto.force,
      dto.newOptions,
      userId,
    );
  }

  // ==========================================
  // Field Options Management
  // ==========================================

  @Get(':id/options')
  @ApiOperation({ summary: 'List options for a dropdown, multi-select, or radio custom field' })
  @ApiParam({ name: 'id', description: 'Custom field UUID' })
  @ApiResponse({ status: 200, description: 'List of options' })
  async getOptions(@Param('id') id: string) {
    return this.customFieldsService.getOptions(id);
  }

  @Post(':id/options')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Add a new option to a custom field' })
  @ApiParam({ name: 'id', description: 'Custom field UUID' })
  @ApiResponse({ status: 201, description: 'Option added successfully' })
  @ApiResponse({ status: 400, description: 'Field does not support options' })
  @ApiResponse({ status: 404, description: 'Custom field not found' })
  @ApiResponse({ status: 409, description: 'Option value already exists' })
  async addOption(@Param('id') id: string, @Body() dto: CreateFieldOptionDto) {
    return this.customFieldsService.addOption(id, dto);
  }

  @Patch(':id/options/:optionId')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update an existing field option' })
  @ApiParam({ name: 'id', description: 'Custom field UUID' })
  @ApiParam({ name: 'optionId', description: 'Option UUID' })
  @ApiResponse({ status: 200, description: 'Option updated' })
  async updateOption(
    @Param('id') id: string,
    @Param('optionId') optionId: string,
    @Body() dto: UpdateFieldOptionDto,
  ) {
    return this.customFieldsService.updateOption(id, optionId, dto);
  }

  @Delete(':id/options/:optionId')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Delete a field option' })
  @ApiParam({ name: 'id', description: 'Custom field UUID' })
  @ApiParam({ name: 'optionId', description: 'Option UUID' })
  @ApiResponse({ status: 200, description: 'Option deleted' })
  async deleteOption(@Param('id') id: string, @Param('optionId') optionId: string) {
    return this.customFieldsService.deleteOption(id, optionId);
  }

  @Post(':id/options/reorder')
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder options for a custom field' })
  @ApiParam({ name: 'id', description: 'Custom field UUID' })
  @ApiResponse({ status: 200, description: 'Options reordered' })
  async reorderOptions(@Param('id') id: string, @Body() dto: ReorderOptionsDto) {
    return this.customFieldsService.reorderOptions(id, dto);
  }

  // ==========================================
  // Generic Entity Value Handling (Leads, Contacts, Companies, Deals, Activities)
  // ==========================================

  @Get('values/:entityType/:entityId')
  @ApiOperation({ summary: 'Get all custom field values and form schema for a specific CRM entity' })
  @ApiParam({
    name: 'entityType',
    enum: CustomFieldEntityType,
    description: 'Target CRM entity (LEAD, CONTACT, COMPANY, DEAL, ACTIVITY)',
  })
  @ApiParam({ name: 'entityId', description: 'Entity UUID' })
  @ApiQuery({
    name: 'workspaceId',
    required: false,
    description: 'Workspace isolation UUID',
  })
  @ApiResponse({ status: 200, description: 'Entity custom field values with layout schema' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async getEntityValues(
    @Param('entityType') entityType: CustomFieldEntityType,
    @Param('entityId') entityId: string,
    @CurrentUser() user: any,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.customFieldValuesService.getEntityValues(entityType, entityId, user, workspaceId);
  }

  @Put('values/:entityType/:entityId')
  @ApiOperation({ summary: 'Set or update custom field values for an entity with validation' })
  @ApiParam({
    name: 'entityType',
    enum: CustomFieldEntityType,
    description: 'Target CRM entity (LEAD, CONTACT, COMPANY, DEAL, ACTIVITY)',
  })
  @ApiParam({ name: 'entityId', description: 'Entity UUID' })
  @ApiResponse({ status: 200, description: 'Custom field values updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed for one or more fields' })
  @ApiResponse({ status: 403, description: 'User does not have permission to edit one or more fields' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async setEntityValues(
    @Param('entityType') entityType: CustomFieldEntityType,
    @Param('entityId') entityId: string,
    @Body() dto: SetCustomFieldValuesDto,
    @CurrentUser() user: any,
  ) {
    return this.customFieldValuesService.setEntityValues(entityType, entityId, dto, user);
  }

  @Delete('values/:entityType/:entityId')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Clear all custom field values for an entity' })
  @ApiParam({
    name: 'entityType',
    enum: CustomFieldEntityType,
    description: 'Target CRM entity (LEAD, CONTACT, COMPANY, DEAL, ACTIVITY)',
  })
  @ApiParam({ name: 'entityId', description: 'Entity UUID' })
  @ApiResponse({ status: 200, description: 'Values cleared' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async clearEntityValues(
    @Param('entityType') entityType: CustomFieldEntityType,
    @Param('entityId') entityId: string,
  ) {
    return this.customFieldValuesService.clearEntityValues(entityType, entityId);
  }

  @Delete('values/:entityType/:entityId/:fieldKey')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Clear a single custom field value for an entity' })
  @ApiParam({
    name: 'entityType',
    enum: CustomFieldEntityType,
    description: 'Target CRM entity (LEAD, CONTACT, COMPANY, DEAL, ACTIVITY)',
  })
  @ApiParam({ name: 'entityId', description: 'Entity UUID' })
  @ApiParam({ name: 'fieldKey', description: 'Field key or UUID to clear' })
  @ApiResponse({ status: 200, description: 'Field value cleared' })
  @ApiResponse({ status: 404, description: 'Field or entity not found' })
  async clearSingleFieldValue(
    @Param('entityType') entityType: CustomFieldEntityType,
    @Param('entityId') entityId: string,
    @Param('fieldKey') fieldKey: string,
  ) {
    return this.customFieldValuesService.clearSingleFieldValue(entityType, entityId, fieldKey);
  }
}
