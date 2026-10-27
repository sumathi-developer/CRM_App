import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { teamService } from '../../services/team.service';
import { userService } from '../../services/user.service';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/useWorkspace';
import type { TeamEntity, UpdateTeamPayload, TeamStatus } from '../../types/team.types';
import type { User } from '../../types/auth.types';
import { Navbar } from '../../components/common/Navbar';
import { TeamHeader } from './TeamHeader';
import { FormField } from '../../components/auth/FormField';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../components/auth/SuccessMessage';
import {
  ShieldIcon,
  CrownIcon,
  DollarSignIcon,
  PaletteIcon,
  EditIcon,
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

export const EditTeamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { userRoleInWorkspace } = useWorkspace();

  const [team, setTeam] = useState<TeamEntity | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [status, setStatus] = useState<TeamStatus>('ACTIVE');
  const [targetRevenue, setTargetRevenue] = useState<string>('0');
  const [ownerId, setOwnerId] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.role?.name === 'ADMIN' || userRoleInWorkspace === 'OWNER';
  const isManager = currentUser?.role?.name === 'MANAGER' || userRoleInWorkspace === 'ADMIN';
  const isTeamLeader = currentUser && team?.ownerId === currentUser.id;
  const canEdit = isSuperAdmin || isManager || isTeamLeader;

  useEffect(() => {
    let ignore = false;
    if (!id) return;

    const loadData = async () => {
      try {
        const [teamData, usersData] = await Promise.all([
          teamService.getTeamById(id),
          userService.getUsers({ limit: 100 }),
        ]);

        if (!ignore) {
          setTeam(teamData);
          setAvailableUsers(usersData.data || []);

          setName(teamData.name || '');
          setSlug(teamData.slug || '');
          setDescription(teamData.description || '');
          setColor(teamData.color || '#3b82f6');
          setStatus((teamData.status as TeamStatus) || 'ACTIVE');
          setTargetRevenue(String(teamData.targetRevenue || 0));
          setOwnerId(teamData.ownerId || '');
        }
      } catch (err: any) {
        if (!ignore) {
          setApiError(err.message || 'Failed to load team for editing');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => {
      ignore = true;
    };
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!name.trim()) {
      setApiError('Team name is required.');
      return;
    }

    const revNum = parseFloat(targetRevenue) || 0;
    if (revNum < 0) {
      setApiError('Target revenue cannot be negative.');
      return;
    }

    setIsSaving(true);
    setApiError(null);

    try {
      const payload: UpdateTeamPayload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        color,
        status,
        targetRevenue: revNum,
        ownerId: ownerId || undefined,
      };

      const updated = await teamService.updateTeam(id, payload);
      setTeam(updated);
      setApiSuccess('Team settings updated successfully! Redirecting...');
      setTimeout(() => {
        navigate(`/teams/${id}`);
      }, 1200);
    } catch (err: any) {
      setApiError(err.message || 'Failed to update team settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="module-loading-box">
            <LoadingIndicator size="large" message="Loading team configuration..." />
          </div>
        </main>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="empty-state-box">
            <h2>Team Not Found</h2>
            <Link to="/teams" className="auth-btn btn-primary">
              Return to Teams Directory
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="authenticated-shell">
        <Navbar />
        <main className="authenticated-container">
          <div className="permission-denied-box">
            <ShieldIcon size={40} className="text-warning" />
            <h2>Access Denied</h2>
            <p>Only the team leader, workspace managers, or administrators can edit this team.</p>
            <Link to={`/teams/${id}`} className="auth-btn btn-primary">
              Return to Team Details
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="authenticated-shell" id="edit-team-page">
      <Navbar />

      <main className="authenticated-container">
        {/* Contextual Header */}
        <TeamHeader team={team} canEdit={canEdit} />

        {/* Global Feedback */}
        {apiError && <ErrorMessage error={apiError} />}
        {apiSuccess && <SuccessMessage message={apiSuccess} />}

        <form onSubmit={handleSubmit} id="form-edit-team">
          <div className="team-form-grid">
            {/* Main Form Fields */}
            <div className="form-main-card">
              <div className="card-section-header">
                <div className="section-icon-badge primary">
                  <EditIcon size={18} />
                </div>
                <div>
                  <h3 className="section-title">Edit Team Configuration</h3>
                  <p className="section-desc">Modify team designation, quota milestones, and operational status</p>
                </div>
              </div>

              <div className="form-fields-stack">
                <FormField
                  id="edit-team-name"
                  label="Team Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <FormField
                  id="edit-team-slug"
                  label="URL Slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  helperText="Unique URL identifier for team URLs and integrations."
                />

                <div className="form-group">
                  <label htmlFor="edit-team-desc" className="form-label">
                    Description & Scope
                  </label>
                  <textarea
                    id="edit-team-desc"
                    className="form-textarea"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="form-row-duo">
                  <FormField
                    id="edit-team-target-revenue"
                    label="Revenue Quota Target ($)"
                    type="number"
                    min="0"
                    step="1000"
                    value={targetRevenue}
                    onChange={(e) => setTargetRevenue(e.target.value)}
                    icon={<DollarSignIcon size={16} />}
                  />

                  <div className="form-group">
                    <label htmlFor="edit-team-status" className="form-label">
                      Operational Status
                    </label>
                    <select
                      id="edit-team-status"
                      className="form-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TeamStatus)}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                </div>

                {/* Color Palette */}
                <div className="form-group">
                  <label className="form-label">
                    <PaletteIcon size={16} />
                    <span>Team Branding Color</span>
                  </label>
                  <div className="color-palette-picker">
                    {PRESET_COLORS.map((hex) => (
                      <button
                        type="button"
                        key={hex}
                        className={`color-swatch-circle ${color === hex ? 'is-selected' : ''}`}
                        style={{ backgroundColor: hex }}
                        onClick={() => setColor(hex)}
                        title={`Select color ${hex}`}
                      />
                    ))}
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="custom-color-input"
                    />
                    <code className="color-hex-tag">{color}</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar / Leader Assignment */}
            <div className="form-sidebar-stack">
              <div className="form-sidebar-card">
                <div className="card-section-header">
                  <div className="section-icon-badge warning">
                    <CrownIcon size={18} />
                  </div>
                  <div>
                    <h3 className="section-title">Reassign Leader</h3>
                    <p className="section-desc">Change the designated team owner</p>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <select
                    id="edit-team-owner-select"
                    className="form-select"
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    disabled={!isSuperAdmin && !isManager}
                  >
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                  {!isSuperAdmin && !isManager && (
                    <p className="field-help-text">
                      Only workspace administrators can reassign team leadership.
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="form-action-buttons">
                <PrimaryButton
                  type="submit"
                  isLoading={isSaving}
                  loadingText="Saving Changes..."
                  icon={<CheckCircleIcon size={16} />}
                >
                  Save Changes
                </PrimaryButton>
                <Link to={`/teams/${id}`} className="auth-btn btn-ghost">
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
