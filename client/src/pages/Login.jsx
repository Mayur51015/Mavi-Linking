import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Terminal } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errorMessage';
import GoogleSignInButton from '../components/GoogleSignInButton';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login, loginWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();

  const handleNavigationByRole = (userRole) => {
    switch (userRole) {
      case 'recruiter':
        navigate('/dashboard/recruiter');
        break;
      case 'teacher':
      case 'professor':
        navigate('/dashboard/teacher');
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
      const res = await login(email, password);
      toast.success('Welcome back! You are now signed in.');
      handleNavigationByRole(res?.user?.role);
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    setError('');
    setSubmitting(true);
    try {
      const res = await loginWithGoogle(credential);
      toast.success('Signed in with Google successfully!');
      handleNavigationByRole(res?.user?.role);
    } catch (err) {
      setError(getErrorMessage(err, 'Google Sign-In failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <Link to="/" className="nav-brand">
            <Terminal size={32} className="text-gradient" />
            <span>MaVi Linking</span>
          </Link>
        </div>
        
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.75rem' }}>Welcome back</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Enter your details to access your dashboard.
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              disabled={submitting}
            />
          </div>
          
          <div className="input-group">
            <label className="input-label">Password</label>
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
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}></div>
          <span style={{ padding: '0 0.75rem', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>OR</span>
          <div style={{ flex: 1, borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}></div>
        </div>

        <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={(err) => setError(err)} />
        
        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Don't have an account? <Link to="/register" className="text-gradient" style={{ fontWeight: '600' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
