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

export const defaultSystemWorkspaceRoles = [
  {
    id: 'role-owner',
    workspaceId: 'onseclick-workspace-id',
    name: 'OWNER',
    description: 'Full workspace administrative control and billing management',
    isSystem: true,
    permissions: ['*'],
    _count: { members: 1 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'role-admin',
    workspaceId: 'onseclick-workspace-id',
    name: 'ADMIN',
    description: 'Manage members, teams, pipelines, and workspace settings',
    isSystem: true,
    permissions: ['workspace:manage', 'contacts:*', 'deals:*', 'leads:*', 'teams:*'],
    _count: { members: 1 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'role-member',
    workspaceId: 'onseclick-workspace-id',
    name: 'MEMBER',
    description: 'Create and edit contacts, leads, activities, and assigned pipeline deals',
    isSystem: true,
    permissions: ['contacts:read', 'contacts:write', 'deals:read', 'deals:write', 'leads:read', 'leads:write'],
    _count: { members: 2 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'role-viewer',
    workspaceId: 'onseclick-workspace-id',
    name: 'VIEWER',
    description: 'Read-only access across CRM workspace records and analytics',
    isSystem: true,
    permissions: ['contacts:read', 'deals:read', 'leads:read', 'reports:read'],
    _count: { members: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

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
  roles: defaultSystemWorkspaceRoles,
  members: [
    {
      id: 'active-member-primary',
      workspaceId: 'onseclick-workspace-id',
      userId: 'admin',
      role: 'OWNER',
      status: 'ACTIVE',
      joinedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      user: {
        id: 'admin',
        name: 'Sri (Admin)',
        email: 'admin@crm.com',
      },
    },
  ],
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
        if (!activeWs.roles || activeWs.roles.length === 0) {
          activeWs.roles = defaultSystemWorkspaceRoles.map((r) => ({ ...r, workspaceId: activeWs!.id }));
        }
        if (!activeWs.members || activeWs.members.length === 0) {
          activeWs.members = [
            {
              id: 'active-member-primary',
              workspaceId: activeWs.id,
              userId: user?.id || 'admin',
              role: 'OWNER',
              status: 'ACTIVE',
              joinedAt: activeWs.createdAt || new Date().toISOString(),
              createdAt: activeWs.createdAt || new Date().toISOString(),
              user: {
                id: user?.id || 'admin',
                name: user?.name || 'Sri (Admin)',
                email: user?.email || 'admin@crm.com',
              },
            },
          ];
        }
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
            if (!activeWs.roles || activeWs.roles.length === 0) {
              activeWs.roles = defaultSystemWorkspaceRoles.map((r) => ({ ...r, workspaceId: activeWs!.id }));
            }
            if (!activeWs.members || activeWs.members.length === 0) {
              activeWs.members = [
                {
                  id: 'active-member-primary',
                  workspaceId: activeWs.id,
                  userId: user?.id || 'admin',
                  role: 'OWNER',
                  status: 'ACTIVE',
                  joinedAt: activeWs.createdAt || new Date().toISOString(),
                  createdAt: activeWs.createdAt || new Date().toISOString(),
                  user: {
                    id: user?.id || 'admin',
                    name: user?.name || 'Sri (Admin)',
                    email: user?.email || 'admin@crm.com',
                  },
                },
              ];
            }
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
    // 1. Instant optimistic switch so UI updates immediately (0ms delay)
    const prevWorkspace = currentWorkspace;
    const targetWs = myWorkspaces.find((w) => w.id === workspaceId);

    if (targetWs) {
      setCurrentWorkspace(targetWs);
      const role = targetWs.myRole || (targetWs.ownerId === user?.id ? 'OWNER' : 'MEMBER');
      setUserRoleInWorkspace(role);
      const matchedRole = targetWs.roles?.find((r) => r.name === role);
      if (matchedRole?.permissions) {
        setUserPermissions(matchedRole.permissions);
      } else if (role === 'OWNER') {
        setUserPermissions(['*']);
      }
    }

    try {
      setIsSwitching(true);
      const res = await workspaceService.switchWorkspace(workspaceId);

      setUserRoleInWorkspace(res.memberRole || 'MEMBER');
      if (res.permissions) {
        setUserPermissions(res.permissions);
      }
    } catch (err) {
      console.error('Failed to switch workspace on server:', err);
      // Revert if network call fails
      if (prevWorkspace) {
        setCurrentWorkspace(prevWorkspace);
        const prevRole = prevWorkspace.myRole || (prevWorkspace.ownerId === user?.id ? 'OWNER' : 'MEMBER');
        setUserRoleInWorkspace(prevRole);
      }
      throw err;
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
