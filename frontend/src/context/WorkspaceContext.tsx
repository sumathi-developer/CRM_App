import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { Workspace } from '../types/workspace.types';
import { workspaceService } from '../services/workspace.service';
import { useAuth } from './useAuth';

export interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  myWorkspaces: Workspace[];
  isLoading: boolean;
  isSwitching: boolean;
  userPermissions: string[];
  userRoleInWorkspace: string;
  canManageWorkspace: boolean;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  refreshCurrentWorkspace: () => Promise<void>;
  createWorkspace: (data: any) => Promise<Workspace>;
}

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const defaultFallbackWs: Workspace = {
  id: 'onseclick-workspace-id',
  name: 'Onseclick Workspace',
  slug: 'onseclick-workspace',
  description: 'Primary corporate CRM workspace',
  timezone: 'UTC',
  currency: 'USD',
  status: 'ACTIVE',
  plan: 'FREE',
  ownerId: 'owner-id',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  _count: {
    members: 1,
    roles: 4,
    invites: 0,
  },
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [myWorkspaces, setMyWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRoleInWorkspace, setUserRoleInWorkspace] = useState<string>('MEMBER');

  const loadWorkspaceData = useCallback(async () => {
    if (!isAuthenticated) {
      setCurrentWorkspace(null);
      setMyWorkspaces([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [curr, list] = await Promise.allSettled([
        workspaceService.getCurrentWorkspace(),
        workspaceService.getMyWorkspaces(),
      ]);

      let activeWs: Workspace | null = curr.status === 'fulfilled' && curr.value ? curr.value : null;
      let workspacesList: Workspace[] = list.status === 'fulfilled' && Array.isArray(list.value) ? list.value : [];

      if (!activeWs && workspacesList.length > 0) {
        activeWs = workspacesList[0];
      }

      if (!activeWs) {
        try {
          const created = await workspaceService.createWorkspace({
            name: 'Onseclick Workspace',
            slug: 'onseclick-workspace',
            description: 'Primary corporate CRM workspace',
            timezone: 'UTC',
            currency: 'USD',
            plan: 'FREE',
          });
          if (created) {
            activeWs = created;
            workspacesList = [created];
          }
        } catch {
          activeWs = {
            ...defaultFallbackWs,
            ownerId: user?.id || 'admin',
          };
          workspacesList = [activeWs];
        }
      }

      if (activeWs) {
        setCurrentWorkspace(activeWs);
        const myRole = activeWs.myRole || (activeWs.ownerId === user?.id ? 'OWNER' : 'MEMBER');
        setUserRoleInWorkspace(myRole);

        const matchedRole = activeWs.roles?.find((r) => r.name === myRole);
        if (matchedRole?.permissions) {
          setUserPermissions(matchedRole.permissions);
        } else if (myRole === 'OWNER') {
          setUserPermissions(['*']);
        }
      }

      setMyWorkspaces(workspacesList);
    } catch (err) {
      console.warn('Failed to fetch workspace data:', err);
      const fallback = {
        ...defaultFallbackWs,
        ownerId: user?.id || 'admin',
      };
      setCurrentWorkspace(fallback);
      setMyWorkspaces([fallback]);
      setUserRoleInWorkspace('OWNER');
      setUserPermissions(['*']);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    let ignore = false;
    if (!isAuthenticated) {
      setCurrentWorkspace(null);
      setMyWorkspaces([]);
      setIsLoading(false);
      return;
    }

    const initWorkspaces = async () => {
      try {
        const [curr, list] = await Promise.allSettled([
          workspaceService.getCurrentWorkspace(),
          workspaceService.getMyWorkspaces(),
        ]);

        if (!ignore) {
          let activeWs: Workspace | null = curr.status === 'fulfilled' && curr.value ? curr.value : null;
          let workspacesList: Workspace[] = list.status === 'fulfilled' && Array.isArray(list.value) ? list.value : [];

          if (!activeWs && workspacesList.length > 0) {
            activeWs = workspacesList[0];
          }

          if (!activeWs) {
            try {
              const created = await workspaceService.createWorkspace({
                name: 'Onseclick Workspace',
                slug: 'onseclick-workspace',
                description: 'Primary corporate CRM workspace',
                timezone: 'UTC',
                currency: 'USD',
                plan: 'FREE',
              });
              if (created) {
                activeWs = created;
                workspacesList = [created];
              }
            } catch {
              activeWs = {
                ...defaultFallbackWs,
                ownerId: user?.id || 'admin',
              };
              workspacesList = [activeWs];
            }
          }

          if (activeWs) {
            setCurrentWorkspace(activeWs);
            const myRole = activeWs.myRole || (activeWs.ownerId === user?.id ? 'OWNER' : 'MEMBER');
            setUserRoleInWorkspace(myRole);

            const matchedRole = activeWs.roles?.find((r) => r.name === myRole);
            if (matchedRole?.permissions) {
              setUserPermissions(matchedRole.permissions);
            } else if (myRole === 'OWNER') {
              setUserPermissions(['*']);
            }
          }

          setMyWorkspaces(workspacesList);
        }
      } catch (err) {
        console.warn('Failed to fetch workspace data:', err);
        if (!ignore) {
          const fallback = {
            ...defaultFallbackWs,
            ownerId: user?.id || 'admin',
          };
          setCurrentWorkspace(fallback);
          setMyWorkspaces([fallback]);
          setUserRoleInWorkspace('OWNER');
          setUserPermissions(['*']);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    initWorkspaces();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, user]);

  const switchWorkspace = async (workspaceId: string) => {
    try {
      setIsSwitching(true);
      const res = await workspaceService.switchWorkspace(workspaceId);

      // Refresh full details of the switched workspace
      const [freshCurrent, freshList] = await Promise.all([
        workspaceService.getCurrentWorkspace(),
        workspaceService.getMyWorkspaces(),
      ]);

      setCurrentWorkspace(freshCurrent);
      setMyWorkspaces(freshList);
      setUserRoleInWorkspace(res.memberRole || 'MEMBER');
      setUserPermissions(res.permissions || []);
    } finally {
      setIsSwitching(false);
    }
  };

  const refreshWorkspaces = async () => {
    try {
      const list = await workspaceService.getMyWorkspaces();
      setMyWorkspaces(list);
    } catch (err) {
      console.error('Failed to refresh workspaces:', err);
    }
  };

  const refreshCurrentWorkspace = async () => {
    try {
      const curr = await workspaceService.getCurrentWorkspace();
      setCurrentWorkspace(curr);
    } catch (err) {
      console.error('Failed to refresh current workspace:', err);
    }
  };

  const createWorkspace = async (data: any): Promise<Workspace> => {
    const created = await workspaceService.createWorkspace(data);
    await loadWorkspaceData();
    return created;
  };

  const canManageWorkspace =
    userRoleInWorkspace === 'OWNER' ||
    userRoleInWorkspace === 'ADMIN' ||
    userPermissions.includes('*') ||
    userPermissions.includes('workspace:manage') ||
    userPermissions.includes('workspace:write');

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        myWorkspaces,
        isLoading,
        isSwitching,
        userPermissions,
        userRoleInWorkspace,
        canManageWorkspace,
        switchWorkspace,
        refreshWorkspaces,
        refreshCurrentWorkspace,
        createWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};
