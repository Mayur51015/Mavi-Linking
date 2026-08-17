import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Terminal,
  Shield,
  CheckCircle,
  AlertTriangle,
  Key,
  Building2,
  UserCheck,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  RefreshCw,
  Mail,
} from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

const formatRoleTitle = (r) => {
  if (!r) return 'Administrator';
  const mapping = {
    super_admin: 'Platform Super Administrator',
    platform_owner: 'Platform Owner',
    institution_admin: 'Institution Administrator',
    department_admin: 'Department Administrator',
    placement_admin: 'Placement Administrator',
    academic_admin: 'Academic Administrator',
    student_affairs_admin: 'Student Affairs Administrator',
    finance_admin: 'Finance & Billing Administrator',
    training_admin: 'Training & Development Administrator',
    admin: 'Administrator',
  };
  return mapping[r] || r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const mapErrorCodeToDetails = (code, fallback) => {
  switch (code) {
    case 'INVITATION_EXPIRED':
      return {
        title: 'Invitation Expired',
        message: 'This administrator invitation has expired. Please ask an authorized administrator to resend the invitation.',
        actionText: 'Contact Administrator',
        showLoginBtn: false,
      };
    case 'INVITATION_REVOKED':
      return {
        title: 'Invitation No Longer Valid',
        message: 'A newer invitation has been issued. Please use the latest invitation email.',
        actionText: 'Check Your Latest Email',
        showLoginBtn: false,
      };
    case 'INVITATION_ALREADY_USED':
      return {
        title: 'Account Already Activated',
        message: 'Your administrator account has already been activated.',
        actionText: 'Go to Admin Login',
        showLoginBtn: true,
      };
    case 'INVITED_USER_NOT_FOUND':
      return {
        title: 'Invited Account Not Found',
        message: 'The target administrator account could not be found or has been removed.',
        actionText: 'Return to Homepage',
        showLoginBtn: false,
      };
    case 'INVITATION_INVALID':
    default:
      return {
        title: 'Invalid Invitation',
        message: fallback || 'This administrator invitation is not valid or link is incomplete.',
        actionText: 'Return to Homepage',
        showLoginBtn: false,
      };
  }
};

const AdminAcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || searchParams.get('t') || searchParams.get('inviteToken');
  const navigate = useNavigate();
  const toast = useToast();

  // Stage Machine: 'LOADING' | 'VERIFIED' | 'ACTIVATING' | 'SUCCESS' | 'ERROR'
  const [stage, setStage] = useState('LOADING');
  const [inviteData, setInviteData] = useState(null);
  const [errorDetails, setErrorDetails] = useState({
    title: 'Invalid Invitation',
    message: 'This administrator invitation is not valid.',
    showLoginBtn: false,
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');

  // Password Policy Rules
  const hasMinLength = password.length >= 6;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isFormValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  useEffect(() => {
    if (!token || !token.trim()) {
      setErrorDetails({
        title: 'Invalid Invitation',
        message: 'No invitation token found in the link. Please open the link from your invitation email.',
        showLoginBtn: false,
      });
      setStage('ERROR');
      return;
    }

    const verifyToken = async () => {
      try {
        setStage('LOADING');
        const res = await api.get(`/auth/verify-admin-invite/${encodeURIComponent(token.trim())}`);
        if (res.data?.success && res.data?.data) {
          setInviteData(res.data.data);
          setStage('VERIFIED');
        } else {
          const details = mapErrorCodeToDetails(res.data?.code, res.data?.message);
          setErrorDetails(details);
          setStage('ERROR');
        }
      } catch (err) {
        if (!err.response) {
          setErrorDetails({
            title: 'Connection Error',
            message: 'Unable to connect to MAVI Linking. Please check your internet connection and try again.',
            showLoginBtn: false,
          });
        } else {
          const code = err.response?.data?.code;
          const msg = err.response?.data?.message;
          const details = mapErrorCodeToDetails(code, msg);
          setErrorDetails(details);
        }
        setStage('ERROR');
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!password) {
      setFormError('Password is required.');
      return;
    }

    if (!hasMinLength) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      setFormError('Password must contain uppercase, lowercase, and a number.');
      return;
    }

    if (!passwordsMatch) {
      setFormError('Passwords do not match.');
      return;
    }

    setStage('ACTIVATING');
    try {
      const res = await api.post('/auth/accept-admin-invite', {
        token: token.trim(),
        password,
        confirmPassword,
      });

      if (res.data?.success) {
        setStage('SUCCESS');
        toast.success('Administrator account activated successfully!');
      } else {
        setStage('VERIFIED');
        setFormError(res.data?.message || 'Failed to activate account.');
        toast.error(res.data?.message || 'Failed to activate account.');
      }
    } catch (err) {
      setStage('VERIFIED');
      const code = err.response?.data?.code;
      const msg = err.response?.data?.message || 'Unable to activate the account. Please try again.';
      setFormError(msg);
      toast.error(msg);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark, #09090b)', color: '#f4f4f5', padding: '1.5rem' }}>
      <div className="glass-card-static animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', background: 'rgba(24, 24, 27, 0.85)', backdropFilter: 'blur(16px)' }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Link to="/" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'white', fontWeight: '800', fontSize: '1.3rem' }}>
            <Terminal size={30} style={{ color: 'var(--accent-purple, #a855f7)' }} />
            <span>MAVI Linking</span>
          </Link>
        </div>

        {/* ─── STAGE: LOADING ─── */}
        {stage === 'LOADING' && (
          <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid rgba(168, 85, 247, 0.2)', borderTopColor: 'var(--accent-purple, #a855f7)', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem', color: '#ffffff' }}>Verifying your invitation...</h3>
            <p style={{ color: 'var(--text-secondary, #a1a1aa)', fontSize: '0.875rem' }}>Validating cryptographic security credentials...</p>
          </div>
        )}

        {/* ─── STAGE: ERROR ─── */}
        {stage === 'ERROR' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <AlertTriangle size={30} />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#fca5a5', marginBottom: '0.75rem' }}>
              {errorDetails.title}
            </h3>

            <p style={{ color: 'var(--text-secondary, #a1a1aa)', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: '1.6' }}>
              {errorDetails.message}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {errorDetails.showLoginBtn ? (
                <Link to="/admin/login" className="btn btn-primary" style={{ padding: '0.7rem 1.5rem', fontSize: '0.875rem', fontWeight: '700' }}>
                  Go to Administrator Login
                </Link>
              ) : (
                <Link to="/" className="btn btn-outline" style={{ padding: '0.7rem 1.5rem', fontSize: '0.875rem' }}>
                  Return to Home
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ─── STAGE: SUCCESS ─── */}
        {stage === 'SUCCESS' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <CheckCircle size={36} />
            </div>

            <h3 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#10b981', marginBottom: '0.5rem' }}>
              ✓ Account Activated
            </h3>

            <p style={{ color: 'var(--text-secondary, #a1a1aa)', fontSize: '0.92rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              Your MAVI Linking administrator account has been successfully activated.
            </p>

            {inviteData && (
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '1rem', marginBottom: '1.75rem', textAlign: 'left', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                  <span style={{ color: '#a1a1aa' }}>Role:</span>
                  <strong style={{ color: '#c084fc' }}>{formatRoleTitle(inviteData.role)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                  <span style={{ color: '#a1a1aa' }}>Institution:</span>
                  <strong style={{ color: '#ffffff' }}>{inviteData.institution?.name || 'Platform Wide'}</strong>
                </div>
                {inviteData.department && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                    <span style={{ color: '#a1a1aa' }}>Department:</span>
                    <strong style={{ color: '#ffffff' }}>{inviteData.department?.name || inviteData.department}</strong>
                  </div>
                )}
              </div>
            )}

            <Link
              to="/admin/login"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '700', textDecoration: 'none' }}
            >
              Continue to Login <ArrowRight size={18} />
            </Link>
          </div>
        )}

        {/* ─── STAGE: VERIFIED / ACTIVATING ─── */}
        {(stage === 'VERIFIED' || stage === 'ACTIVATING') && inviteData && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.35rem', color: '#ffffff' }}>
                <Shield style={{ color: '#a855f7' }} size={22} />
                Administrator Invitation
              </h2>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '20px' }}>
                ✓ Invitation Verified
              </span>
            </div>

            {/* Welcome & Scope Card */}
            <div style={{ background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#ffffff', marginBottom: '0.5rem' }}>
                Welcome, {inviteData.name}
              </div>

              <div style={{ fontSize: '0.8rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                You have been invited as:
              </div>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: '#c084fc', marginTop: '0.15rem' }}>
                {formatRoleTitle(inviteData.role)}
              </div>

              <div style={{ fontSize: '0.85rem', color: '#a1a1aa', marginTop: '0.5rem' }}>
                Institution: <strong style={{ color: '#ffffff' }}>{inviteData.institution?.name || 'Platform Wide'}</strong>
              </div>

              {inviteData.department && (
                <div style={{ fontSize: '0.85rem', color: '#a1a1aa', marginTop: '0.25rem' }}>
                  Department: <strong style={{ color: '#ffffff' }}>{inviteData.department?.name || inviteData.department}</strong>
                </div>
              )}

              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(168, 85, 247, 0.2)', fontSize: '0.8rem', color: '#c084fc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
                <span>⏱️ This invitation is valid for 24 hours.</span>
                {inviteData.expiresAt && (
                  <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>
                    Expires: {new Date(inviteData.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(inviteData.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Form Header */}
            <div style={{ marginBottom: '1rem', fontWeight: '600', fontSize: '0.95rem', color: '#e4e4e7' }}>
              Create Your Permanent Password
            </div>

            {formError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', color: '#fca5a5', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Password Field */}
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label" style={{ display: 'block', fontSize: '0.85rem', color: '#d4d4d8', marginBottom: '0.35rem' }}>
                  Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Create your permanent password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={stage === 'ACTIVATING'}
                    autoComplete="new-password"
                    style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 0.85rem', background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: 'white', fontSize: '0.9rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '4px' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                <label className="input-label" style={{ display: 'block', fontSize: '0.85rem', color: '#d4d4d8', marginBottom: '0.35rem' }}>
                  Confirm Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={stage === 'ACTIVATING'}
                    autoComplete="new-password"
                    style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 0.85rem', background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: 'white', fontSize: '0.9rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '4px' }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Live Checklist */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
                <div style={{ color: '#a1a1aa', marginBottom: '0.4rem', fontWeight: '600' }}>Password requirements:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hasMinLength ? '#10b981' : '#71717a' }}>
                    {hasMinLength ? <Check size={13} /> : <X size={13} />} At least 6 characters
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hasUppercase ? '#10b981' : '#71717a' }}>
                    {hasUppercase ? <Check size={13} /> : <X size={13} />} 1 Uppercase letter
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hasLowercase ? '#10b981' : '#71717a' }}>
                    {hasLowercase ? <Check size={13} /> : <X size={13} />} 1 Lowercase letter
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hasNumber ? '#10b981' : '#71717a' }}>
                    {hasNumber ? <Check size={13} /> : <X size={13} />} 1 Number (0-9)
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '0.35rem', color: passwordsMatch ? '#10b981' : '#71717a' }}>
                    {passwordsMatch ? <Check size={13} /> : <X size={13} />} Passwords match
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '700', cursor: isFormValid ? 'pointer' : 'not-allowed', opacity: isFormValid ? 1 : 0.65 }}
                disabled={!isFormValid || stage === 'ACTIVATING'}
              >
                <Key size={16} />
                {stage === 'ACTIVATING' ? 'Activating My Account...' : 'Activate My Account'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAcceptInvite;
