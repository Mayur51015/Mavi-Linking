import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';

// Page Loader Component for Router Suspense
const PageLoader = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary, #09090b)',
  }}>
    <div style={{ textAlign: 'center' }}>
      <div className="animate-pulse" style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: 'var(--gradient-primary, linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%))',
        margin: '0 auto 1rem',
      }} />
      <p style={{ color: 'var(--text-secondary, #a1a1aa)', fontSize: '0.9rem', fontFamily: 'Outfit, sans-serif' }}>
        Loading experience...
      </p>
    </div>
  </div>
);

// Auth Pages (Lazy)
const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const ActivateAccount = React.lazy(() => import('./pages/ActivateAccount'));
const VerifyAccount = React.lazy(() => import('./pages/VerifyAccount'));
const PendingApproval = React.lazy(() => import('./pages/PendingApproval'));
const ChangePassword = React.lazy(() => import('./pages/ChangePassword'));

import RequirePasswordChange from './routes/RequirePasswordChange';

// User/Student Pages (Lazy)
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const AccountLinking = React.lazy(() => import('./pages/AccountLinking'));
const AIInsights = React.lazy(() => import('./pages/AIInsights'));
const ProjectManagement = React.lazy(() => import('./pages/ProjectManagement'));
const CompatibilityPage = React.lazy(() => import('./pages/CompatibilityPage'));
const StudentAvailability = React.lazy(() => import('./pages/StudentAvailability'));
const StudentJobs = React.lazy(() => import('./pages/StudentJobs'));

// Recruiter Pages (Lazy)
const RecruiterOverview = React.lazy(() => import('./pages/recruiter/RecruiterOverview'));
const RecruiterSearch = React.lazy(() => import('./pages/recruiter/RecruiterSearch'));
const RecruiterBookmarks = React.lazy(() => import('./pages/recruiter/RecruiterBookmarks'));
const RecruiterCompare = React.lazy(() => import('./pages/recruiter/RecruiterCompare'));
const RecruitmentPipelinePage = React.lazy(() => import('./pages/recruiter/RecruitmentPipeline'));
const CompanyProfile = React.lazy(() => import('./pages/recruiter/CompanyProfile'));
const JobManagement = React.lazy(() => import('./pages/recruiter/JobManagement'));

// Teacher Pages (Lazy)
const TeacherDashboard = React.lazy(() => import('./pages/teacher/TeacherDashboard'));
const TeacherStudents = React.lazy(() => import('./pages/teacher/TeacherStudents'));
const TeacherReadiness = React.lazy(() => import('./pages/teacher/TeacherReadiness'));
const TeacherLeaderboard = React.lazy(() => import('./pages/teacher/TeacherLeaderboard'));
const PlacementDrives = React.lazy(() => import('./pages/teacher/PlacementDrives'));
const StudentVerification = React.lazy(() => import('./pages/teacher/StudentVerification'));
const TeacherAnnouncements = React.lazy(() => import('./pages/teacher/TeacherAnnouncements'));
const TeacherDocuments = React.lazy(() => import('./pages/teacher/TeacherDocuments'));

// Student New Pages (Lazy)
const StudentAnnouncements = React.lazy(() => import('./pages/StudentAnnouncements'));
const StudentDocuments = React.lazy(() => import('./pages/StudentDocuments'));

import AdminRoute from './routes/AdminRoute';
import SuperAdminRoute from './routes/SuperAdminRoute';
import OwnerRoute from './routes/OwnerRoute';

