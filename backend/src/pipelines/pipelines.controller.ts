import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PipelinesService } from './pipelines.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { UpdatePipelineDto } from './dto/update-pipeline.dto';
import { CreatePipelineStageDto } from './dto/create-stage.dto';
import { UpdatePipelineStageDto } from './dto/update-stage.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Pipelines & Stages')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pipelines')
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Get()
  @ApiOperation({ summary: 'List all sales pipelines with their ordered stages' })
  @ApiResponse({ status: 200, description: 'List of pipelines' })
  async findAll() {
    return this.pipelinesService.findAll();
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a new sales pipeline' })
  @ApiResponse({ status: 201, description: 'Pipeline created' })
  async create(@Body() createDto: CreatePipelineDto) {
    return this.pipelinesService.create(createDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pipeline details by ID with stages' })
  @ApiParam({ name: 'id', description: 'Pipeline UUID' })
  @ApiResponse({ status: 200, description: 'Pipeline details' })
  async findOne(@Param('id') id: string) {
    return this.pipelinesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update pipeline details' })
  @ApiParam({ name: 'id', description: 'Pipeline UUID' })
  @ApiResponse({ status: 200, description: 'Pipeline updated' })
  async update(@Param('id') id: string, @Body() updateDto: UpdatePipelineDto) {
    return this.pipelinesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete pipeline by ID' })
  @ApiParam({ name: 'id', description: 'Pipeline UUID' })
  @ApiResponse({ status: 200, description: 'Pipeline deleted' })
  async remove(@Param('id') id: string) {
    return this.pipelinesService.remove(id);
  }

  @Get(':id/stages')
  @ApiOperation({ summary: 'List all stages in a pipeline' })
  @ApiParam({ name: 'id', description: 'Pipeline UUID' })
  @ApiResponse({ status: 200, description: 'List of stages' })
  async getStages(@Param('id') id: string) {
    return this.pipelinesService.getStages(id);
  }

  @Post(':id/stages')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Add a new stage to a pipeline' })
  @ApiParam({ name: 'id', description: 'Pipeline UUID' })
  @ApiResponse({ status: 201, description: 'Stage added' })
  async createStage(
    @Param('id') id: string,
    @Body() dto: CreatePipelineStageDto,
  ) {
    return this.pipelinesService.createStage(id, dto);
  }

  @Patch(':id/stages/:stageId')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update an existing stage in a pipeline' })
  @ApiParam({ name: 'id', description: 'Pipeline UUID' })
  @ApiParam({ name: 'stageId', description: 'Stage UUID' })
  @ApiResponse({ status: 200, description: 'Stage updated' })
  async updateStage(
    @Param('id') id: string,
    @Param('stageId') stageId: string,
    @Body() dto: UpdatePipelineStageDto,
  ) {
    return this.pipelinesService.updateStage(id, stageId, dto);
  }
}
