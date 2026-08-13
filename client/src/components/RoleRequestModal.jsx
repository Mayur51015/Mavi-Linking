import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errorMessage';
import { ShieldCheck, Building, GraduationCap, X } from 'lucide-react';

const RoleRequestModal = ({ isOpen, onClose }) => {
  const { user, requestRoleUpgrade } = useContext(AuthContext);
  const toast = useToast();

  const [requestedRole, setRequestedRole] = useState('teacher');
  const [details, setDetails] = useState({
    institution: '',
    department: '',
    designation: '',
    companyName: '',
    companyEmail: '',
    companyDomain: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestRoleUpgrade(requestedRole, details);
      toast.success(`Verification request for ${requestedRole} submitted successfully!`);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to submit verification request.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%', maxWidth: '480px', padding: '2rem', position: 'relative'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '1rem', right: '1rem',
          background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
        }}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <ShieldCheck size={28} className="text-gradient" />
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Request Role Verification</h3>
        </div>

        {user?.roleStatus === 'pending' ? (
          <div style={{
            background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)',
            color: '#fde047', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem'
          }}>
            Your verification request for <strong>{user.requestedRole}</strong> is currently pending administrator review.
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Select the role you wish to request verification for and provide institutional/company credentials.
          </p>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Target Role</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button"
                className={`btn ${requestedRole === 'teacher' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                onClick={() => setRequestedRole('teacher')}
              >
                <GraduationCap size={18} /> Teacher
              </button>
              <button type="button"
                className={`btn ${requestedRole === 'recruiter' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                onClick={() => setRequestedRole('recruiter')}
              >
                <Building size={18} /> Recruiter
              </button>
            </div>
          </div>

          {requestedRole === 'teacher' && (
            <>
              <div className="input-group">
                <label className="input-label">Institution / University *</label>
                <input type="text" className="input-field" placeholder="e.g., Stanford University"
                  value={details.institution} onChange={(e) => setDetails({ ...details, institution: e.target.value })} required />
              </div>
              <div className="input-group">
                <label className="input-label">Department *</label>
                <input type="text" className="input-field" placeholder="e.g., Computer Science"
                  value={details.department} onChange={(e) => setDetails({ ...details, department: e.target.value })} required />
              </div>
              <div className="input-group">
                <label className="input-label">Designation / Title</label>
                <input type="text" className="input-field" placeholder="e.g., Associate Professor"
                  value={details.designation} onChange={(e) => setDetails({ ...details, designation: e.target.value })} />
              </div>
            </>
          )}

          {requestedRole === 'recruiter' && (
            <>
              <div className="input-group">
                <label className="input-label">Company Name *</label>
                <input type="text" className="input-field" placeholder="e.g., Google"
                  value={details.companyName} onChange={(e) => setDetails({ ...details, companyName: e.target.value })} required />
              </div>
              <div className="input-group">
                <label className="input-label">Work / Company Email *</label>
                <input type="email" className="input-field" placeholder="you@company.com"
                  value={details.companyEmail} onChange={(e) => setDetails({ ...details, companyEmail: e.target.value })} required />
              </div>
              <div className="input-group">
                <label className="input-label">Company Domain</label>
                <input type="text" className="input-field" placeholder="company.com"
                  value={details.companyDomain} onChange={(e) => setDetails({ ...details, companyDomain: e.target.value })} />
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleRequestModal;
