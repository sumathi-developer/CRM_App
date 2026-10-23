import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SearchController } from './search.controller';
import { SearchService } from './services/search.service';
import { SearchHistoryService } from './services/search-history.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SearchController],
  providers: [SearchService, SearchHistoryService],
  exports: [SearchService, SearchHistoryService],
})
export class SearchModule {}
