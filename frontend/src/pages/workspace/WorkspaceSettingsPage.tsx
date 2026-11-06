import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../context/useWorkspace';
import { workspaceService } from '../../services/workspace.service';
import { Navbar } from '../../components/common/Navbar';
import { WorkspaceHeader } from '../../components/workspace/WorkspaceHeader';
import { WorkspaceSwitcher } from '../../components/workspace/WorkspaceSwitcher';
import { DeleteWorkspaceModal } from '../../components/workspace/DeleteWorkspaceModal';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import {
  CheckCircleIcon,
  UploadIcon,
} from '../../components/common/Icons';
import type { WorkspaceMember } from '../../types/workspace.types';

const AVATAR_COLOR_PALETTE: string[][] = [
  ['#b4b4b4', '#8d8d8d', '#6647f0', '#3e63dd', '#0091ff', '#30a46c', '#ffc53d'],
  ['#f76808', '#e5484d', '#e93d82', '#ab4aba', '#a18072', '#ffffff'],
];

const isHexColor = (val?: string | null): boolean => {
  return !!val && /^#([0-9A-F]{3}){1,2}$/i.test(val);
};

export const WorkspaceSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentWorkspace, canManageWorkspace, refreshCurrentWorkspace, refreshWorkspaces } = useWorkspace();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingWs, setIsDeletingWs] = useState(false);

  const settings = currentWorkspace?.settings;

  // General Fields
  const [name, setName] = useState(currentWorkspace?.name || 'Onseclick Workspace');
  const [slug, setSlug] = useState(currentWorkspace?.slug || 'onseclick-workspace');

  // Avatar State
  const [avatarColor, setAvatarColor] = useState<string>(() => {
    if (currentWorkspace?.avatar && isHexColor(currentWorkspace.avatar)) {
      return currentWorkspace.avatar;
    }
    return '#12a594';
  });
  const [avatarImage, setAvatarImage] = useState<string>(() => {
    if (currentWorkspace?.avatar && !isHexColor(currentWorkspace.avatar)) {
      return currentWorkspace.avatar;
    }
    return '';
  });
  const [isAvatarPopoverOpen, setIsAvatarPopoverOpen] = useState(false);
  const avatarPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preferences Fields
  const [emailNotifications, setEmailNotifications] = useState(settings?.preferences?.emailNotifications ?? true);
  const [autoAssignLeads, setAutoAssignLeads] = useState(settings?.preferences?.autoAssignLeads ?? false);
  const [weeklyDigest, setWeeklyDigest] = useState(settings?.preferences?.weeklyDigest ?? true);

  // Modals & Feedback
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  // Transfer Ownership State
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);
  const [ownerSearchQuery, setOwnerSearchQuery] = useState('');
  const ownerPickerRef = useRef<HTMLDivElement>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  // Close avatar popover on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        avatarPickerRef.current &&
        !avatarPickerRef.current.contains(event.target as Node)
      ) {
        setIsAvatarPopoverOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAvatarPopoverOpen(false);
      }
    };

    if (isAvatarPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAvatarPopoverOpen]);

  // Fetch Workspace Members for Owner Transfer
  useEffect(() => {
    if (!currentWorkspace?.id) return;
    let isCancelled = false;
    workspaceService
      .getMembers(currentWorkspace.id)
      .then((data) => {
        if (!isCancelled && Array.isArray(data)) {
          setMembers(data);
        }
      })
      .catch((err) => {
        console.debug('Failed to fetch members for owner transfer:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [currentWorkspace?.id]);

  // Close owner popover on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        ownerPickerRef.current &&
        !ownerPickerRef.current.contains(event.target as Node)
      ) {
        setIsOwnerDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOwnerDropdownOpen(false);
      }
    };

    if (isOwnerDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOwnerDropdownOpen]);

  useEffect(() => {
    if (currentWorkspace) {
      setName(currentWorkspace.name || 'Onseclick Workspace');
      setSlug(currentWorkspace.slug || 'onseclick-workspace');
      if (currentWorkspace.avatar) {
        if (isHexColor(currentWorkspace.avatar)) {
          setAvatarColor(currentWorkspace.avatar);
          setAvatarImage('');
        } else {
          setAvatarImage(currentWorkspace.avatar);
          setAvatarColor('#12a594');
        }
      }
    }
  }, [
    currentWorkspace?.id,
    currentWorkspace?.name,
    currentWorkspace?.slug,
    currentWorkspace?.avatar,
  ]);

  const handleSelectColor = async (color: string) => {
    setAvatarColor(color);
    setAvatarImage('');
    setIsAvatarPopoverOpen(false);

    if (currentWorkspace?.id && canManageWorkspace) {
      try {
        await workspaceService.updateWorkspace(currentWorkspace.id, {
          avatar: color,
        });
        await refreshCurrentWorkspace();
      } catch (err: any) {
        console.error('Failed to auto-save avatar color:', err);
      }
    }
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setApiError('Please select a valid image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setApiError('Avatar image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setAvatarImage(dataUrl);
      setIsAvatarPopoverOpen(false);

      if (currentWorkspace?.id && canManageWorkspace) {
        try {
          await workspaceService.updateWorkspace(currentWorkspace.id, {
            avatar: dataUrl,
          });
          await refreshCurrentWorkspace();
          setApiSuccess('Workspace avatar updated successfully!');
          setTimeout(() => setApiSuccess(null), 3500);
        } catch (err: any) {
          setApiError(err.message || 'Failed to update avatar');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    let ignore = false;
    if (!currentWorkspace?.id) {
      return;
    }

    const fetchInitialSettings = async () => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out')), 3000)
        );
        const data = await Promise.race([
          workspaceService.getSettings(currentWorkspace.id),
          timeoutPromise,
        ]);
        if (!ignore && data) {
          setName(currentWorkspace.name || 'Onseclick Workspace');
          setSlug(currentWorkspace.slug || 'onseclick-workspace');

          if (data.preferences) {
            setEmailNotifications(data.preferences.emailNotifications ?? true);
            setAutoAssignLeads(data.preferences.autoAssignLeads ?? false);
            setWeeklyDigest(data.preferences.weeklyDigest ?? true);
          }
        }
      } catch (err: any) {
        // Silent fallback without flashing banner to user on initial load
        console.debug('Background settings fetch fallback active:', err?.message);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchInitialSettings();
    return () => {
      ignore = true;
    };
  }, [currentWorkspace?.id]);

  // Save General
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace?.id) return;
    setIsSaving(true);
    setApiError(null);

    try {
      // Update Workspace metadata
      await workspaceService.updateWorkspace(currentWorkspace.id, {
        name,
        slug,
        avatar: avatarImage || avatarColor,
      });

      await refreshCurrentWorkspace();
      setApiSuccess('General information updated successfully!');
      setTimeout(() => setApiSuccess(null), 4000);
    } catch (err: any) {
      setApiError(err.message || 'Failed to save general settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Preferences
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace?.id) return;
    setIsSaving(true);
    setApiError(null);

    try {
      await workspaceService.updatePreferences(currentWorkspace.id, {
        emailNotifications,
        autoAssignLeads,
        weeklyDigest,
      });

      setApiSuccess('Workspace preferences saved!');
      setTimeout(() => setApiSuccess(null), 4000);
    } catch (err: any) {
      setApiError(err.message || 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter members of workspace except owner
  const eligibleMembers = members.filter((m) => {
    const isOwnerRole = (m.role || '').toUpperCase() === 'OWNER';
    const isOwnerUserId =
      m.userId === currentWorkspace?.ownerId ||
      m.user?.id === currentWorkspace?.ownerId;
    return !isOwnerRole && !isOwnerUserId;
  });

  const filteredMembers = eligibleMembers.filter((m) => {
    if (!ownerSearchQuery.trim()) return true;
    const q = ownerSearchQuery.toLowerCase();
    const name = (m.user?.name || '').toLowerCase();
    const email = (m.user?.email || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const handleSelectNewOwner = async (member: WorkspaceMember) => {
    if (!currentWorkspace?.id || !canManageWorkspace) return;
    const memberName = member.user?.name || member.user?.email || 'this member';
    const confirmed = window.confirm(
      `Are you sure you want to transfer ownership of "${currentWorkspace.name}" to ${memberName}?`
    );
    if (!confirmed) return;

    setIsTransferring(true);
    setApiError(null);
    try {
      await workspaceService.transferOwnership(currentWorkspace.id, member.id || member.userId);
      setIsOwnerDropdownOpen(false);
      await refreshCurrentWorkspace();
      setApiSuccess(`Ownership successfully transferred to ${memberName}!`);
      setTimeout(() => setApiSuccess(null), 4000);
    } catch (err: any) {
      setApiError(err.message || 'Failed to transfer ownership');
    } finally {
      setIsTransferring(false);
    }
  };

  // Delete Workspace
  const handleConfirmDeleteWorkspace = async () => {
    if (!currentWorkspace?.id) return;
    setIsDeletingWs(true);

    try {
      await workspaceService.deleteWorkspace(currentWorkspace.id);
      await refreshWorkspaces();
      setIsDeleteModalOpen(false);
      navigate('/workspaces/switcher');
    } catch (err: any) {
      setApiError(err.message || 'Failed to delete workspace');
    } finally {
      setIsDeletingWs(false);
    }
  };

  return (
    <div className="authenticated-page-layout">
      <Navbar />

      <main className="authenticated-container" id="workspace-settings-page">
        <WorkspaceHeader onOpenSwitcher={() => setIsSwitcherOpen(true)} />

        <div className="section-toolbar-row">
          <div>
            <h2 className="section-title">Workspace Configuration</h2>
            <p className="section-desc">
              Manage organization metadata, custom branding, regional formatting, and security controls
            </p>
          </div>
        </div>

        <ErrorMessage
          error={apiError}
          onDismiss={() => setApiError(null)}
          title="Settings Error"
        />

        <SuccessMessage
          message={apiSuccess}
          onDismiss={() => setApiSuccess(null)}
          title="Settings Saved"
        />

        {isLoading ? (
          <div className="workspace-loading-state" role="status">
            <LoadingIndicator size="large" message="Loading workspace settings..." />
          </div>
        ) : (
          <div className="settings-vertical-stack">
            {/* 1. GENERAL */}
            <section className="settings-card-section">
              <h3 className="general-section-heading">General</h3>

              <form onSubmit={handleSaveGeneral} className="general-settings-form" id="form-general-settings">
                <div className="general-card-group">
                  {/* Row 1: Avatar */}
                  <div className="general-card-row">
                    <span className="general-row-label">Avatar</span>
                    <div className="general-avatar-picker-wrapper" ref={avatarPickerRef}>
                      <button
                        type="button"
                        className="general-avatar-btn"
                        onClick={() => setIsAvatarPopoverOpen((prev) => !prev)}
                        style={{
                          backgroundColor: avatarImage ? 'transparent' : avatarColor,
                        }}
                        aria-label="Change workspace avatar"
                        title="Click to select color or upload avatar"
                      >
                        {avatarImage ? (
                          <img src={avatarImage} alt="Workspace avatar" className="general-avatar-img" />
                        ) : (
                          <span className="general-avatar-letter">
                            {name?.trim() ? name.trim()[0].toUpperCase() : 'W'}
                          </span>
                        )}
                      </button>

                      {/* Avatar Popover Menu */}
                      {isAvatarPopoverOpen && (
                        <div className="avatar-popover-card" role="dialog" aria-label="Avatar options">
                          <div className="avatar-popover-title">Color</div>

                          <div className="avatar-palette-grid">
                            {AVATAR_COLOR_PALETTE.map((row, rowIdx) => (
                              <div key={rowIdx} className="avatar-palette-row">
                                {row.map((color) => (
                                  <button
                                    key={color}
                                    type="button"
                                    className={`avatar-color-swatch ${avatarColor.toLowerCase() === color.toLowerCase() && !avatarImage ? 'is-selected' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => handleSelectColor(color)}
                                    title={color}
                                    aria-label={`Select color ${color}`}
                                  />
                                ))}
                              </div>
                            ))}
                          </div>

                          <div className="avatar-popover-divider" />

                          <button
                            type="button"
                            className="avatar-upload-btn"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <UploadIcon size={16} />
                            <span>Upload avatar</span>
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
                            style={{ display: 'none' }}
                            onChange={handleAvatarFileUpload}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Name */}
                  <div className="general-card-row">
                    <label htmlFor="ws-name-input" className="general-row-label">Name</label>
                    <input
                      id="ws-name-input"
                      name="name"
                      type="text"
                      className="general-name-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={!canManageWorkspace || isSaving}
                    />
                  </div>
                </div>

                {canManageWorkspace && (
                  <div className="form-action-row" style={{ marginTop: '16px' }}>
                    <PrimaryButton
                      type="submit"
                      isLoading={isSaving}
                      loadingText="Saving Changes..."
                      icon={<CheckCircleIcon size={16} />}
                      fullWidth={false}
                      id="btn-save-general-settings"
                    >
                      Save Changes
                    </PrimaryButton>
                  </div>
                )}
              </form>
            </section>

            {/* 2. PREFERENCES & AUTOMATION */}
            <section className="settings-card-section">
              <h3 className="general-section-heading">Preferences & Automation</h3>

              <form onSubmit={handleSavePreferences} className="general-settings-form" id="form-preferences-settings">
                <div className="general-card-group">
                  <div className="general-card-row">
                    <div className="toggle-text-wrap">
                      <span className="general-row-label">System Email Notifications</span>
                      <span className="toggle-sub">Notify team members regarding new lead assignments and deal updates</span>
                    </div>
                    <label className="switch-toggle-label">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        disabled={!canManageWorkspace || isSaving}
                      />
                      <span className="switch-toggle-slider" />
                    </label>
                  </div>

                  <div className="general-card-row">
                    <div className="toggle-text-wrap">
                      <span className="general-row-label">Automatic Lead Routing</span>
                      <span className="toggle-sub">Auto-assign new inbound leads evenly across active sales reps</span>
                    </div>
                    <label className="switch-toggle-label">
                      <input
                        type="checkbox"
                        checked={autoAssignLeads}
                        onChange={(e) => setAutoAssignLeads(e.target.checked)}
                        disabled={!canManageWorkspace || isSaving}
                      />
                      <span className="switch-toggle-slider" />
                    </label>
                  </div>

                  <div className="general-card-row">
                    <div className="toggle-text-wrap">
                      <span className="general-row-label">Weekly Performance Digest</span>
                      <span className="toggle-sub">Send executive summary report every Monday at 08:00 AM</span>
                    </div>
                    <label className="switch-toggle-label">
                      <input
                        type="checkbox"
                        checked={weeklyDigest}
                        onChange={(e) => setWeeklyDigest(e.target.checked)}
                        disabled={!canManageWorkspace || isSaving}
                      />
                      <span className="switch-toggle-slider" />
                    </label>
                  </div>
                </div>

                {canManageWorkspace && (
                  <div className="form-action-row" style={{ marginTop: '16px' }}>
                    <PrimaryButton
                      type="submit"
                      isLoading={isSaving}
                      loadingText="Saving Preferences..."
                      icon={<CheckCircleIcon size={16} />}
                      fullWidth={false}
                      id="btn-save-preferences-settings"
                    >
                      Save Preferences
                    </PrimaryButton>
                  </div>
                )}
              </form>
            </section>

            {/* 3. DANGER ZONE */}
            <section className="settings-card-section">
              <div className="danger-zone-wrapper">
                <h3 className="danger-section-heading">Danger zone</h3>

                <div className="danger-card-group">
                  {/* Row 1: Transfer Ownership */}
                  <div className="danger-card-row">
                    <span className="danger-row-title">
                      Transfer full ownership to another person
                    </span>
                    <div className="danger-owner-picker-wrapper" ref={ownerPickerRef}>
                      <button
                        type="button"
                        className="danger-btn-secondary"
                        onClick={() => {
                          setIsOwnerDropdownOpen((prev) => !prev);
                          setOwnerSearchQuery('');
                        }}
                        disabled={!canManageWorkspace || isTransferring}
                      >
                        {isTransferring ? 'Transferring...' : 'Select new owner'}
                      </button>

                      {isOwnerDropdownOpen && (
                        <div className="owner-dropdown-popover" role="dialog" aria-label="Select new workspace owner">
                          <input
                            type="text"
                            className="owner-dropdown-search"
                            placeholder="Search..."
                            value={ownerSearchQuery}
                            onChange={(e) => setOwnerSearchQuery(e.target.value)}
                            autoFocus
                          />

                          <div className="owner-dropdown-divider" />

                          <div className="owner-dropdown-list">
                            {filteredMembers.length > 0 ? (
                              filteredMembers.map((member) => (
                                <button
                                  key={member.id}
                                  type="button"
                                  className="owner-dropdown-item"
                                  onClick={() => handleSelectNewOwner(member)}
                                  disabled={isTransferring}
                                >
                                  <div className="owner-dropdown-avatar">
                                    {member.user?.avatar ? (
                                      <img src={member.user.avatar} alt={member.user.name} />
                                    ) : (
                                      <span>
                                        {(member.user?.name || member.user?.email || 'M').charAt(0).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <span className="owner-dropdown-name">
                                    {member.user?.name || member.user?.email}
                                  </span>
                                </button>
                              ))
                            ) : (
                              <div className="owner-dropdown-empty">
                                {ownerSearchQuery.trim() ? 'No matching members' : 'No eligible members found'}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Delete Workspace */}
                  <div className="danger-card-row">
                    <span className="danger-row-title">
                      Delete this Workspace forever
                    </span>
                    <button
                      type="button"
                      className="danger-btn-solid-danger"
                      onClick={() => setIsDeleteModalOpen(true)}
                      disabled={!canManageWorkspace}
                      id="btn-delete-workspace-trigger"
                    >
                      Delete Workspace
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <WorkspaceSwitcher
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
      />

      <DeleteWorkspaceModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteWorkspace}
        workspaceName={currentWorkspace?.name || 'Workspace'}
        isLoading={isDeletingWs}
      />
    </div>
  );
};
