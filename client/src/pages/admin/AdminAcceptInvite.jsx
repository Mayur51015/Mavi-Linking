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
            message: 'Unable to connect to EduTalentX. Please check your internet connection and try again.',
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FA', color: '#111111', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '500px', padding: '2.25rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FFFFFF', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)' }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#111111', fontWeight: '700', fontSize: '1.25rem' }}>
            <Terminal size={26} style={{ color: '#2563EB' }} />
            <span>EduTalentX</span>
          </Link>
        </div>

        {/* ─── STAGE: LOADING ─── */}
        {stage === 'LOADING' && (
          <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#2563EB', animation: 'spin 0.8s linear infinite', margin: '0 auto 1.25rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '0.35rem', color: '#111111' }}>Verifying your invitation...</h3>
            <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Validating administrator security credentials...</p>
          </div>
        )}

        {/* ─── STAGE: ERROR ─── */}
        {stage === 'ERROR' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <AlertTriangle size={26} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#991B1B', marginBottom: '0.5rem' }}>
              {errorDetails.title}
            </h3>

            <p style={{ color: '#4B5563', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {errorDetails.message}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {errorDetails.showLoginBtn ? (
                <Link to="/admin/login" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.875rem', fontWeight: '600' }}>
                  Go to Administrator Login
                </Link>
              ) : (
                <Link to="/" className="btn btn-outline" style={{ padding: '0.65rem 1.25rem', fontSize: '0.875rem' }}>
                  Return to Home
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ─── STAGE: SUCCESS ─── */}
        {stage === 'SUCCESS' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <CheckCircle size={30} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#065F46', marginBottom: '0.35rem' }}>
              Account Activated
            </h3>

            <p style={{ color: '#4B5563', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Your EduTalentX administrator account has been successfully activated.
            </p>

            {inviteData && (
              <div style={{ background: '#F8F9FA', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid #E5E7EB' }}>
                  <span style={{ color: '#6B7280' }}>Role:</span>
                  <strong style={{ color: '#1E40AF' }}>{formatRoleTitle(inviteData.role)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: inviteData.department ? '1px solid #E5E7EB' : 'none' }}>
                  <span style={{ color: '#6B7280' }}>Institution:</span>
                  <strong style={{ color: '#111111' }}>{inviteData.institution?.name || 'Platform Wide'}</strong>
                </div>
                {inviteData.department && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0' }}>
                    <span style={{ color: '#6B7280' }}>Department:</span>
                    <strong style={{ color: '#111111' }}>{inviteData.department?.name || inviteData.department}</strong>
                  </div>
                )}
              </div>
            )}

            <Link
              to="/admin/login"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '600', textDecoration: 'none' }}
            >
              Continue to Login <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* ─── STAGE: VERIFIED / ACTIVATING ─── */}
        {(stage === 'VERIFIED' || stage === 'ACTIVATING') && inviteData && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.35rem', color: '#111111' }}>
                <Shield style={{ color: '#2563EB' }} size={20} />
                Administrator Invitation
              </h2>
              <span style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>
                Verified Invitation
              </span>
            </div>

            {/* Welcome & Scope Card */}
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '1.15rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#111111', marginBottom: '0.35rem' }}>
                Welcome, {inviteData.name}
              </div>

              <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Invited Role
              </div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1E40AF', marginTop: '0.1rem' }}>
                {formatRoleTitle(inviteData.role)}
              </div>

              <div style={{ fontSize: '0.85rem', color: '#4B5563', marginTop: '0.4rem' }}>
                Institution: <strong style={{ color: '#111111' }}>{inviteData.institution?.name || 'Platform Wide'}</strong>
              </div>

              {inviteData.department && (
                <div style={{ fontSize: '0.85rem', color: '#4B5563', marginTop: '0.2rem' }}>
                  Department: <strong style={{ color: '#111111' }}>{inviteData.department?.name || inviteData.department}</strong>
                </div>
              )}

              <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid #DBEAFE', fontSize: '0.8rem', color: '#1E40AF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
                <span>This invitation is valid for 10 minutes.</span>
                {inviteData.expiresAt && (
                  <span style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                    Expires: {new Date(inviteData.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(inviteData.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Form Header */}
            <div style={{ marginBottom: '0.85rem', fontWeight: '600', fontSize: '0.9rem', color: '#111111' }}>
              Create Your Password
            </div>

            {formError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', padding: '0.65rem 0.85rem', marginBottom: '1rem', color: '#991B1B', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Password Field */}
              <div className="input-group" style={{ marginBottom: '0.85rem' }}>
                <label className="input-label" style={{ display: 'block', fontSize: '0.85rem', color: '#111111', marginBottom: '0.35rem' }}>
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
                    style={{ width: '100%', padding: '0.65rem 2.5rem 0.65rem 0.75rem', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px', color: '#111111', fontSize: '0.875rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label" style={{ display: 'block', fontSize: '0.85rem', color: '#111111', marginBottom: '0.35rem' }}>
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
                    style={{ width: '100%', padding: '0.65rem 2.5rem 0.65rem 0.75rem', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px', color: '#111111', fontSize: '0.875rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Live Checklist */}
              <div style={{ background: '#F8F9FA', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
                <div style={{ color: '#4B5563', marginBottom: '0.35rem', fontWeight: '600' }}>Password requirements:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hasMinLength ? '#059669' : '#6B7280' }}>
                    {hasMinLength ? <Check size={13} /> : <X size={13} />} At least 6 characters
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hasUppercase ? '#059669' : '#6B7280' }}>
                    {hasUppercase ? <Check size={13} /> : <X size={13} />} 1 Uppercase letter
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hasLowercase ? '#059669' : '#6B7280' }}>
                    {hasLowercase ? <Check size={13} /> : <X size={13} />} 1 Lowercase letter
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hasNumber ? '#059669' : '#6B7280' }}>
                    {hasNumber ? <Check size={13} /> : <X size={13} />} 1 Number (0-9)
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '0.35rem', color: passwordsMatch ? '#059669' : '#6B7280' }}>
                    {passwordsMatch ? <Check size={13} /> : <X size={13} />} Passwords match
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '600', cursor: isFormValid ? 'pointer' : 'not-allowed', opacity: isFormValid ? 1 : 0.65 }}
                disabled={!isFormValid || stage === 'ACTIVATING'}
              >
                <Key size={16} />
                {stage === 'ACTIVATING' ? 'Activating Account...' : 'Activate Account'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAcceptInvite;
