import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FilesService, UploadedFileMeta } from './files.service';
import { AttachFileDto } from './dto/attach-file.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Files')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file or document attachment' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: UploadedFileMeta,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required in upload payload');
    }
    return this.filesService.saveFileRecord(file, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all uploaded file records' })
  @ApiResponse({ status: 200, description: 'List of files' })
  async findAll() {
    return this.filesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file record metadata by ID' })
  @ApiParam({ name: 'id', description: 'File UUID' })
  @ApiResponse({ status: 200, description: 'File metadata' })
  async findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete file by ID' })
  @ApiParam({ name: 'id', description: 'File UUID' })
  @ApiResponse({ status: 200, description: 'File deleted' })
  async remove(@Param('id') id: string) {
    return this.filesService.remove(id);
  }

  @Post(':id/attach')
  @ApiOperation({ summary: 'Attach uploaded file to a contact, lead, deal, or organization' })
  @ApiParam({ name: 'id', description: 'File UUID' })
  @ApiResponse({ status: 201, description: 'File attached' })
  async attachFile(
    @Param('id') id: string,
    @Body() dto: AttachFileDto,
  ) {
    return this.filesService.attachFile(id, dto);
  }

  @Delete(':id/attach')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Detach file from entity' })
  @ApiParam({ name: 'id', description: 'File UUID' })
  @ApiQuery({ name: 'attachmentId', required: false, description: 'Optional specific attachment ID' })
  @ApiResponse({ status: 200, description: 'File detached' })
  async detachFile(
    @Param('id') id: string,
    @Query('attachmentId') attachmentId?: string,
  ) {
    return this.filesService.detachFile(id, attachmentId);
  }
}
