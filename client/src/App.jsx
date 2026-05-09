import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AccountLinking from './pages/AccountLinking';
import AIInsights from './pages/AIInsights';
import ProjectManagement from './pages/ProjectManagement';
import PublicPortfolio from './pages/PublicPortfolio';
import PublicIdentity from './pages/PublicIdentity';
import RecruiterDashboard from './pages/RecruiterDashboard';
import CollegeDashboard from './pages/CollegeDashboard';
import CompatibilityPage from './pages/CompatibilityPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div className="container" style={{paddingTop: '5rem'}}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return children;
};

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/link" 
            element={
              <ProtectedRoute>
                <AccountLinking />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/insights" 
            element={
              <ProtectedRoute>
                <AIInsights />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/projects" 
            element={
              <ProtectedRoute>
                <ProjectManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/recruiter" 
            element={
              <ProtectedRoute>
                <RecruiterDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/college" 
            element={
              <ProtectedRoute>
                <CollegeDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/compatibility" 
            element={
              <ProtectedRoute>
                <CompatibilityPage />
              </ProtectedRoute>
            } 
          />
          {/* Public Identity Route — /u/:username */}
          <Route path="/u/:username" element={<PublicIdentity />} />
          {/* Legacy Portfolio Route */}
          <Route path="/portfolio/:id" element={<PublicPortfolio />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
