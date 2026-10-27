import React, { useMemo } from 'react';
import type { SystemPermission, ResourcePermissionGroup } from '../../types/role.types';
import { PermissionActionBadge } from './RoleBadges';
import { CheckCircleIcon, ShieldIcon } from '../../components/common/Icons';

interface PermissionsMatrixProps {
  permissions: SystemPermission[];
  selectedPermissionIds: string[];
  onChange?: (newSelectedIds: string[]) => void;
  readOnly?: boolean;
  search?: string;
}

export const PermissionsMatrix: React.FC<PermissionsMatrixProps> = ({
  permissions,
  selectedPermissionIds,
  onChange,
  readOnly = false,
  search = '',
}) => {
  const selectedSet = useMemo(() => new Set(selectedPermissionIds), [selectedPermissionIds]);

  // Group permissions by resource
  const groupedResources = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map<string, SystemPermission[]>();

    for (const perm of permissions) {
      if (q) {
        const matchesName = perm.name.toLowerCase().includes(q);
        const matchesResource = perm.resource.toLowerCase().includes(q);
        const matchesAction = perm.action.toLowerCase().includes(q);
        const matchesDesc = perm.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesResource && !matchesAction && !matchesDesc) {
          continue;
        }
      }

      const resKey = perm.resource.toUpperCase();
      if (!map.has(resKey)) {
        map.set(resKey, []);
      }
      map.get(resKey)!.push(perm);
    }

    const groups: ResourcePermissionGroup[] = [];
    const sortedKeys = Array.from(map.keys()).sort();

    for (const key of sortedKeys) {
      groups.push({
        resource: key,
        displayName: key.replace(/_/g, ' '),
        permissions: map.get(key)!,
      });
    }

    return groups;
  }, [permissions, search]);

  const togglePermission = (permId: string) => {
    if (readOnly || !onChange) return;
    if (selectedSet.has(permId)) {
      onChange(selectedPermissionIds.filter((id) => id !== permId));
    } else {
      onChange([...selectedPermissionIds, permId]);
    }
  };

  const toggleGroup = (groupPerms: SystemPermission[]) => {
    if (readOnly || !onChange) return;
    const groupIds = groupPerms.map((p) => p.id);
    const allSelected = groupIds.every((id) => selectedSet.has(id));

    if (allSelected) {
      // Deselect group
      onChange(selectedPermissionIds.filter((id) => !groupIds.includes(id)));
    } else {
      // Select all in group
      const newIds = new Set([...selectedPermissionIds, ...groupIds]);
      onChange(Array.from(newIds));
    }
  };

  const selectAllGlobal = () => {
    if (readOnly || !onChange) return;
    onChange(permissions.map((p) => p.id));
  };

  const clearAllGlobal = () => {
    if (readOnly || !onChange) return;
    onChange([]);
  };

  return (
    <div className="permissions-matrix-container" id="permissions-matrix">
      {/* Global Toolbar in Edit Mode */}
      {!readOnly && onChange && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #cbd5e1)', fontWeight: 500 }}>
              {selectedPermissionIds.length} of {permissions.length} permissions granted
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn-bulk-toggle"
              onClick={selectAllGlobal}
            >
              Grant All Permissions
            </button>
            <button
              type="button"
              className="btn-bulk-toggle"
              onClick={clearAllGlobal}
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {groupedResources.length === 0 ? (
        <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>
          {search ? `No permissions match "${search}".` : 'No permissions available in this system.'}
        </p>
      ) : (
        groupedResources.map((group) => {
          const groupIds = group.permissions.map((p) => p.id);
          const grantedInGroup = group.permissions.filter((p) => selectedSet.has(p.id)).length;
          const isGroupAllSelected = groupIds.length > 0 && groupIds.every((id) => selectedSet.has(id));

          return (
            <div key={group.resource} className="resource-group-card" id={`perm-group-${group.resource.toLowerCase()}`}>
              <div className="resource-group-header">
                <div className="resource-title-wrap">
                  <ShieldIcon size={16} className="text-primary" />
                  <h4 className="resource-title-text">{group.displayName}</h4>
                  <span className="resource-count-badge">
                    {grantedInGroup} / {group.permissions.length} Granted
                  </span>
                </div>

                {!readOnly && onChange && (
                  <div className="resource-group-actions">
                    <button
                      type="button"
                      className="btn-bulk-toggle"
                      onClick={() => toggleGroup(group.permissions)}
                    >
                      {isGroupAllSelected ? 'Deselect Group' : 'Select All in Group'}
                    </button>
                  </div>
                )}
              </div>

              <div className="resource-perms-grid">
                {group.permissions.map((perm) => {
                  const isGranted = selectedSet.has(perm.id);

                  if (readOnly) {
                    return (
                      <div
                        key={perm.id}
                        className={`perm-toggle-row ${isGranted ? 'is-granted' : ''}`}
                        style={{ cursor: 'default' }}
                      >
                        <div className="perm-details-text">
                          <div className="perm-name-row">
                            <span className="perm-name-label">{perm.name}</span>
                            <PermissionActionBadge action={perm.action} />
                          </div>
                          {perm.description && (
                            <span className="perm-desc-label">{perm.description}</span>
                          )}
                          <div style={{ marginTop: '0.25rem' }}>
                            <span className={`matrix-status-chip ${isGranted ? 'granted' : 'denied'}`}>
                              {isGranted ? (
                                <>
                                  <CheckCircleIcon size={12} />
                                  <span>Granted</span>
                                </>
                              ) : (
                                <span>Denied</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <label
                      key={perm.id}
                      className={`perm-toggle-row ${isGranted ? 'is-granted' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isGranted}
                        onChange={() => togglePermission(perm.id)}
                        className="perm-checkbox-input"
                        aria-label={`Toggle permission ${perm.name}`}
                      />
                      <div className="perm-details-text">
                        <div className="perm-name-row">
                          <span className="perm-name-label">{perm.name}</span>
                          <PermissionActionBadge action={perm.action} />
                        </div>
                        {perm.description && (
                          <span className="perm-desc-label">{perm.description}</span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
