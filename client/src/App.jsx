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

// Admin Pages (Lazy)
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));

// Messages (Lazy)
const Messages = React.lazy(() => import('./pages/Messages'));

// Public Pages (Lazy)
const PublicPortfolio = React.lazy(() => import('./pages/PublicPortfolio'));
const PublicIdentity = React.lazy(() => import('./pages/PublicIdentity'));

// Legacy Pages (Lazy)
const CollegeDashboard = React.lazy(() => import('./pages/CollegeDashboard'));


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
                <CollegeDashboard />
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

            {/* ─── Super Admin Dashboard ─────────────────────────── */}
            <Route path="/dashboard/admin" element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

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
          </Routes>
        </React.Suspense>
      </div>
    </Router>
  );
};

export default App;
