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

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const leadGenCache = new Map<string, CacheEntry<any>>();

export function getCachedLeadGenData<T>(key: string): T | null {
  const entry = leadGenCache.get(key);
  if (!entry) return null;
  // Stale after 5 minutes
  if (Date.now() - entry.timestamp > 5 * 60 * 1000) {
    leadGenCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCachedLeadGenData<T>(key: string, data: T) {
  leadGenCache.set(key, { data, timestamp: Date.now() });
}

export function invalidateLeadGenCache(prefix?: string) {
  if (!prefix) {
    leadGenCache.clear();
    return;
  }
  for (const k of leadGenCache.keys()) {
    if (k.startsWith(prefix)) {
      leadGenCache.delete(k);
    }
  }
}

export function prefetchLeadGenRoute(path: string, loader: () => Promise<any>) {
  if (leadGenCache.has(path)) return;
  loader()
    .then((result) => {
      setCachedLeadGenData(path, result);
    })
    .catch(() => {});
}

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
  clearError: () => void;
}

/**
 * High-performance cached loader hook with stale-while-revalidate.
 * Returns cached data immediately (0ms) so clicking between pages does not
 * show a loading screen or spinner, while revalidating fresh data in the background.
 */
export function useAsyncData<T>(loader: () => Promise<T>): AsyncState<T> {
  const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
  const initialCached = currentPath ? getCachedLeadGenData<T>(currentPath) : null;

  const [data, setData] = useState<T | null>(initialCached);
  const [isLoading, setIsLoading] = useState<boolean>(!initialCached);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let ignore = false;
    const pathKey = window.location.pathname + window.location.search;
    const existing = getCachedLeadGenData<T>(pathKey);

    if (existing && !data) {
      setData(existing);
      setIsLoading(false);
    }

    const run = async () => {
      // Only show blocking loading state if no cached data exists
      if (!existing && !data) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const result = await loader();
        if (!ignore) {
          setCachedLeadGenData(pathKey, result);
          setData(result);
        }
      } catch (err: any) {
        if (!ignore) {
          // If we already have cached data, keep showing it instead of breaking the view
          if (!existing && !data) {
            setError(err?.message || 'Failed to load data. Please try again.');
          }
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    run();
    return () => {
      ignore = true;
    };
  }, [loader, tick]);

  const reload = useCallback(() => {
    if (typeof window !== 'undefined') {
      leadGenCache.delete(window.location.pathname + window.location.search);
    }
    setTick((t) => t + 1);
  }, []);

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
