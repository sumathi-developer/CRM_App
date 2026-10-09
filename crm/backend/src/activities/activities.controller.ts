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
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Activities')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @ApiOperation({ summary: 'List all activities with type, status, and target entity filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of activities' })
  async findAll(@Query() query: ActivityQueryDto) {
    return this.activitiesService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Log a new activity (CALL, EMAIL, MEETING, WHATSAPP, FOLLOW_UP)' })
  @ApiResponse({ status: 201, description: 'Activity created' })
  async create(
    @Body() createDto: CreateActivityDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.activitiesService.create(createDto, userId);
  }

  @Get('today')
  @ApiOperation({ summary: 'Get all activities scheduled for today' })
  @ApiResponse({ status: 200, description: "Today's activities" })
  async getToday(@CurrentUser('id') userId: string) {
    return this.activitiesService.getToday(userId);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get future upcoming pending activities' })
  @ApiResponse({ status: 200, description: 'Upcoming activities' })
  async getUpcoming(@CurrentUser('id') userId: string) {
    return this.activitiesService.getUpcoming(userId);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get past due / overdue activities' })
  @ApiResponse({ status: 200, description: 'Overdue activities' })
  async getOverdue(@CurrentUser('id') userId: string) {
    return this.activitiesService.getOverdue(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get activity details by ID' })
  @ApiParam({ name: 'id', description: 'Activity UUID' })
  @ApiResponse({ status: 200, description: 'Activity details' })
  async findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an activity' })
  @ApiParam({ name: 'id', description: 'Activity UUID' })
  @ApiResponse({ status: 200, description: 'Activity updated' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an activity by ID' })
  @ApiParam({ name: 'id', description: 'Activity UUID' })
  @ApiResponse({ status: 200, description: 'Activity deleted' })
  async remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }
}
