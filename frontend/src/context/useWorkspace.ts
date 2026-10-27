import { useContext } from 'react';
import { WorkspaceContext } from './WorkspaceContext';
import type { WorkspaceContextType } from './WorkspaceContext';

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
