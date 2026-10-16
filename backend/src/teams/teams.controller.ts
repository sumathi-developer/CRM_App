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
} from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamQueryDto } from './dto/team-query.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { TeamActivitiesQueryDto } from './dto/team-activities-query.dto';
import { TeamPerformanceQueryDto } from './dto/team-performance-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Teams')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  // ==========================================
  // 1. ALL TEAMS & TEAM CRUD
  // ==========================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new team' })
  @ApiResponse({ status: 201, description: 'Team created successfully' })
  async create(
    @Body() dto: CreateTeamDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all teams with pagination, search, status, and member counts' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of teams' })
  async findAll(@Query() query: TeamQueryDto) {
    return this.teamsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team details by ID or slug' })
  @ApiParam({ name: 'id', description: 'Team UUID or slug' })
  @ApiResponse({ status: 200, description: 'Returns team details with members and resource counts' })
  async findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit team metadata, owner, and targets' })
  @ApiParam({ name: 'id', description: 'Team UUID or slug' })
  @ApiResponse({ status: 200, description: 'Team updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTeamDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: any,
  ) {
    const roleName = typeof userRole === 'string' ? userRole : userRole?.name;
    return this.teamsService.update(id, dto, userId, roleName);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a team and unset team association on related records' })
  @ApiParam({ name: 'id', description: 'Team UUID or slug' })
  @ApiResponse({ status: 200, description: 'Team deleted successfully' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: any,
  ) {
    const roleName = typeof userRole === 'string' ? userRole : userRole?.name;
    return this.teamsService.remove(id, userId, roleName);
  }

  // ==========================================
  // 2. TEAM MEMBERS
  // ==========================================

  @Get(':id/members')
  @ApiOperation({ summary: 'List all members belonging to a team' })
  @ApiParam({ name: 'id', description: 'Team UUID or slug' })
  @ApiResponse({ status: 200, description: 'List of team members' })
  async getMembers(@Param('id') id: string) {
    return this.teamsService.getMembers(id);
  }

  @Get(':id/members/:memberId')
  @ApiOperation({ summary: 'Get a specific team member by memberId or userId' })
  @ApiParam({ name: 'id', description: 'Team UUID or slug' })
  @ApiParam({ name: 'memberId', description: 'TeamMember UUID or User UUID' })
  @ApiResponse({ status: 200, description: 'Team member details' })
  async getMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.teamsService.getMember(id, memberId);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add an existing user to the team' })
  @ApiParam({ name: 'id', description: 'Team UUID or slug' })
  @ApiResponse({ status: 201, description: 'Member added to team successfully' })
  async addMember(
    @Param('id') id: string,
    @Body() dto: AddTeamMemberDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: any,
  ) {
    const roleName = typeof userRole === 'string' ? userRole : userRole?.name;
    return this.teamsService.addMember(id, dto, userId, roleName);
  }

  @Patch(':id/members/:memberId')
  @ApiOperation({ summary: 'Update a team member role (LEADER or MEMBER)' })
  @ApiParam({ name: 'id', description: 'Team UUID or slug' })
  @ApiParam({ name: 'memberId', description: 'TeamMember UUID or User UUID' })
  @ApiResponse({ status: 200, description: 'Team member role updated' })
  async updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateTeamMemberDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: any,
  ) {
    const roleName = typeof userRole === 'string' ? userRole : userRole?.name;
    return this.teamsService.updateMemberRole(id, memberId, dto, userId, roleName);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove a member from the team' })
  @ApiParam({ name: 'id', description: 'Team UUID or slug' })
  @ApiParam({ name: 'memberId', description: 'TeamMember UUID or User UUID' })
  @ApiResponse({ status: 200, description: 'Member removed from team successfully' })
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: any,
  ) {
    const roleName = typeof userRole === 'string' ? userRole : userRole?.name;
    return this.teamsService.removeMember(id, memberId, userId, roleName);
  }

  // ==========================================
  // 3. TEAM ACTIVITIES
  // ==========================================

  @Get(':id/activities')
  @ApiOperation({ summary: 'Get unified team activities with status/type breakdowns' })
  @ApiParam({ name: 'id', description: 'Team UUID or slug' })
  @ApiResponse({ status: 200, description: 'Team activities list and breakdown metrics' })
  async getTeamActivities(
    @Param('id') id: string,
    @Query() query: TeamActivitiesQueryDto,
  ) {
    return this.teamsService.getTeamActivities(id, query);
  }

  // ==========================================
  // 4. TEAM PERFORMANCE & METRICS
  // ==========================================

  @Get(':id/performance')
  @ApiOperation({
    summary:
      'Get comprehensive team performance metrics (Leads, Deals, Won, Revenue, Conversion, Top Performers)',
  })
  @ApiParam({ name: 'id', description: 'Team UUID or slug' })
  @ApiResponse({ status: 200, description: 'Real-time team performance metrics' })
  async getTeamPerformance(
    @Param('id') id: string,
    @Query() query: TeamPerformanceQueryDto,
  ) {
    return this.teamsService.getTeamPerformance(id, query);
  }
}
