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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { LeadQueryDto } from './dto/lead-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Leads')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'List all leads with pagination, search, status, and source filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of leads' })
  async findAll(@Query() query: LeadQueryDto) {
    return this.leadsService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  @ApiResponse({ status: 201, description: 'Lead created successfully' })
  async create(@Body() createDto: CreateLeadDto) {
    return this.leadsService.create(createDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead details by ID' })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({ status: 200, description: 'Lead details' })
  async findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lead details' })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({ status: 200, description: 'Lead updated' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateLeadDto) {
    return this.leadsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete lead by ID' })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({ status: 200, description: 'Lead deleted' })
  async remove(@Param('id') id: string) {
    return this.leadsService.remove(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update lead qualification status (NEW, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED)' })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateLeadStatusDto) {
    return this.leadsService.updateStatus(id, dto.status);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign lead to sales owner user' })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({ status: 200, description: 'Lead assigned' })
  async assign(@Param('id') id: string, @Body() dto: AssignLeadDto) {
    return this.leadsService.assign(id, dto.ownerId);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Convert lead into Contact, Company/Organization, and Sales Deal' })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({ status: 200, description: 'Lead converted successfully' })
  async convert(
    @Param('id') id: string,
    @Body() dto: ConvertLeadDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.leadsService.convert(id, dto, userId);
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'Get all activities associated with this lead' })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({ status: 200, description: 'Lead activities' })
  async getActivities(@Param('id') id: string) {
    return this.leadsService.getActivities(id);
  }

  @Get(':id/notes')
  @ApiOperation({ summary: 'Get all notes associated with this lead' })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({ status: 200, description: 'Lead notes' })
  async getNotes(@Param('id') id: string) {
    return this.leadsService.getNotes(id);
  }

  @Get(':id/tasks')
  @ApiOperation({ summary: 'Get all tasks associated with this lead' })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({ status: 200, description: 'Lead tasks' })
  async getTasks(@Param('id') id: string) {
    return this.leadsService.getTasks(id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get chronological activity and event timeline for this lead' })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({ status: 200, description: 'Lead timeline' })
  async getTimeline(@Param('id') id: string) {
    return this.leadsService.getTimeline(id);
  }
}
