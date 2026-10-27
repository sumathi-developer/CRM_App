import { Module } from '@nestjs/common';
import { CustomFieldsController } from './custom-fields.controller';
import { CustomFieldsService } from './services/custom-fields.service';
import { CustomFieldValuesService } from './services/custom-field-values.service';
import { CustomFieldValidationService } from './services/custom-field-validation.service';
import { CustomFieldTypeMigrationService } from './services/custom-field-type-migration.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CustomFieldsController],
  providers: [
    CustomFieldsService,
    CustomFieldValuesService,
    CustomFieldValidationService,
    CustomFieldTypeMigrationService,
  ],
  exports: [
    CustomFieldsService,
    CustomFieldValuesService,
    CustomFieldValidationService,
    CustomFieldTypeMigrationService,
  ],
})
export class CustomFieldsModule {}
