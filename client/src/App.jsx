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

// Recruiter Pages (Lazy)
const JobManagement = React.lazy(() => import('./pages/recruiter/JobManagement'));
const CompanyProfile = React.lazy(() => import('./pages/recruiter/CompanyProfile'));
const Analytics = React.lazy(() => import('./pages/recruiter/Analytics'));
const HiringPipeline = React.lazy(() => import('./pages/recruiter/HiringPipeline'));

// Public Pages (Lazy)
const PublicPortfolio = React.lazy(() => import('./pages/PublicPortfolio'));
const PublicIdentity = React.lazy(() => import('./pages/PublicIdentity'));

// Legacy Pages (Lazy)
const CollegeDashboard = React.lazy(() => import('./pages/CollegeDashboard'));
const RecruiterDashboard = React.lazy(() => import('./pages/RecruiterDashboard'));

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

            {/* ─── Recruiter Dashboard ───────────────────────────── */}
            <Route path="/dashboard/recruiter" element={
              <ProtectedRoute roles={['recruiter', 'admin']}>
                <RecruiterDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/recruiter/pipeline" element={
              <ProtectedRoute roles={['recruiter', 'admin']}>
                <HiringPipeline />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/recruiter/jobs" element={
              <ProtectedRoute roles={['recruiter', 'admin']}>
                <JobManagement />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/recruiter/company" element={
              <ProtectedRoute roles={['recruiter', 'admin']}>
                <CompanyProfile />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/recruiter/analytics" element={
              <ProtectedRoute roles={['recruiter', 'admin']}>
                <Analytics />
              </ProtectedRoute>
            } />

            {/* ─── Teacher Dashboard ─────────────────────────────── */}
            <Route path="/dashboard/teacher" element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <CollegeDashboard />
              </ProtectedRoute>
            } />
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