// ...
// Admin & Super Admin Pages (Lazy)
const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin'));
const AdminAcceptInvite = React.lazy(() => import('./pages/admin/AdminAcceptInvite'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const DepartmentAdminDashboard = React.lazy(() => import('./pages/department/DepartmentAdminDashboard'));
const SuperAdminLogin = React.lazy(() => import('./pages/superadmin/SuperAdminLogin'));
const SuperAdminDashboard = React.lazy(() => import('./pages/superadmin/SuperAdminDashboard'));
const OwnerLogin = React.lazy(() => import('./pages/owner/OwnerLogin'));
const PlatformOwnerDashboard = React.lazy(() => import('./pages/owner/PlatformOwnerDashboard'));

// Messages (Lazy)
const Messages = React.lazy(() => import('./pages/Messages'));

// Public Pages (Lazy)
const PublicPortfolio = React.lazy(() => import('./pages/PublicPortfolio'));
const PublicIdentity = React.lazy(() => import('./pages/PublicIdentity'));

// Legacy Pages (Lazy)
const CollegeDashboard = React.lazy(() => import('./pages/CollegeDashboard'));

// Error Pages (Lazy)
const NotFound = React.lazy(() => import('./pages/NotFound'));


const App = () => {
  return (
    <Router>
      <div className="app-container">

        <React.Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ─── Public Routes ─────────────────────────────────── */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-account" element={<VerifyAccount />} />
            <Route path="/verify-email" element={<VerifyAccount />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/activate-account" element={<ActivateAccount />} />
            <Route path="/change-password" element={<RequirePasswordChange><ChangePassword /></RequirePasswordChange>} />

            {/* ─── User/Student Dashboard ────────────────────────── */}
            <Route path="/dashboard" element={
              <ProtectedRoute roles={['user', 'admin']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/link" element={
              <ProtectedRoute roles={['user', 'admin']}>
                <AccountLinking />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/insights" element={
              <ProtectedRoute roles={['user', 'admin']}>
                <AIInsights />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/projects" element={
              <ProtectedRoute roles={['user', 'admin']}>
                <ProjectManagement />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/compatibility" element={
              <ProtectedRoute roles={['user', 'admin']}>
                <CompatibilityPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/availability" element={
              <ProtectedRoute roles={['user', 'admin']}>
                <StudentAvailability />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/jobs" element={
              <ProtectedRoute roles={['user', 'admin']}>
                <StudentJobs />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/announcements" element={
              <ProtectedRoute roles={['user', 'admin']}>
                <StudentAnnouncements />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/documents" element={
              <ProtectedRoute roles={['user', 'admin']}>
                <StudentDocuments />
              </ProtectedRoute>
            } />

            {/* ─── Recruiter Dashboard ───────────────────────────── */}
            <Route path="/dashboard/recruiter" element={
              <ProtectedRoute roles={['recruiter', 'admin']}>
                <RecruiterOverview />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/recruiter/company" element={
              <ProtectedRoute roles={['recruiter', 'admin']}>
                <CompanyProfile />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/recruiter/jobs" element={
              <ProtectedRoute roles={['recruiter', 'admin']}>
                <JobManagement />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/recruiter/search" element={
              <ProtectedRoute roles={['recruiter', 'admin']}>
                <RecruiterSearch />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/recruiter/bookmarks" element={
              <ProtectedRoute roles={['recruiter', 'admin']}>
                <RecruiterBookmarks />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/recruiter/compare" element={
              <ProtectedRoute roles={['recruiter', 'admin']}>
                <RecruiterCompare />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/recruiter/pipeline" element={
              <ProtectedRoute roles={['recruiter', 'admin']}>
                <RecruitmentPipelinePage />
              </ProtectedRoute>
            } />

            {/* ─── Teacher Dashboard ─────────────────────────────── */}
            <Route path="/dashboard/teacher" element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/teacher/students" element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <TeacherStudents />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/teacher/readiness" element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <TeacherReadiness />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/teacher/leaderboard" element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <TeacherLeaderboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/teacher/drives" element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <PlacementDrives />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/teacher/verification" element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <StudentVerification />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/teacher/announcements" element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <TeacherAnnouncements />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/teacher/documents" element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <TeacherDocuments />
              </ProtectedRoute>
            } />

            <Route path="/department-admin" element={
              <ProtectedRoute roles={['department_admin', 'institution_admin', 'super_admin', 'platform_owner', 'admin']}>
                <DepartmentAdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/department-admin" element={
              <ProtectedRoute roles={['department_admin', 'institution_admin', 'super_admin', 'platform_owner', 'admin']}>
                <DepartmentAdminDashboard />
              </ProtectedRoute>
            } />

            {/* ─── Operational Admin Portal ───────────────────────────────── */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/accept-invite" element={<AdminAcceptInvite />} />
            <Route path="/admin/setup-account" element={<AdminAcceptInvite />} />
            <Route path="/admin/invitation" element={<AdminAcceptInvite />} />
            <Route path="/accept-admin-invite" element={<AdminAcceptInvite />} />
            <Route path="/accept-admin-invitation" element={<AdminAcceptInvite />} />
            <Route path="/setup-admin-account" element={<AdminAcceptInvite />} />
            <Route path="/activate-admin-account" element={<AdminAcceptInvite />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard activeTab="overview" /></AdminRoute>} />
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard activeTab="overview" /></AdminRoute>} />
            <Route path="/admin/students" element={<AdminRoute><AdminDashboard activeTab="students" /></AdminRoute>} />
            <Route path="/admin/teachers" element={<AdminRoute><AdminDashboard activeTab="teachers" /></AdminRoute>} />
            <Route path="/admin/recruiters" element={<AdminRoute><AdminDashboard activeTab="recruiters" /></AdminRoute>} />
            <Route path="/admin/verifications" element={<AdminRoute><AdminDashboard activeTab="verifications" /></AdminRoute>} />
            <Route path="/admin/departments" element={<AdminRoute><AdminDashboard activeTab="departments" /></AdminRoute>} />
            <Route path="/admin/announcements" element={<AdminRoute><AdminDashboard activeTab="announcements" /></AdminRoute>} />
            <Route path="/admin/reports" element={<AdminRoute><AdminDashboard activeTab="reports" /></AdminRoute>} />
            <Route path="/admin/analytics" element={<AdminRoute><AdminDashboard activeTab="analytics" /></AdminRoute>} />
            <Route path="/admin/documents" element={<AdminRoute><AdminDashboard activeTab="documents" /></AdminRoute>} />
            <Route path="/admin/billing" element={<AdminRoute><AdminDashboard activeTab="billing" /></AdminRoute>} />
            <Route path="/admin/audit-logs" element={<AdminRoute><AdminDashboard activeTab="audit-logs" /></AdminRoute>} />
            <Route path="/admin/audit" element={<AdminRoute><AdminDashboard activeTab="audit-logs" /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminDashboard activeTab="settings" /></AdminRoute>} />
            <Route path="/admin/profile" element={<AdminRoute><AdminDashboard activeTab="profile" /></AdminRoute>} />
            <Route path="/dashboard/admin" element={<AdminRoute><AdminDashboard activeTab="overview" /></AdminRoute>} />

            {/* ─── Super Admin Portal ───────────────────────────────────── */}
            <Route path="/super-admin/login" element={<SuperAdminLogin />} />
            <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminDashboard activeTab="overview" /></SuperAdminRoute>} />
            <Route path="/super-admin/overview" element={<SuperAdminRoute><SuperAdminDashboard activeTab="overview" /></SuperAdminRoute>} />
            <Route path="/super-admin/institutions" element={<SuperAdminRoute><SuperAdminDashboard activeTab="institutions" /></SuperAdminRoute>} />
            <Route path="/super-admin/institution-admins" element={<SuperAdminRoute><SuperAdminDashboard activeTab="institution-admins" /></SuperAdminRoute>} />
            <Route path="/super-admin/admins" element={<SuperAdminRoute><SuperAdminDashboard activeTab="institution-admins" /></SuperAdminRoute>} />
            <Route path="/super-admin/users" element={<SuperAdminRoute><SuperAdminDashboard activeTab="users" /></SuperAdminRoute>} />
            <Route path="/super-admin/verification" element={<SuperAdminRoute><SuperAdminDashboard activeTab="verification" /></SuperAdminRoute>} />
            <Route path="/super-admin/verifications" element={<SuperAdminRoute><SuperAdminDashboard activeTab="verification" /></SuperAdminRoute>} />
            <Route path="/super-admin/licenses" element={<SuperAdminRoute><SuperAdminDashboard activeTab="licenses" /></SuperAdminRoute>} />
            <Route path="/super-admin/analytics" element={<SuperAdminRoute><SuperAdminDashboard activeTab="analytics" /></SuperAdminRoute>} />
            <Route path="/super-admin/security" element={<SuperAdminRoute><SuperAdminDashboard activeTab="security" /></SuperAdminRoute>} />
            <Route path="/super-admin/audit-logs" element={<SuperAdminRoute><SuperAdminDashboard activeTab="audit-logs" /></SuperAdminRoute>} />
            <Route path="/super-admin/audit" element={<SuperAdminRoute><SuperAdminDashboard activeTab="audit-logs" /></SuperAdminRoute>} />
            <Route path="/super-admin/settings" element={<SuperAdminRoute><SuperAdminDashboard activeTab="settings" /></SuperAdminRoute>} />
            <Route path="/super-admin/profile" element={<SuperAdminRoute><SuperAdminDashboard activeTab="profile" /></SuperAdminRoute>} />

            {/* ─── Platform Owner Portal ─────────────────────────────────── */}
            <Route path="/owner/login" element={<OwnerLogin />} />
            <Route path="/owner" element={<OwnerRoute><PlatformOwnerDashboard activeTab="overview" /></OwnerRoute>} />
            <Route path="/owner/overview" element={<OwnerRoute><PlatformOwnerDashboard activeTab="overview" /></OwnerRoute>} />
            <Route path="/owner/tenants" element={<OwnerRoute><PlatformOwnerDashboard activeTab="tenants" /></OwnerRoute>} />
            <Route path="/owner/institutions" element={<OwnerRoute><PlatformOwnerDashboard activeTab="tenants" /></OwnerRoute>} />
            <Route path="/owner/admins" element={<OwnerRoute><PlatformOwnerDashboard activeTab="admins" /></OwnerRoute>} />
            <Route path="/owner/users" element={<OwnerRoute><PlatformOwnerDashboard activeTab="users" /></OwnerRoute>} />
            <Route path="/owner/licensing" element={<OwnerRoute><PlatformOwnerDashboard activeTab="licensing" /></OwnerRoute>} />
            <Route path="/owner/licenses" element={<OwnerRoute><PlatformOwnerDashboard activeTab="licensing" /></OwnerRoute>} />
            <Route path="/owner/subscriptions" element={<OwnerRoute><PlatformOwnerDashboard activeTab="subscriptions" /></OwnerRoute>} />
            <Route path="/owner/analytics" element={<OwnerRoute><PlatformOwnerDashboard activeTab="analytics" /></OwnerRoute>} />
            <Route path="/owner/security" element={<OwnerRoute><PlatformOwnerDashboard activeTab="security" /></OwnerRoute>} />
            <Route path="/owner/configuration" element={<OwnerRoute><PlatformOwnerDashboard activeTab="system" /></OwnerRoute>} />
            <Route path="/owner/system" element={<OwnerRoute><PlatformOwnerDashboard activeTab="system" /></OwnerRoute>} />
            <Route path="/owner/audit-logs" element={<OwnerRoute><PlatformOwnerDashboard activeTab="audit" /></OwnerRoute>} />
            <Route path="/owner/audit" element={<OwnerRoute><PlatformOwnerDashboard activeTab="audit" /></OwnerRoute>} />
            <Route path="/owner/settings" element={<OwnerRoute><PlatformOwnerDashboard activeTab="settings" /></OwnerRoute>} />
            <Route path="/owner/profile" element={<OwnerRoute><PlatformOwnerDashboard activeTab="settings" /></OwnerRoute>} />

            {/* ─── Communication Inbox ────────────────────────────── */}
            <Route path="/dashboard/messages" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />

            {/* ─── Legacy Routes (backward compat) ──────────────── */}
            <Route path="/dashboard/college" element={
              <ProtectedRoute>
                <CollegeDashboard />
              </ProtectedRoute>
            } />

            {/* ─── Public Identity & Portfolio ────────────────────── */}
            <Route path="/u/:username" element={<PublicIdentity />} />
            <Route path="/portfolio/:id" element={<PublicPortfolio />} />

            {/* ─── 404 Not Found (catch-all, must be last) ────────── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </React.Suspense>
      </div>
    </Router>
  );
};

export default App;
