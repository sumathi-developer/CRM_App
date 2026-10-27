import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth.service';
import type { SessionInfo } from '../types/auth.types';
import { Navbar } from '../components/common/Navbar';
import { SuccessMessage } from '../components/auth/SuccessMessage';
import { ErrorMessage } from '../components/auth/ErrorMessage';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import {
  MonitorIcon,
  SmartphoneIcon,
  TabletIcon,
  ShieldIcon,
  LogOutIcon,
  RefreshCwIcon,
  ClockIcon,
  CheckCircleIcon,
} from '../components/common/Icons';

export const SessionManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [sessions, setSessions] = useState<SessionInfo[]>(() => {
    try {
      return authService.getSessions();
    } catch {
      return [];
    }
  });
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRevokingOther, setIsRevokingOther] = useState(false);
  const [isLoggingOutCurrent, setIsLoggingOutCurrent] = useState(false);

  const loadSessions = () => {
    try {
      const active = authService.getSessions();
      setSessions(active);
    } catch {
      setErrorMsg('Failed to load session list');
    }
  };

  const handleRevokeSingle = (sessionId: string, deviceName: string) => {
    try {
      const updated = authService.revokeSession(sessionId);
      setSessions(updated);
      setSuccessMsg(`Session for "${deviceName}" was successfully revoked.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch {
      setErrorMsg('Failed to revoke session');
    }
  };

  const handleRevokeAllOthers = () => {
    setIsRevokingOther(true);
    try {
      const remaining = authService.revokeOtherSessions();
      setSessions(remaining);
      setSuccessMsg('All other active sessions and refresh tokens have been revoked.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch {
      setErrorMsg('Failed to revoke other sessions');
    } finally {
      setIsRevokingOther(false);
    }
  };

  const handleCurrentLogout = async () => {
    setIsLoggingOutCurrent(true);
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggingOutCurrent(false);
    }
  };

  const getDeviceIcon = (type: SessionInfo['deviceType']) => {
    switch (type) {
      case 'mobile':
        return <SmartphoneIcon size={24} className="device-icon mobile" />;
      case 'tablet':
        return <TabletIcon size={24} className="device-icon tablet" />;
      default:
        return <MonitorIcon size={24} className="device-icon desktop" />;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="authenticated-page-layout">
      <Navbar />

      <main className="authenticated-container" id="session-management-page">
        <div className="page-header">
          <div className="page-title-group">
            <h1 className="page-title">Active Sessions & Devices</h1>
            <p className="page-subtitle">
              Monitor active logins across your desktop, tablets, and mobile devices
            </p>
          </div>

          <div className="page-actions-group">
            <button
              type="button"
              className="refresh-btn-secondary"
              onClick={loadSessions}
              title="Refresh sessions list"
            >
              <RefreshCwIcon size={16} />
              <span>Refresh</span>
            </button>
            {otherSessionsCount > 0 && (
              <PrimaryButton
                type="button"
                variant="outline"
                size="small"
                fullWidth={false}
                isLoading={isRevokingOther}
                onClick={handleRevokeAllOthers}
                icon={<LogOutIcon size={16} />}
                id="btn-revoke-other-sessions"
              >
                Sign Out All Other Devices ({otherSessionsCount})
              </PrimaryButton>
            )}
          </div>
        </div>

        <ErrorMessage
          error={errorMsg}
          onDismiss={() => setErrorMsg(null)}
          title="Session Action Error"
        />

        <SuccessMessage
          message={successMsg}
          onDismiss={() => setSuccessMsg(null)}
          title="Session Status Updated"
        />

        <div className="sessions-list-container">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`session-card ${session.isCurrent ? 'is-current-session' : ''}`}
              id={`session-${session.id}`}
            >
              <div className="session-card-main">
                <div className="session-device-icon-wrap" aria-hidden="true">
                  {getDeviceIcon(session.deviceType)}
                </div>

                <div className="session-details">
                  <div className="session-title-row">
                    <h3 className="session-device-name">{session.device}</h3>
                    {session.isCurrent ? (
                      <span className="current-badge" id="current-device-badge">
                        <CheckCircleIcon size={12} />
                        <span>Current Session</span>
                      </span>
                    ) : (
                      <span className="active-badge">Active</span>
                    )}
                  </div>

                  <div className="session-meta-row">
                    <span className="meta-item">
                      <strong>IP:</strong> {session.ipAddress}
                    </span>
                    <span className="meta-separator">&bull;</span>
                    <span className="meta-item">
                      <strong>Location:</strong> {session.location}
                    </span>
                    <span className="meta-separator">&bull;</span>
                    <span className="meta-item">
                      <ClockIcon size={13} className="meta-icon" />
                      <span>Last active: {formatDate(session.lastActive)}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="session-card-actions">
                {session.isCurrent ? (
                  <button
                    type="button"
                    className="session-action-btn logout-current-btn"
                    onClick={handleCurrentLogout}
                    disabled={isLoggingOutCurrent}
                  >
                    <LogOutIcon size={14} />
                    <span>{isLoggingOutCurrent ? 'Signing out...' : 'Sign Out Here'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="session-action-btn revoke-btn"
                    onClick={() => handleRevokeSingle(session.id, session.device)}
                  >
                    <LogOutIcon size={14} />
                    <span>Revoke Access</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {sessions.length === 0 && (
            <div className="empty-sessions-state">
              <ShieldIcon size={36} />
              <p>No active sessions detected.</p>
            </div>
          )}
        </div>

        {/* Security Info Card */}
        <div className="session-security-footer-box">
          <ShieldIcon size={20} className="footer-shield-icon" />
          <div>
            <h4>Enterprise Security Overview</h4>
            <p>
              If you notice any unfamiliar devices or unexpected locations, revoke the session immediately and change your account password.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
