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
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteQueryDto } from './dto/note-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Notes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get('notes')
  @ApiOperation({ summary: 'List all notes with entity filters and search' })
  @ApiResponse({ status: 200, description: 'Paginated list of notes' })
  async findAll(@Query() query: NoteQueryDto) {
    return this.notesService.findAll(query);
  }

  @Post('notes')
  @ApiOperation({ summary: 'Create and attach a note to Contact, Lead, or Deal' })
  @ApiResponse({ status: 201, description: 'Note created' })
  async create(
    @Body() createDto: CreateNoteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.notesService.create(createDto, userId);
  }

  @Get('notes/:id')
  @ApiOperation({ summary: 'Get note details by ID' })
  @ApiParam({ name: 'id', description: 'Note UUID' })
  @ApiResponse({ status: 200, description: 'Note details' })
  async findOne(@Param('id') id: string) {
    return this.notesService.findOne(id);
  }

  @Patch('notes/:id')
  @ApiOperation({ summary: 'Update note content' })
  @ApiParam({ name: 'id', description: 'Note UUID' })
  @ApiResponse({ status: 200, description: 'Note updated' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateNoteDto,
  ) {
    return this.notesService.update(id, updateDto);
  }

  @Delete('notes/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a note by ID' })
  @ApiParam({ name: 'id', description: 'Note UUID' })
  @ApiResponse({ status: 200, description: 'Note deleted' })
  async remove(@Param('id') id: string) {
    return this.notesService.remove(id);
  }

  @Get('contacts/:id/notes')
  @ApiOperation({ summary: 'Get all notes associated with a specific contact' })
  @ApiParam({ name: 'id', description: 'Contact UUID' })
  @ApiResponse({ status: 200, description: 'Contact notes' })
  async findByContact(@Param('id') contactId: string) {
    return this.notesService.findByContact(contactId);
  }
}
