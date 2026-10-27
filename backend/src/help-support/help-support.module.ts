import { Module } from '@nestjs/common';
import { HelpSupportController } from './help-support.controller';
import { HelpSupportService } from './help-support.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [HelpSupportController],
  providers: [HelpSupportService],
  exports: [HelpSupportService],
})
export class HelpSupportModule {}
