import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/useWorkspace';
import { userService } from '../../services/user.service';

/** Workspace scoping + permission flags for every Lead Generation screen. */
export function useLeadGenAccess() {
  const { user } = useAuth();
  const { currentWorkspace, userRoleInWorkspace } = useWorkspace();

  const canManage =
    user?.role?.name === 'ADMIN' || userRoleInWorkspace === 'OWNER' || userRoleInWorkspace === 'ADMIN';

  return { workspaceId: currentWorkspace?.id, canManage };
}

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
  clearError: () => void;
}

/**
 * Generic loader hook. `loader` must be memoised by the caller (useCallback)
 * so the request only re-runs when its inputs change.
 */
export function useAsyncData<T>(loader: () => Promise<T>): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await loader();
        if (!ignore) setData(result);
      } catch (err: any) {
        if (!ignore) setError(err?.message || 'Failed to load data. Please try again.');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    run();
    return () => {
      ignore = true;
    };
  }, [loader, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const clearError = useCallback(() => setError(null), []);

  return { data, isLoading, error, reload, clearError };
}

export interface UserOption {
  id: string;
  name: string;
  email: string;
}

/** Loads workspace users once for owner / assignee pickers. */
export function useUserOptions() {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      try {
        const res = await userService.getUsers({ limit: 100 });
        if (!ignore) {
          setUsers(
            (res?.data || []).map((u: any) => ({ id: u.id, name: u.name || u.email, email: u.email })),
          );
        }
      } catch {
        if (!ignore) setUsers([]);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    run();
    return () => {
      ignore = true;
    };
  }, []);

  return { users, isLoading };
}
