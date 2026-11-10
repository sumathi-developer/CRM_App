import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { teamService } from '../../services/team.service';
import { userService } from '../../services/user.service';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/useWorkspace';
import type { User } from '../../types/auth.types';
import type { CreateTeamPayload, TeamStatus } from '../../types/team.types';
import { Navbar } from '../../components/common/Navbar';
import { FormField } from '../../components/auth/FormField';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import {
  ShieldIcon,
  CrownIcon,
  PaletteIcon,
  UsersIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from '../../components/common/Icons';

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
];

export const CreateTeamPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { currentWorkspace, userRoleInWorkspace } = useWorkspace();

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [status, setStatus] = useState<TeamStatus>('ACTIVE');
  const [targetRevenue, setTargetRevenue] = useState<string>('100000');
  const [ownerId, setOwnerId] = useState<string>('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Workspace Users
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  const canManageTeams =
    currentUser?.role?.name === 'ADMIN' ||
    currentUser?.role?.name === 'MANAGER' ||
    userRoleInWorkspace === 'OWNER' ||
    userRoleInWorkspace === 'ADMIN';

  useEffect(() => {
    let ignore = false;

    const loadUsers = async () => {
      try {
        const response = await userService.getUsers({ limit: 100 });
        if (!ignore) {
          const users = response.data || [];
          setAvailableUsers(users);

          // Default owner to current user if available, else first user
          if (currentUser?.id) {
            setOwnerId(currentUser.id);
          } else if (users.length > 0) {
            setOwnerId(users[0].id);
          }
        }
      } catch (err: any) {
        if (!ignore) {
          console.error('Failed to load users for team assignment:', err);
        }
      } finally {
        if (!ignore) {
          setIsLoadingUsers(false);
        }
      }
    };

    loadUsers();
    return () => {
      ignore = true;
    };
  }, [currentUser]);

  // Auto-generate slug preview from name
  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(autoSlug);
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setApiError('Team name is required.');
      return;
    }

    const revNum = parseFloat(targetRevenue) || 0;
    if (revNum < 0) {
      setApiError('Target revenue cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const payload: CreateTeamPayload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        color,
        status,
        targetRevenue: revNum,
        ownerId: ownerId || undefined,
        workspaceId: currentWorkspace?.id || undefined,
        memberUserIds: selectedMemberIds.length > 0 ? selectedMemberIds : undefined,
      };

      const createdTeam = await teamService.createTeam(payload);
      setApiSuccess(`Team "${createdTeam.name}" was successfully created! Redirecting...`);
      setTimeout(() => {
        navigate(`/teams/${createdTeam.id}`);
      }, 1200);
    } catch (err: any) {
      setApiError(err.message || 'Failed to create team. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canManageTeams) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="permission-denied-box">
            <ShieldIcon size={40} className="text-warning" />
            <h2>Access Denied</h2>
            <p>You do not have administrative privileges to create new teams in this workspace.</p>
            <Link to="/teams" className="auth-btn btn-primary">
              Return to Teams Directory
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="authenticated-shell" id="create-team-page">
      <Navbar />

      <main className="authenticated-container">
        {/* Navigation Breadcrumb */}
        <div className="ct-breadcrumb-row">
          <Link to="/teams" className="ct-breadcrumb-link">
            <ArrowLeftIcon size={15} />
            <span>All Teams</span>
          </Link>
          <span className="ct-breadcrumb-sep">/</span>
          <span className="ct-breadcrumb-current">Create New Team</span>
        </div>

        {/* Header */}
        <header className="lg-header" style={{ marginBottom: '1.75rem' }}>
          <div className="lg-header-text">
            <h1 className="lg-title">
              <span className="lg-title-icon" aria-hidden="true">
                <UsersIcon size={22} />
              </span>
              <span>Create New Team</span>
            </h1>
            <p className="lg-subtitle">
              Establish a sales, marketing, or support team with dedicated quotas and enrolled members.
            </p>
          </div>
        </header>

        {/* Global Feedback */}
        {apiError && <ErrorMessage error={apiError} />}
        {apiSuccess && <SuccessMessage message={apiSuccess} />}

        <form onSubmit={handleSubmit} id="form-create-team">
          <div className="ct-form-grid">
            {/* ═══════ Left Column: Main Details Card ═══════ */}
            <div className="ct-main-card">
              <div className="ct-card-header">
                <div className="ct-header-icon">
                  <ShieldIcon size={18} />
                </div>
                <div>
                  <h3 className="ct-card-title">Team Identity & Quota</h3>
                  <p className="ct-card-desc">Define the team designation, slug, branding color, and revenue targets</p>
                </div>
              </div>

              <div className="ct-fields-stack">
                <FormField
                  id="team-name"
                  label="Team Name"
                  type="text"
                  placeholder="e.g. Enterprise Sales Alpha"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />

                <FormField
                  id="team-slug"
                  label="URL Slug (Optional)"
                  type="text"
                  placeholder="enterprise-sales-alpha"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  helperText="Unique URL identifier for this team across CRM workflows."
                />

                <div className="ct-field-group">
                  <label htmlFor="team-description" className="ct-field-label">
                    Description & Scope
                  </label>
                  <textarea
                    id="team-description"
                    className="ct-textarea"
                    rows={3}
                    placeholder="Describe the responsibilities, account focus, or geography of this team..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="ct-row-2col">
                  <FormField
                    id="team-target-revenue"
                    label="Revenue Quota Target"
                    type="number"
                    min="0"
                    step="1000"
                    value={targetRevenue}
                    onChange={(e) => setTargetRevenue(e.target.value)}
                    helperText="Quarterly or annual revenue milestone for quota attainment."
                  />

                  <div className="ct-field-group">
                    <label htmlFor="team-status" className="ct-field-label">
                      Operational Status
                    </label>
                    <div className="form-input-wrapper">
                      <select
                        id="team-status"
                        className="form-input"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as TeamStatus)}
                      >
                        <option value="ACTIVE">Active (Enrolled in pipeline)</option>
                        <option value="INACTIVE">Inactive (Paused operations)</option>
                        <option value="ARCHIVED">Archived (Read-only reference)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Team Branding Color */}
                <div className="ct-field-group">
                  <label className="ct-field-label">
                    <PaletteIcon size={15} />
                    <span>Team Branding Color</span>
                  </label>
                  <div className="ct-color-palette">
                    {PRESET_COLORS.map((hex) => (
                      <button
                        type="button"
                        key={hex}
                        className={`ct-color-swatch ${color === hex ? 'is-active' : ''}`}
                        style={{ backgroundColor: hex }}
                        onClick={() => setColor(hex)}
                        title={`Select color ${hex}`}
                      />
                    ))}
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="ct-color-custom"
                      title="Custom hex color"
                    />
                    <code className="ct-color-code">{color}</code>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══════ Right Column: Sidebar Cards ═══════ */}
            <div className="ct-sidebar-stack">
              {/* Leader Selection */}
              <div className="ct-sidebar-card">
                <div className="ct-card-header">
                  <div className="ct-header-icon ct-icon-amber">
                    <CrownIcon size={18} />
                  </div>
                  <div>
                    <h3 className="ct-card-title">Team Leader</h3>
                    <p className="ct-card-desc">Assign team owner & supervisory role</p>
                  </div>
                </div>

                <div className="ct-field-group" style={{ marginTop: '1rem' }}>
                  <div className="form-input-wrapper">
                    <select
                      id="team-owner-select"
                      className="form-input"
                      value={ownerId}
                      onChange={(e) => setOwnerId(e.target.value)}
                      disabled={isLoadingUsers}
                    >
                      {availableUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role?.name || 'Member'}) ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Initial Members Selection */}
              <div className="ct-sidebar-card">
                <div className="ct-card-header">
                  <div className="ct-header-icon">
                    <UsersIcon size={18} />
                  </div>
                  <div>
                    <h3 className="ct-card-title">Enroll Members</h3>
                    <p className="ct-card-desc">Select users to add ({selectedMemberIds.length} selected)</p>
                  </div>
                </div>

                <div className="ct-members-scroll">
                  {availableUsers
                    .filter((u) => u.id !== ownerId)
                    .map((user) => {
                      const isSelected = selectedMemberIds.includes(user.id);
                      return (
                        <label key={user.id} className={`ct-member-row ${isSelected ? 'is-checked' : ''}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMemberSelection(user.id)}
                            className="ct-member-checkbox"
                          />
                          <div className="ct-member-avatar">
                            {user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="ct-member-info">
                            <span className="ct-member-name">{user.name}</span>
                            <span className="ct-member-email">{user.email}</span>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Submit CTA */}
              <div className="ct-action-row">
                <PrimaryButton
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Creating Team..."
                  icon={<CheckCircleIcon size={16} />}
                >
                  Create Team
                </PrimaryButton>
                <Link to="/teams" className="auth-btn btn-secondary">
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};
