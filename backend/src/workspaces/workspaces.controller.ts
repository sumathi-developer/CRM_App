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
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceQueryDto } from './dto/workspace-query.dto';
import { SwitchWorkspaceDto } from './dto/switch-workspace.dto';
import { AddWorkspaceMemberDto } from './dto/add-member.dto';
import { UpdateWorkspaceMemberDto } from './dto/update-member.dto';
import { UpdateMemberStatusDto } from './dto/update-member-status.dto';
import { AssignMemberRoleDto } from './dto/assign-member-role.dto';
import { InviteWorkspaceMemberDto } from './dto/invite-workspace-member.dto';
import { AcceptWorkspaceInviteDto } from './dto/accept-invite.dto';
import { CreateWorkspaceRoleDto } from './dto/create-workspace-role.dto';
import { UpdateWorkspaceRoleDto } from './dto/update-workspace-role.dto';
import { UpdateWorkspaceSettingsDto } from './dto/update-workspace-settings.dto';
import { UpdateBrandingSettingsDto } from './dto/update-branding-settings.dto';
import { UpdateLocalizationSettingsDto } from './dto/update-localization-settings.dto';
import { UpdatePreferencesSettingsDto } from './dto/update-preferences-settings.dto';
import { UpdateSecuritySettingsDto } from './dto/update-security-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Workspaces')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  // ==========================================
  // 1. WORKSPACE MANAGEMENT & SWITCHER
  // ==========================================

  @Post()
  @ApiOperation({ summary: 'Create a new CRM workspace with default roles and settings' })
  @ApiResponse({ status: 201, description: 'Workspace created successfully' })
  async create(
    @Body() createDto: CreateWorkspaceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.create(createDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List workspaces with search, status/plan filters, and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of workspaces' })
  async findAll(@Query() query: WorkspaceQueryDto) {
    return this.workspacesService.findAll(query);
  }

  @Get('my-workspaces')
  @ApiOperation({ summary: 'List all workspaces the authenticated user belongs to with active indicator' })
  @ApiResponse({ status: 200, description: 'List of user workspaces' })
  async findMyWorkspaces(@CurrentUser('id') userId: string) {
    return this.workspacesService.findMyWorkspaces(userId);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get details of the currently active workspace for the user' })
  @ApiResponse({ status: 200, description: 'Current active workspace details' })
  async getCurrentWorkspace(@CurrentUser('id') userId: string) {
    return this.workspacesService.getCurrentWorkspace(userId);
  }

  @Post(':id/switch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch current workspace by ID or Slug' })
  @ApiParam({ name: 'id', description: 'Workspace UUID or Slug' })
  @ApiResponse({ status: 200, description: 'Switched workspace context' })
  async switchWorkspace(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.switchWorkspace(id, userId);
  }

  @Post('switch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch current workspace using body payload' })
  @ApiResponse({ status: 200, description: 'Switched workspace context' })
  async switchWorkspaceByBody(
    @Body() dto: SwitchWorkspaceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.switchWorkspace(dto.workspaceId, userId);
  }

  @Post('invitations/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a workspace invitation using an invitation token' })
  @ApiResponse({ status: 200, description: 'Invitation accepted and member added to workspace' })
  async acceptInvite(
    @Body() dto: AcceptWorkspaceInviteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.acceptInvite(dto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace details by ID or Slug (includes owner, members, roles, settings)' })
  @ApiParam({ name: 'id', description: 'Workspace UUID or Slug' })
  @ApiResponse({ status: 200, description: 'Workspace details' })
  async findOne(@Param('id') id: string) {
    return this.workspacesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workspace metadata, timezone, currency, plan, status' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Workspace updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateWorkspaceDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: any,
  ) {
    const roleName = typeof userRole === 'string' ? userRole : userRole?.name;
    return this.workspacesService.update(id, updateDto, userId, roleName);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete or archive a workspace' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Workspace deleted successfully' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: any,
  ) {
    const roleName = typeof userRole === 'string' ? userRole : userRole?.name;
    return this.workspacesService.remove(id, userId, roleName);
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Get workspace CRM metrics (members, contacts, deals, won revenue, tasks)' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Workspace metrics overview' })
  async getMetrics(@Param('id') id: string) {
    return this.workspacesService.getMetrics(id);
  }

  // ==========================================
  // 2. WORKSPACE MEMBERS
  // ==========================================

  @Get(':id/members')
  @ApiOperation({ summary: 'List all members in the workspace with roles and profiles' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'List of members' })
  async getMembers(@Param('id') id: string) {
    return this.workspacesService.getMembers(id);
  }

  @Get(':id/members/:memberId')
  @ApiOperation({ summary: 'Get single workspace member by ID or userId' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiParam({ name: 'memberId', description: 'WorkspaceMember UUID or User UUID' })
  @ApiResponse({ status: 200, description: 'Workspace member details' })
  async getMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.workspacesService.getMember(id, memberId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a user directly to the workspace' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiResponse({ status: 201, description: 'Member added to workspace' })
  async addMember(
    @Param('id') id: string,
    @Body() dto: AddWorkspaceMemberDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: any,
  ) {
    const roleName = typeof userRole === 'string' ? userRole : userRole?.name;
    return this.workspacesService.addMember(id, dto, userId, roleName);
  }

  @Patch(':id/members/:memberId')
  @ApiOperation({ summary: 'Update a member role, roleId, or status' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiParam({ name: 'memberId', description: 'WorkspaceMember UUID or User UUID' })
  @ApiResponse({ status: 200, description: 'Member updated successfully' })
  async updateMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateWorkspaceMemberDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: any,
  ) {
    const roleName = typeof userRole === 'string' ? userRole : userRole?.name;
    return this.workspacesService.updateMember(id, memberId, dto, userId, roleName);
  }

  @Patch(':id/members/:memberId/status')
  @ApiOperation({ summary: 'Activate or deactivate a workspace member' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiParam({ name: 'memberId', description: 'WorkspaceMember UUID or User UUID' })
  @ApiResponse({ status: 200, description: 'Member status updated' })
  async updateMemberStatus(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberStatusDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: any,
  ) {
    const roleName = typeof userRole === 'string' ? userRole : userRole?.name;
    return this.workspacesService.updateMemberStatus(id, memberId, dto.status, userId, roleName);
  }

  @Patch(':id/members/:memberId/role')
  @ApiOperation({ summary: 'Assign a workspace role to a member' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiParam({ name: 'memberId', description: 'WorkspaceMember UUID or User UUID' })
  @ApiResponse({ status: 200, description: 'Member role assigned' })
  async assignMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: AssignMemberRoleDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: any,
  ) {
    const roleName = typeof userRole === 'string' ? userRole : userRole?.name;
    return this.workspacesService.assignMemberRole(id, memberId, dto.roleId || dto.role, userId, roleName);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a member from the workspace' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiParam({ name: 'memberId', description: 'WorkspaceMember UUID or User UUID' })
  @ApiResponse({ status: 200, description: 'Member removed from workspace' })
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: any,
  ) {
    const roleName = typeof userRole === 'string' ? userRole : userRole?.name;
    return this.workspacesService.removeMember(id, memberId, userId, roleName);
  }

  // ==========================================
  // 3. INVITATIONS
  // ==========================================

  @Post(':id/invitations')
  @ApiOperation({ summary: 'Create an invitation to join the workspace (prevents duplicates)' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiResponse({ status: 201, description: 'Invitation created' })
  async createInvite(
    @Param('id') id: string,
    @Body() dto: InviteWorkspaceMemberDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.createInvite(id, dto, userId);
  }

  @Get(':id/invitations')
  @ApiOperation({ summary: 'List invitations for a workspace with optional status filter' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'ACCEPTED', 'CANCELLED', 'EXPIRED'] })
  @ApiResponse({ status: 200, description: 'List of invitations' })
  async getInvites(
    @Param('id') id: string,
    @Query('status') status?: string,
  ) {
    return this.workspacesService.getInvites(id, status);
  }

  @Post(':id/invitations/:inviteId/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend an invitation with refreshed security token and 7-day expiration' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiParam({ name: 'inviteId', description: 'Invitation UUID' })
  @ApiResponse({ status: 200, description: 'Invitation resent' })
  async resendInvite(
    @Param('id') id: string,
    @Param('inviteId') inviteId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.resendInvite(id, inviteId, userId);
  }

  @Delete(':id/invitations/:inviteId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel / revoke a pending workspace invitation' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiParam({ name: 'inviteId', description: 'Invitation UUID' })
  @ApiResponse({ status: 200, description: 'Invitation cancelled' })
  async cancelInvite(
    @Param('id') id: string,
    @Param('inviteId') inviteId: string,
  ) {
    return this.workspacesService.cancelInvite(id, inviteId);
  }

  // ==========================================
  // 4. WORKSPACE ROLES
  // ==========================================

  @Get(':id/roles')
  @ApiOperation({ summary: 'List all roles in a workspace (built-in and custom) with permissions and member counts' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'List of workspace roles' })
  async getRoles(@Param('id') id: string) {
    return this.workspacesService.getRoles(id);
  }

  @Post(':id/roles')
  @ApiOperation({ summary: 'Create a custom role with granular permissions in the workspace' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiResponse({ status: 201, description: 'Custom role created' })
  async createRole(
    @Param('id') id: string,
    @Body() dto: CreateWorkspaceRoleDto,
  ) {
    return this.workspacesService.createRole(id, dto);
  }

  @Get(':id/roles/:roleId')
  @ApiOperation({ summary: 'Get role details by ID or Name' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiParam({ name: 'roleId', description: 'Role UUID or Name' })
  @ApiResponse({ status: 200, description: 'Role details with permissions' })
  async getRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
  ) {
    return this.workspacesService.getRole(id, roleId);
  }

  @Patch(':id/roles/:roleId')
  @ApiOperation({ summary: 'Update a custom role (name, description, permissions)' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiParam({ name: 'roleId', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  async updateRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateWorkspaceRoleDto,
  ) {
    return this.workspacesService.updateRole(id, roleId, dto);
  }

  @Delete(':id/roles/:roleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a custom workspace role (system roles and roles with active members protected)' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiParam({ name: 'roleId', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Role deleted' })
  async deleteRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
  ) {
    return this.workspacesService.deleteRole(id, roleId);
  }

  // ==========================================
  // 5. WORKSPACE SETTINGS
  // ==========================================

  @Get(':id/settings')
  @ApiOperation({ summary: 'Get workspace settings (general, branding, localization, preferences, security)' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Workspace settings' })
  async getSettings(@Param('id') id: string) {
    return this.workspacesService.getSettings(id);
  }

  @Patch(':id/settings')
  @ApiOperation({ summary: 'Update workspace settings (partial or full categories)' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Updated workspace settings' })
  async updateSettings(
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceSettingsDto,
  ) {
    return this.workspacesService.updateSettings(id, dto);
  }

  @Patch(':id/settings/branding')
  @ApiOperation({ summary: 'Update workspace branding (logo, favicon, primary/accent colors)' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Branding settings updated' })
  async updateBranding(
    @Param('id') id: string,
    @Body() dto: UpdateBrandingSettingsDto,
  ) {
    return this.workspacesService.updateBranding(id, dto);
  }

  @Patch(':id/settings/localization')
  @ApiOperation({ summary: 'Update workspace localization (timezone, currency, language, dateFormat, timeFormat)' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Localization settings updated' })
  async updateLocalization(
    @Param('id') id: string,
    @Body() dto: UpdateLocalizationSettingsDto,
  ) {
    return this.workspacesService.updateLocalization(id, dto);
  }

  @Patch(':id/settings/preferences')
  @ApiOperation({ summary: 'Update workspace preferences (email notifications, lead assignment, default pipeline)' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Preferences settings updated' })
  async updatePreferences(
    @Param('id') id: string,
    @Body() dto: UpdatePreferencesSettingsDto,
  ) {
    return this.workspacesService.updatePreferences(id, dto);
  }

  @Patch(':id/settings/security')
  @ApiOperation({ summary: 'Update workspace security settings (two-factor enforcement, session timeout, domain allowlist)' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Security settings updated' })
  async updateSecurity(
    @Param('id') id: string,
    @Body() dto: UpdateSecuritySettingsDto,
  ) {
    return this.workspacesService.updateSecurity(id, dto);
  }
}
