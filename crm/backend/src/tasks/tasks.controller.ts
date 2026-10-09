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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Tasks')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List all tasks with pagination, priority, and entity filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of tasks' })
  async findAll(@Query() query: TaskQueryDto) {
    return this.tasksService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new CRM task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  async create(
    @Body() createDto: CreateTaskDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.tasksService.create(createDto, userId);
  }

  @Get('today')
  @ApiOperation({ summary: 'Get all tasks due today' })
  @ApiResponse({ status: 200, description: "Today's tasks" })
  async getToday(@CurrentUser('id') userId: string) {
    return this.tasksService.getToday(userId);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming open tasks' })
  @ApiResponse({ status: 200, description: 'Upcoming tasks' })
  async getUpcoming(@CurrentUser('id') userId: string) {
    return this.tasksService.getUpcoming(userId);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue tasks that missed due date' })
  @ApiResponse({ status: 200, description: 'Overdue tasks' })
  async getOverdue(@CurrentUser('id') userId: string) {
    return this.tasksService.getOverdue(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task details by ID' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiResponse({ status: 200, description: 'Task details' })
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task information' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiResponse({ status: 200, description: 'Task updated' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a task by ID' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiResponse({ status: 200, description: 'Task deleted' })
  async remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Quick action: mark task as completed' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiResponse({ status: 200, description: 'Task marked as completed' })
  async markComplete(@Param('id') id: string) {
    return this.tasksService.markComplete(id);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Reassign task to another team member' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiResponse({ status: 200, description: 'Task reassigned' })
  async assign(@Param('id') id: string, @Body() dto: AssignTaskDto) {
    return this.tasksService.assign(id, dto.assignedToId);
  }
}
