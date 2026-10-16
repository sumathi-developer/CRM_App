import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { WorkspaceGuard } from './guards/workspace.guard';
import { WorkspaceRolesGuard } from './guards/workspace-roles.guard';
import { WorkspacePermissionsGuard } from './guards/workspace-permissions.guard';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [WorkspacesController],
  providers: [
    Reflector,
    WorkspacesService,
    WorkspaceGuard,
    WorkspaceRolesGuard,
    WorkspacePermissionsGuard,
  ],
  exports: [
    WorkspacesService,
    WorkspaceGuard,
    WorkspaceRolesGuard,
    WorkspacePermissionsGuard,
  ],
})
export class WorkspacesModule {}
