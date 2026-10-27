import {
  Controller,
  Get,
  Post,
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
import { type Request } from 'express';
import { AuditLogsService } from './audit-logs.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { ExportAuditLogsDto } from './dto/export-audit-logs.dto';
import { AuditLogCleanupDto } from './dto/audit-log-cleanup.dto';
import { AuditEntityType } from './enums/audit-entity-type.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Audit Logs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Post()
  @ApiOperation({ summary: 'Record a new audit log entry' })
  @ApiResponse({ status: 201, description: 'Audit log recorded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(
    @Body() dto: CreateAuditLogDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.auditLogsService.create(dto, user, req);
  }

  @Get()
  @ApiOperation({ summary: 'List audit logs with search, filters, and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of audit logs' })
  async findAll(@Query() query: AuditLogQueryDto, @CurrentUser() user: any) {
    return this.auditLogsService.findAll(query, user);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get audit log analytics, activity breakdown, and top users' })
  @ApiQuery({
    name: 'workspaceId',
    required: false,
    description: 'Filter analytics by workspace UUID',
  })
  @ApiResponse({ status: 200, description: 'Audit log statistics summary' })
  async getSummary(@Query('workspaceId') workspaceId?: string) {
    return this.auditLogsService.getSummary(workspaceId);
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export audit logs for compliance in JSON or RFC 4180 CSV format' })
  @ApiResponse({ status: 200, description: 'Exported audit log data or CSV string' })
  async exportLogs(
    @Body() dto: ExportAuditLogsDto,
    @CurrentUser() user: any,
  ) {
    return this.auditLogsService.exportLogs(dto, user);
  }

  @Delete('cleanup')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Purge old audit logs based on data retention policy (Admin only)' })
  @ApiResponse({ status: 200, description: 'Audit logs purged successfully' })
  @ApiResponse({ status: 400, description: 'Retention period less than 7 days' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  async cleanup(
    @Body() dto: AuditLogCleanupDto,
    @CurrentUser() user: any,
  ) {
    return this.auditLogsService.cleanup(dto, user);
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get chronological audit trail history for a specific CRM entity' })
  @ApiParam({
    name: 'entityType',
    enum: AuditEntityType,
    description: 'CRM entity type (LEAD, CONTACT, COMPANY, DEAL, ACTIVITY, etc.)',
  })
  @ApiParam({ name: 'entityId', description: 'Target entity UUID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum history entries to return (default: 50, max: 200)',
  })
  @ApiResponse({ status: 200, description: 'Entity audit history entries' })
  @ApiResponse({ status: 400, description: 'Missing entityType or entityId' })
  async getEntityAuditTrail(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query('limit') limit?: number,
  ) {
    return this.auditLogsService.getEntityAuditTrail(entityType, entityId, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed audit log entry by ID' })
  @ApiParam({ name: 'id', description: 'Audit log UUID' })
  @ApiResponse({ status: 200, description: 'Audit log details' })
  @ApiResponse({ status: 404, description: 'Audit log entry not found' })
  async findOne(@Param('id') id: string) {
    return this.auditLogsService.findOne(id);
  }
}
