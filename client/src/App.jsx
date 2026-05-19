import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';

// Auth Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// User/Student Pages
import Dashboard from './pages/Dashboard';
import AccountLinking from './pages/AccountLinking';
import AIInsights from './pages/AIInsights';
import ProjectManagement from './pages/ProjectManagement';
import CompatibilityPage from './pages/CompatibilityPage';

// Recruiter Pages
import RecruiterOverview from './pages/recruiter/RecruiterOverview';
import RecruiterSearch from './pages/recruiter/RecruiterSearch';
import RecruiterBookmarks from './pages/recruiter/RecruiterBookmarks';
import RecruiterCompare from './pages/recruiter/RecruiterCompare';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherStudents from './pages/teacher/TeacherStudents';
import TeacherReadiness from './pages/teacher/TeacherReadiness';
import TeacherLeaderboard from './pages/teacher/TeacherLeaderboard';

// Public Pages
import PublicPortfolio from './pages/PublicPortfolio';
import PublicIdentity from './pages/PublicIdentity';

// Legacy (kept for backward compatibility)
import CollegeDashboard from './pages/CollegeDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';

const App = () => {
  return (
    <Router>
      <div className="app-container">
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

          {/* ─── Recruiter Dashboard ───────────────────────────── */}
          <Route path="/dashboard/recruiter" element={
            <ProtectedRoute roles={['recruiter', 'admin']}>
              <RecruiterOverview />
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
      </div>
    </Router>
  );
};

export default App;
