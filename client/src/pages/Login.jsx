import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Terminal, Shield, Lock } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errorMessage';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();

  const handleNavigationByRole = (userObj) => {
    if (userObj?.mustChangePassword) {
      navigate('/change-password');
      return;
    }
    const userRole = userObj?.role;
    switch (userRole) {
      case 'recruiter':
        navigate('/dashboard/recruiter');
        break;
      case 'teacher':
      case 'professor':
        navigate('/dashboard/teacher');
        break;
      case 'institution_admin':
      case 'admin':
        navigate('/admin');
        break;
      case 'super_admin':
        navigate('/super-admin');
        break;
      case 'owner':
      case 'platform_owner':
        navigate('/owner');
        break;
      default:
        navigate('/dashboard');
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await login(identifier, password);
      toast.success('Welcome back! You are now signed in.');
      handleNavigationByRole(res?.user);
    } catch (err) {
      setError(getErrorMessage(err, 'Sign in failed. Please verify your identity credentials and password.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: '#09090b' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <Link to="/" className="nav-brand">
            <Terminal size={32} className="text-gradient" />
            <span>MaVi Linking</span>
          </Link>
        </div>
        
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.75rem', color: 'white' }}>Welcome Back</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.875rem' }}>
          Sign in with your permanent MAVI ID, verified student PRN, or email address.
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">MAVI ID / Student PRN / Email</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. MAVI-8F3K7Q2P, 124BT10461, or email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required 
              disabled={submitting}
            />
          </div>
          
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <label className="input-label" style={{ margin: 0 }}>Password</label>
            </div>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              disabled={submitting}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.875rem' }} disabled={submitting}>
            {submitting ? 'Authenticating Identity...' : 'Sign In'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '1.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Don't have an account? <Link to="/register" className="text-gradient" style={{ fontWeight: '600' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
