import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './services/analytics.service';
import { SalesAnalyticsService } from './services/sales-analytics.service';
import { LeadAnalyticsService } from './services/lead-analytics.service';
import { ActivityAnalyticsService } from './services/activity-analytics.service';
import { TeamAnalyticsService } from './services/team-analytics.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    SalesAnalyticsService,
    LeadAnalyticsService,
    ActivityAnalyticsService,
    TeamAnalyticsService,
  ],
  exports: [
    AnalyticsService,
    SalesAnalyticsService,
    LeadAnalyticsService,
    ActivityAnalyticsService,
    TeamAnalyticsService,
  ],
})
export class AnalyticsModule {}
