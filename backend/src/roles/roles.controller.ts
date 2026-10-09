import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Roles & Permissions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('roles')
  @ApiOperation({ summary: 'List all user roles with permission counts' })
  @ApiResponse({ status: 200, description: 'List of roles' })
  async findAll() {
    return this.rolesService.findAll();
  }

  @Post('roles')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created' })
  async create(@Body() createDto: CreateRoleDto) {
    return this.rolesService.create(createDto);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'List all available system permissions' })
  @ApiResponse({ status: 200, description: 'List of permissions' })
  async findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Get('roles/:id')
  @ApiOperation({ summary: 'Get role details and assigned permissions' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Role details' })
  async findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch('roles/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update role details' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateDto);
  }

  @Delete('roles/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete role by ID' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Role deleted' })
  async remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Get('roles/:id/permissions')
  @ApiOperation({ summary: 'Get permissions granted to a role' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Role permissions' })
  async getRolePermissions(@Param('id') id: string) {
    return this.rolesService.getRolePermissions(id);
  }

  @Put('roles/:id/permissions')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Replace permissions assigned to a role' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Role permissions updated' })
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.rolesService.updateRolePermissions(id, dto);
  }
}
