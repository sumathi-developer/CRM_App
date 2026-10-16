import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { WorkspaceGuard } from './guards/workspace.guard';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [WorkspacesController],
  providers: [
    WorkspacesService,
    WorkspaceGuard,
  ],
  exports: [
    WorkspacesService,
    WorkspaceGuard,
  ],
})
export class WorkspacesModule {}
