import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { PublicRoute } from './components/guards/PublicRoute';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { EmailVerificationPage } from './pages/EmailVerificationPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { SessionManagementPage } from './pages/SessionManagementPage';
import { ProfilePage } from './pages/ProfilePage';
import { WorkspacePage } from './pages/workspace/WorkspacePage';
import { WorkspaceSwitcherPage } from './pages/workspace/WorkspaceSwitcherPage';
import { WorkspaceMembersPage } from './pages/workspace/WorkspaceMembersPage';
import { WorkspaceRolesPage } from './pages/workspace/WorkspaceRolesPage';
import { WorkspaceSettingsPage } from './pages/workspace/WorkspaceSettingsPage';
import { UsersPage } from './pages/users/UsersPage';
import { InviteUserPage } from './pages/users/InviteUserPage';
import { UserDetailsPage } from './pages/users/UserDetailsPage';
import { EditUserPage } from './pages/users/EditUserPage';
import { UserActivitiesPage } from './pages/users/UserActivitiesPage';
import { UserPerformancePage } from './pages/users/UserPerformancePage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Routes>
      {/* Root redirect depending on authentication state */}
      <Route
        path="/"
        element={
          isLoading ? (
            <div className="auth-loading-screen" role="status">
              <span className="auth-loading-msg">Loading CRM Portal...</span>
            </div>
          ) : isAuthenticated ? (
            <Navigate to="/workspaces" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Public Authentication Routes (Guarded: redirect to workspaces if already logged in) */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
      </Route>

      {/* Protected Routes (Guarded: redirect to login if unauthenticated) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/workspaces" element={<WorkspacePage />} />
        <Route path="/workspaces/switcher" element={<WorkspaceSwitcherPage />} />
        <Route path="/workspaces/members" element={<WorkspaceMembersPage />} />
        <Route path="/workspaces/roles" element={<WorkspaceRolesPage />} />
        <Route path="/workspaces/settings" element={<WorkspaceSettingsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/invite" element={<InviteUserPage />} />
        <Route path="/users/:id" element={<UserDetailsPage />} />
        <Route path="/users/:id/edit" element={<EditUserPage />} />
        <Route path="/users/:id/activities" element={<UserActivitiesPage />} />
        <Route path="/users/:id/performance" element={<UserPerformancePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/sessions" element={<SessionManagementPage />} />
      </Route>

      {/* Fallback 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
