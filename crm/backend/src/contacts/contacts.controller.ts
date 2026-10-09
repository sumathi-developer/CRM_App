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
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactQueryDto } from './dto/contact-query.dto';
import { ConvertContactDto } from './dto/convert-contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Contacts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'List contacts with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of contacts' })
  async findAll(@Query() query: ContactQueryDto) {
    return this.contactsService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new contact' })
  @ApiResponse({ status: 201, description: 'Contact created successfully' })
  async create(@Body() createDto: CreateContactDto) {
    return this.contactsService.create(createDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact details with related deals and activities' })
  @ApiParam({ name: 'id', description: 'Contact UUID' })
  @ApiResponse({ status: 200, description: 'Contact details' })
  async findOne(@Param('id') id: string) {
    return this.contactsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update contact information' })
  @ApiParam({ name: 'id', description: 'Contact UUID' })
  @ApiResponse({ status: 200, description: 'Contact updated' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateContactDto) {
    return this.contactsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete contact by ID' })
  @ApiParam({ name: 'id', description: 'Contact UUID' })
  @ApiResponse({ status: 200, description: 'Contact deleted' })
  async remove(@Param('id') id: string) {
    return this.contactsService.remove(id);
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'Get all activities related to this contact' })
  @ApiParam({ name: 'id', description: 'Contact UUID' })
  @ApiResponse({ status: 200, description: 'List of activities' })
  async getActivities(@Param('id') id: string) {
    return this.contactsService.getActivities(id);
  }

  @Get(':id/deals')
  @ApiOperation({ summary: 'Get all deals linked to this contact' })
  @ApiParam({ name: 'id', description: 'Contact UUID' })
  @ApiResponse({ status: 200, description: 'List of deals' })
  async getDeals(@Param('id') id: string) {
    return this.contactsService.getDeals(id);
  }

  @Get(':id/notes')
  @ApiOperation({ summary: 'Get all notes associated with this contact' })
  @ApiParam({ name: 'id', description: 'Contact UUID' })
  @ApiResponse({ status: 200, description: 'List of notes' })
  async getNotes(@Param('id') id: string) {
    return this.contactsService.getNotes(id);
  }

  @Get(':id/tasks')
  @ApiOperation({ summary: 'Get all tasks associated with this contact' })
  @ApiParam({ name: 'id', description: 'Contact UUID' })
  @ApiResponse({ status: 200, description: 'List of tasks' })
  async getTasks(@Param('id') id: string) {
    return this.contactsService.getTasks(id);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Convert contact into paying customer and optionally create a deal' })
  @ApiParam({ name: 'id', description: 'Contact UUID' })
  @ApiResponse({ status: 200, description: 'Contact converted to customer' })
  async convert(
    @Param('id') id: string,
    @Body() dto: ConvertContactDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.contactsService.convert(id, dto, userId);
  }
}
