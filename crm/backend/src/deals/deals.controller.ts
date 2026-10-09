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
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { UpdateDealStageDto } from './dto/update-deal-stage.dto';
import { AssignDealDto } from './dto/assign-deal.dto';
import { UpdateDealStatusDto } from './dto/update-deal-status.dto';
import { DealQueryDto } from './dto/deal-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Deals')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  @ApiOperation({ summary: 'List all deals with stage, pipeline, and status filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of deals' })
  async findAll(@Query() query: DealQueryDto) {
    return this.dealsService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new deal opportunity' })
  @ApiResponse({ status: 201, description: 'Deal created' })
  async create(@Body() createDto: CreateDealDto) {
    return this.dealsService.create(createDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal details by ID with linked contacts and stages' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal details' })
  async findOne(@Param('id') id: string) {
    return this.dealsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update deal information' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal updated' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateDealDto) {
    return this.dealsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete deal by ID' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal deleted' })
  async remove(@Param('id') id: string) {
    return this.dealsService.remove(id);
  }

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Move deal to a different pipeline stage' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal stage updated' })
  async updateStage(@Param('id') id: string, @Body() dto: UpdateDealStageDto) {
    return this.dealsService.updateStage(id, dto.stageId);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Reassign deal to an account owner user' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal assigned' })
  async assign(@Param('id') id: string, @Body() dto: AssignDealDto) {
    return this.dealsService.assign(id, dto.ownerId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update deal status (OPEN, WON, LOST)' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateDealStatusDto) {
    return this.dealsService.updateStatus(id, dto.status);
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'Get all activities related to this deal' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal activities' })
  async getActivities(@Param('id') id: string) {
    return this.dealsService.getActivities(id);
  }

  @Get(':id/notes')
  @ApiOperation({ summary: 'Get all notes attached to this deal' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal notes' })
  async getNotes(@Param('id') id: string) {
    return this.dealsService.getNotes(id);
  }

  @Get(':id/tasks')
  @ApiOperation({ summary: 'Get all tasks associated with this deal' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal tasks' })
  async getTasks(@Param('id') id: string) {
    return this.dealsService.getTasks(id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get chronological activity timeline for this deal' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal timeline' })
  async getTimeline(@Param('id') id: string) {
    return this.dealsService.getTimeline(id);
  }
}
