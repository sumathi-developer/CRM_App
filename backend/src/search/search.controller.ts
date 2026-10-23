import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  Req,
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
import { SearchService } from './services/search.service';
import { SearchHistoryService } from './services/search-history.service';
import { GlobalSearchDto } from './dto/global-search.dto';
import { EntitySearchDto } from './dto/entity-search.dto';
import { SearchSuggestionsDto } from './dto/search-suggestions.dto';
import { SearchHistoryQueryDto } from './dto/search-history.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Global Search')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly searchHistoryService: SearchHistoryService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Global search across Leads, Contacts, Companies, Deals, Activities, Documents, Notes, Users',
  })
  @ApiResponse({
    status: 200,
    description: 'Ranked and grouped search results with relevance scores and highlights',
  })
  async globalSearch(
    @Query() dto: GlobalSearchDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const workspaceContext = req.workspace;
    return this.searchService.globalSearch(dto, user, workspaceContext);
  }

  @Get('suggestions')
  @ApiOperation({
    summary: 'Fast autocomplete search suggestions for instant search bar dropdown',
  })
  @ApiResponse({
    status: 200,
    description: 'List of search suggestions / autocomplete items',
  })
  async getSuggestions(
    @Query() dto: SearchSuggestionsDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const workspaceContext = req.workspace;
    return this.searchService.getSuggestions(dto, user, workspaceContext);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get recent search history for current user' })
  @ApiResponse({ status: 200, description: 'Paginated user search history' })
  async getSearchHistory(
    @Query() query: SearchHistoryQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.searchHistoryService.getHistory(userId, query);
  }

  @Delete('history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all search history for current user' })
  @ApiResponse({ status: 200, description: 'Search history cleared' })
  async clearSearchHistory(
    @CurrentUser('id') userId: string,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.searchHistoryService.clearAll(userId, workspaceId);
  }

  @Delete('history/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a single search history record' })
  @ApiParam({ name: 'id', description: 'SearchHistory UUID' })
  @ApiResponse({ status: 200, description: 'History record deleted' })
  async deleteSearchHistoryItem(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.searchHistoryService.deleteItem(id, userId);
  }

  @Get(':entity')
  @ApiOperation({
    summary: 'Entity-specific search (leads, contacts, companies, deals, activities, documents, notes, users)',
  })
  @ApiParam({
    name: 'entity',
    description: 'Target entity name (leads, contacts, companies, deals, activities, documents, notes, users)',
    example: 'leads',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated search results within specified entity with filters',
  })
  async searchEntity(
    @Param('entity') entity: string,
    @Query() dto: EntitySearchDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const workspaceContext = req.workspace;
    return this.searchService.searchSingleEntity(entity, dto, user, workspaceContext);
  }
}
