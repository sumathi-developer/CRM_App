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
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { OrganizationQueryDto } from './dto/organization-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Organizations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all organizations with pagination, industry filter, and search' })
  @ApiResponse({ status: 200, description: 'Paginated list of organizations' })
  async findAll(@Query() query: OrganizationQueryDto) {
    return this.organizationsService.findAll(query);
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({ status: 201, description: 'Organization created successfully' })
  async create(@Body() createDto: CreateOrganizationDto) {
    return this.organizationsService.create(createDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization details with related users, contacts, and deals' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiResponse({ status: 200, description: 'Organization details' })
  async findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update organization information' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiResponse({ status: 200, description: 'Organization updated' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete organization by ID' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiResponse({ status: 200, description: 'Organization deleted' })
  async remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Get all members belonging to this organization' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiResponse({ status: 200, description: 'List of members' })
  async getOrganizationUsers(@Param('id') id: string) {
    return this.organizationsService.getOrganizationUsers(id);
  }

  @Post(':id/invite')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Invite a user to join this organization' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiResponse({ status: 201, description: 'Invitation created' })
  async invite(@Param('id') id: string, @Body() inviteDto: InviteUserDto) {
    return this.organizationsService.inviteUser(id, inviteDto);
  }

  @Delete(':id/users/:userId')
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a user from an organization' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID to remove' })
  @ApiResponse({ status: 200, description: 'User removed from organization' })
  async removeUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.organizationsService.removeUserFromOrganization(id, userId);
  }
}
