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
import { UsersListPage } from './pages/users/UsersListPage';
import { InviteUserPage } from './pages/users/InviteUserPage';
import { UserDetailsPage } from './pages/users/UserDetailsPage';
import { EditUserPage } from './pages/users/EditUserPage';
import { UserActivitiesPage } from './pages/users/UserActivitiesPage';
import { UserPerformancePage } from './pages/users/UserPerformancePage';
import { TeamsListPage } from './pages/teams/TeamsListPage';
import { CreateTeamPage } from './pages/teams/CreateTeamPage';
import { TeamDetailsPage } from './pages/teams/TeamDetailsPage';
import { EditTeamPage } from './pages/teams/EditTeamPage';
import { TeamMembersPage } from './pages/teams/TeamMembersPage';
import { TeamActivitiesPage } from './pages/teams/TeamActivitiesPage';
import { TeamPerformancePage } from './pages/teams/TeamPerformancePage';
import { RolesListPage } from './pages/roles/RolesListPage';
import { CreateRolePage } from './pages/roles/CreateRolePage';
import { RoleDetailsPage } from './pages/roles/RoleDetailsPage';
import { EditRolePage } from './pages/roles/EditRolePage';
import { CustomFieldsListPage } from './pages/custom-fields/CustomFieldsListPage';
import { CreateCustomFieldPage } from './pages/custom-fields/CreateCustomFieldPage';
import { CustomFieldDetailsPage } from './pages/custom-fields/CustomFieldDetailsPage';
import { EditCustomFieldPage } from './pages/custom-fields/EditCustomFieldPage';
import { TagsListPage } from './pages/tags/TagsListPage';
import { CreateTagPage } from './pages/tags/CreateTagPage';
import { EditTagPage } from './pages/tags/EditTagPage';
import { TagUsagePage } from './pages/tags/TagUsagePage';
import { LeadGenOverviewPage } from './pages/lead-generation/LeadGenOverviewPage';
import { SourcesListPage } from './pages/lead-generation/SourcesListPage';
import { SourceFormPage } from './pages/lead-generation/SourceFormPage';
import { SourceDetailsPage } from './pages/lead-generation/SourceDetailsPage';
import { WebFormsListPage } from './pages/lead-generation/WebFormsListPage';
import { FormBuilderPage } from './pages/lead-generation/FormBuilderPage';
import { CaptureFormsPage } from './pages/lead-generation/CaptureFormsPage';
import { ManualCapturePage } from './pages/lead-generation/ManualCapturePage';
import { ChannelLeadsPage } from './pages/lead-generation/ChannelLeadsPage';
import { ScoringPage } from './pages/lead-generation/ScoringPage';
import { QualificationPage } from './pages/lead-generation/QualificationPage';
import { RoutingPage } from './pages/lead-generation/RoutingPage';
import { AssignmentRulesPage } from './pages/lead-generation/AssignmentRulesPage';
import { LeadGenAnalyticsPage } from './pages/lead-generation/LeadGenAnalyticsPage';
import { SourceAnalyticsPage } from './pages/lead-generation/SourceAnalyticsPage';
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
        <Route path="/users" element={<UsersListPage />} />
        <Route path="/users/invite" element={<InviteUserPage />} />
        <Route path="/users/:id" element={<UserDetailsPage />} />
        <Route path="/users/:id/edit" element={<EditUserPage />} />
        <Route path="/users/:id/activities" element={<UserActivitiesPage />} />
        <Route path="/users/:id/performance" element={<UserPerformancePage />} />
        <Route path="/teams" element={<TeamsListPage />} />
        <Route path="/teams/create" element={<CreateTeamPage />} />
        <Route path="/teams/:id" element={<TeamDetailsPage />} />
        <Route path="/teams/:id/edit" element={<EditTeamPage />} />
        <Route path="/teams/:id/members" element={<TeamMembersPage />} />
        <Route path="/teams/:id/activities" element={<TeamActivitiesPage />} />
        <Route path="/teams/:id/performance" element={<TeamPerformancePage />} />
        <Route path="/roles" element={<RolesListPage />} />
        <Route path="/roles/create" element={<CreateRolePage />} />
        <Route path="/roles/:id" element={<RoleDetailsPage />} />
        <Route path="/roles/:id/edit" element={<EditRolePage />} />
        <Route path="/custom-fields" element={<CustomFieldsListPage />} />
        <Route path="/custom-fields/create" element={<CreateCustomFieldPage />} />
        <Route path="/custom-fields/:id" element={<CustomFieldDetailsPage />} />
        <Route path="/custom-fields/:id/edit" element={<EditCustomFieldPage />} />
        <Route path="/tags" element={<TagsListPage />} />
        <Route path="/tags/create" element={<CreateTagPage />} />
        <Route path="/tags/usage" element={<TagUsagePage />} />
        <Route path="/tags/:id/edit" element={<EditTagPage />} />
        <Route path="/tags/:id/usage" element={<TagUsagePage />} />

        {/* Lead Generation Module Routes */}
        <Route path="/lead-generation" element={<LeadGenOverviewPage />} />
        <Route path="/lead-generation/sources" element={<SourcesListPage />} />
        <Route path="/lead-generation/sources/create" element={<SourceFormPage />} />
        <Route path="/lead-generation/sources/:id/edit" element={<SourceFormPage />} />
        <Route path="/lead-generation/sources/:id" element={<SourceDetailsPage />} />
        <Route path="/lead-generation/forms" element={<WebFormsListPage />} />
        <Route path="/lead-generation/forms/create" element={<FormBuilderPage />} />
        <Route path="/lead-generation/forms/:id/edit" element={<FormBuilderPage />} />
        <Route path="/lead-generation/capture-forms" element={<CaptureFormsPage />} />
        <Route path="/lead-generation/manual-capture" element={<ManualCapturePage />} />
        <Route path="/lead-generation/leads/:channel" element={<ChannelLeadsPage />} />
        <Route path="/lead-generation/scoring" element={<ScoringPage />} />
        <Route path="/lead-generation/qualification" element={<QualificationPage />} />
        <Route path="/lead-generation/routing" element={<RoutingPage />} />
        <Route path="/lead-generation/assignment-rules" element={<AssignmentRulesPage />} />
        <Route path="/lead-generation/analytics" element={<LeadGenAnalyticsPage />} />
        <Route path="/lead-generation/analytics/sources" element={<SourceAnalyticsPage />} />

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
