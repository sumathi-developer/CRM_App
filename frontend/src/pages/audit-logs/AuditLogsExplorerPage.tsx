import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../../context/useWorkspace';
import { auditLogService } from '../../services/audit-log.service';
import { userService } from '../../services/user.service';
import type {
  AuditLogEntry,
  AuditLogPaginationMeta,
  AuditLogQueryFilters,
  AuditLogSummary,
  AuditScreenSlug,
} from '../../types/audit-log.types';
import { AUDIT_SCREENS_META } from './auditLogConstants';
import { AuditLogLayout } from './components/AuditLogLayout';
import { AuditLogFilters } from './components/AuditLogFilters';
import { AuditLogTable } from './components/AuditLogTable';
import { AuditLogPagination } from './components/AuditLogPagination';
import { AuditLogDetailsModal } from './components/AuditLogDetailsModal';

interface AuditLogsExplorerPageProps {
  screen: AuditScreenSlug;
}

export const AuditLogsExplorerPage: React.FC<AuditLogsExplorerPageProps> = ({
  screen,
}) => {
  const { currentWorkspace } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();

  const screenMeta = AUDIT_SCREENS_META[screen] || AUDIT_SCREENS_META.all;

  // Filter State
  const [filters, setFilters] = useState<AuditLogQueryFilters>(() => {
    const base: AuditLogQueryFilters = {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    if (screenMeta.defaultAction) {
      base.action = screenMeta.defaultAction;
    }
    if (screenMeta.defaultEntityType) {
      base.entityType = screenMeta.defaultEntityType;
    }

    // Read initial search query if present in URL
    const urlQ = searchParams.get('q') || searchParams.get('search');
    if (urlQ) base.search = urlQ;

    return base;
  });

  // Debounced search query for API call
  const [debouncedSearch, setDebouncedSearch] = useState<string>(
    filters.search || '',
  );
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Data State
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<AuditLogPaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [summary, setSummary] = useState<AuditLogSummary | null>(null);
  const [usersList, setUsersList] = useState<
    Array<{ id: string; name: string; email: string }>
  >([]);

  // Modal & Loading States
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sync screen change: update filter defaults when screen prop changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      action: screenMeta.defaultAction || undefined,
      entityType: screenMeta.defaultEntityType || undefined,
    }));
  }, [screen, screenMeta]);

  // Debounce search input
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(filters.search?.trim() || '');
    }, 350);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [filters.search]);

  // Fetch summary statistics
  const loadSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const sum = await auditLogService.getSummary(currentWorkspace?.id);
      setSummary(sum);
    } catch {
      // Non-critical, continue without crashing
    } finally {
      setIsLoadingSummary(false);
    }
  }, [currentWorkspace?.id]);

  // Fetch workspace users for the user filter dropdown
  const loadUsers = useCallback(async () => {
    try {
      const res = await userService.getUsers({ limit: 100 });
      if (res?.data && Array.isArray(res.data)) {
        setUsersList(
          res.data.map((u) => ({
            id: u.id,
            name: u.name || u.email,
            email: u.email,
          })),
        );
      }
    } catch {
      // User list is optional enhancement
    }
  }, []);

  // Fetch paginated audit logs
  const loadLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    setError(null);
    try {
      const query: AuditLogQueryFilters = {
        ...filters,
        search: debouncedSearch || undefined,
        workspaceId: currentWorkspace?.id,
      };

      const result = await auditLogService.getLogs(query);
      setLogs(result.data);
      setPaginationMeta(result.meta);
    } catch (err: any) {
      setError(
        err?.message ||
          'Failed to retrieve audit log records from server. Please try again.',
      );
      setLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [filters, debouncedSearch, currentWorkspace?.id]);

  // Initial load & workspace switch
  useEffect(() => {
    void loadSummary();
    void loadUsers();
  }, [loadSummary, loadUsers]);

  // Reload logs when filters or debounced search changes
  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  // Check for direct log inspection in URL parameter ?logId=...
  useEffect(() => {
    const directLogId = searchParams.get('logId');
    if (directLogId) {
      void (async () => {
        try {
          const directLog = await auditLogService.getLogById(directLogId);
          if (directLog) {
            setSelectedLog(directLog);
            setIsModalOpen(true);
          }
        } catch {
          // Ignore if direct log doesn't exist
        }
      })();
    }
  }, [searchParams]);

  // Handler for filter updates
  const handleFilterChange = (updates: Partial<AuditLogQueryFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  // Reset filters to current screen defaults
  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      action: screenMeta.defaultAction || undefined,
      entityType: screenMeta.defaultEntityType || undefined,
      search: '',
    });
    setDebouncedSearch('');
    // Remove query parameter from URL
    if (searchParams.has('q') || searchParams.has('search')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('q');
      nextParams.delete('search');
      setSearchParams(nextParams);
    }
  };

  // Sort change handler
  const handleSortChange = (
    field: 'createdAt' | 'action' | 'entityType' | 'userEmail',
  ) => {
    setFilters((prev) => {
      const isSameField = prev.sortBy === field;
      const nextOrder = isSameField && prev.sortOrder === 'asc' ? 'desc' : 'asc';
      return {
        ...prev,
        sortBy: field,
        sortOrder: nextOrder,
        page: 1,
      };
    });
  };

  // Page change
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Limit change
  const handleLimitChange = (newLimit: number) => {
    setFilters((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1,
    }));
  };

  // Open Log Details Modal
  const handleSelectLog = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  // Close Log Details Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLog(null);
    if (searchParams.has('logId')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('logId');
      setSearchParams(nextParams);
    }
  };

  // Export audit logs
  const handleExport = async (format: 'CSV' | 'JSON') => {
    setIsExporting(true);
    setError(null);
    try {
      const res = await auditLogService.exportLogs({
        ...filters,
        search: debouncedSearch || undefined,
        workspaceId: currentWorkspace?.id,
        format,
        limit: 1000,
      });

      setSuccess(
        `Audit logs successfully exported as ${format} (${res.filename}).`,
      );
    } catch (err: any) {
      setError(
        err?.message ||
          'Failed to export audit logs. Please check your permissions.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AuditLogLayout
      screen={screen}
      summary={summary}
      isLoadingSummary={isLoadingSummary}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
    >
      {/* Search and Filters Bar */}
      <AuditLogFilters
        filters={filters}
        users={usersList}
        activeScreen={screen}
        isLoading={isLoadingLogs}
        isExporting={isExporting}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onRefresh={() => {
          void loadLogs();
          void loadSummary();
        }}
        onExport={handleExport}
      />

      {/* Main Audit Log Table */}
      <AuditLogTable
        logs={logs}
        isLoading={isLoadingLogs}
        onSelectLog={handleSelectLog}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSortChange={handleSortChange}
      />

      {/* Server-Side Pagination Bar */}
      <AuditLogPagination
        meta={paginationMeta}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        isLoading={isLoadingLogs}
      />

      {/* Read-Only Details Inspector Modal */}
      <AuditLogDetailsModal
        log={selectedLog}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </AuditLogLayout>
  );
};

