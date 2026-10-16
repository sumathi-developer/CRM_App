import { Module } from '@nestjs/common';
import { LeadGenerationController } from './lead-generation.controller';
import { LeadGenerationService } from './lead-generation.service';
import { LeadSourcesService } from './services/lead-sources.service';
import { WebFormsService } from './services/web-forms.service';
import { LeadScoringService } from './services/lead-scoring.service';
import { LeadQualificationService } from './services/lead-qualification.service';
import { LeadRoutingService } from './services/lead-routing.service';
import { LeadGenerationAnalyticsService } from './services/lead-generation-analytics.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [LeadGenerationController],
  providers: [
    LeadGenerationService,
    LeadSourcesService,
    WebFormsService,
    LeadScoringService,
    LeadQualificationService,
    LeadRoutingService,
    LeadGenerationAnalyticsService,
  ],
  exports: [
    LeadGenerationService,
    LeadSourcesService,
    WebFormsService,
    LeadScoringService,
    LeadQualificationService,
    LeadRoutingService,
    LeadGenerationAnalyticsService,
  ],
})
export class LeadGenerationModule {}
