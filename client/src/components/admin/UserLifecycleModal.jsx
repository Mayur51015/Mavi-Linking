import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Trash2,
  UserCheck,
  X,
  Info,
  Calendar,
  Lock,
  Building2,
  GraduationCap,
  Clock,
  Mail,
  User as UserIcon,
  Tag,
  CheckCircle,
} from 'lucide-react';

/**
 * Enterprise User Lifecycle Management Modal Component
 * Handles:
 * 1. Suspend User (Reason + optional expiration date)
 * 2. Deactivate User (Strict warning + reason)
 * 3. Reactivate User (Restore access)
 * 4. Permanent Delete (Strong confirmation: checkbox + typing 'DELETE')
 * 5. View Full User Details
 * 6. Edit User Profile
 */
export default function UserLifecycleModal({
  modalType, // 'suspend' | 'deactivate' | 'reactivate' | 'permanent_delete' | 'view' | 'edit'
  user,
  onClose,
  onSubmit,
  loading = false,
  departments = [],
  institutions = [],
}) {
  const [reason, setReason] = useState('');
  const [suspendedUntil, setSuspendedUntil] = useState('');
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'user',
    departmentId: user?.departmentId?._id || user?.departmentId || '',
    status: user?.status || 'active',
  });

  if (!user || !modalType) return null;

  const handleActionSubmit = (e) => {
    e.preventDefault();
    if (modalType === 'suspend') {
      if (!reason.trim()) {
        alert('Please provide a reason for suspension.');
        return;
      }
      onSubmit({ reason: reason.trim(), suspendedUntil: suspendedUntil || null });
    } else if (modalType === 'deactivate') {
      onSubmit({ reason: reason.trim() || 'Administrative deactivation' });
    } else if (modalType === 'reactivate') {
      onSubmit({});
    } else if (modalType === 'permanent_delete') {
      if (!confirmCheckbox || confirmText.trim().toUpperCase() !== 'DELETE') {
        alert('Please complete the confirmation checks and type DELETE before proceeding.');
        return;
      }
      onSubmit({ confirmationText: confirmText.trim(), reason: reason.trim() || 'Administrative permanent deletion' });
    } else if (modalType === 'edit') {
      onSubmit(editForm);
    }
  };

  const getStatusBadge = (accStatus, simpleStatus) => {
    const s = (accStatus || simpleStatus || 'ACTIVE').toUpperCase();
    if (s === 'ACTIVE') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600', background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>
          ACTIVE
        </span>
      );
    }
    if (s === 'SUSPENDED') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600', background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
          SUSPENDED
        </span>
      );
    }
    if (s === 'DEACTIVATED') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600', background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
          DEACTIVATED
        </span>
      );
    }
    if (s.includes('PENDING')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600', background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }}>
          {s}
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600', background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' }}>
        {s}
      </span>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(17, 24, 39, 0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: modalType === 'view' ? '650px' : '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          color: 'var(--text-main)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {modalType === 'suspend' && <AlertTriangle size={20} style={{ color: '#D97706' }} />}
            {modalType === 'deactivate' && <Lock size={20} style={{ color: '#DC2626' }} />}
            {modalType === 'reactivate' && <UserCheck size={20} style={{ color: '#059669' }} />}
            {modalType === 'permanent_delete' && <ShieldAlert size={20} style={{ color: '#DC2626' }} />}
            {modalType === 'view' && <Info size={20} style={{ color: 'var(--color-primary)' }} />}
            {modalType === 'edit' && <UserIcon size={20} style={{ color: 'var(--color-primary)' }} />}

            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-main)' }}>
              {modalType === 'suspend' && 'Suspend User Account'}
              {modalType === 'deactivate' && 'Deactivate User Account'}
              {modalType === 'reactivate' && 'Reactivate User Account'}
              {modalType === 'permanent_delete' && 'Delete User Permanently'}
              {modalType === 'view' && 'User Account Profile & Lifecycle Details'}
              {modalType === 'edit' && 'Edit User Details'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem' }}>
          {/* Target User Summary Card */}
          <div
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'grid',
              gap: '0.5rem',
              fontSize: '0.875rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)' }}>{user.name}</span>
              {getStatusBadge(user.accountStatus, user.status)}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
              <div><strong style={{ color: 'var(--text-main)' }}>Email:</strong> {user.email}</div>
              <div><strong style={{ color: 'var(--text-main)' }}>ETX ID:</strong> <span style={{ fontFamily: 'monospace', color: 'var(--color-primary)', fontWeight: '600' }}>{user.etxId}</span></div>
              <div><strong style={{ color: 'var(--text-main)' }}>Role:</strong> <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>{user.role}</span></div>
            </div>
            {(user.institutionId?.name || user.institutionId?.code) && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <Building2 size={14} /> {user.institutionId?.name || user.institutionId?.code}
                {user.departmentId?.name && ` • ${user.departmentId?.name}`}
              </div>
            )}
          </div>

          {/* ─── 1. SUSPEND DIALOG ────────────────────────────────────────── */}
          {modalType === 'suspend' && (
            <form onSubmit={handleActionSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#92400E' }}>
                  Suspension Reason (Required) *
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="E.g., Policy violation investigation, disciplinary hold, temporary credential freeze..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  Optional Suspension Expiration (Auto-Reactivation Date)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={suspendedUntil}
                    onChange={(e) => setSuspendedUntil(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  If set, the user account will automatically restore to ACTIVE upon next access after this date.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={loading || !reason.trim()}
                  style={{ background: '#D97706', color: '#FFFFFF', fontWeight: '600', border: 'none' }}
                >
                  {loading ? 'Suspending...' : 'Suspend User'}
                </button>
              </div>
            </form>
          )}

          {/* ─── 2. DEACTIVATE DIALOG ─────────────────────────────────────── */}
          {modalType === 'deactivate' && (
            <form onSubmit={handleActionSubmit}>
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  color: '#991B1B',
                  fontSize: '0.85rem',
                  lineHeight: '1.5',
                }}
              >
                <strong style={{ display: 'block', marginBottom: '0.25rem', color: '#991B1B' }}>Important Deactivation Policy:</strong>
                The user will immediately lose access to all EduTalentX systems and active sessions will be revoked. The account will remain disabled indefinitely until an authorized administrator explicitly reactivates it.
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  Deactivation Reason / Administrative Note
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Provide context for deactivating this account..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={loading}
                  style={{ background: '#DC2626', color: '#FFFFFF', fontWeight: '600', border: 'none' }}
                >
                  {loading ? 'Deactivating...' : 'Deactivate User'}
                </button>
              </div>
            </form>
          )}

          {/* ─── 3. REACTIVATE DIALOG ─────────────────────────────────────── */}
          {modalType === 'reactivate' && (
            <form onSubmit={handleActionSubmit}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                Are you sure you want to restore full platform access for <strong style={{ color: 'var(--text-main)' }}>{user.name}</strong> ({user.email})? 
                All suspensions and deactivations will be cleared and the user will be able to log in immediately.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ background: '#059669', borderColor: '#059669', color: '#FFFFFF', fontWeight: '600' }}
                >
                  {loading ? 'Reactivating...' : 'Reactivate User'}
                </button>
              </div>
            </form>
          )}

          {/* ─── 4. PERMANENT DELETE DIALOG ───────────────────────────────── */}
          {modalType === 'permanent_delete' && (
            <form onSubmit={handleActionSubmit}>
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  color: '#991B1B',
                  fontSize: '0.85rem',
                  lineHeight: '1.5',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991B1B', fontWeight: '700', marginBottom: '0.4rem' }}>
                  <ShieldAlert size={18} /> High-Risk Irreversible Operation
                </div>
                <ul style={{ margin: '0 0 0 1.25rem', padding: 0 }}>
                  <li>This action permanently deletes this user record and eligible dependent data from the database.</li>
                  <li><strong>The email address ({user.email}) will become available for a fresh new registration.</strong></li>
                  <li>Any future registration with this email will receive a brand-new ETX ID and start as a new account with zero inherited permissions.</li>
                  <li>Legal and compliance audit logs are preserved for security governance.</li>
                </ul>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                  <input
                    type="checkbox"
                    checked={confirmCheckbox}
                    onChange={(e) => setConfirmCheckbox(e.target.checked)}
                    style={{ marginTop: '0.2rem' }}
                  />
                  <span>I understand this action is permanent and cannot be undone.</span>
                </label>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  To confirm, type <span style={{ color: '#DC2626', fontFamily: 'monospace', fontWeight: '700' }}>DELETE</span> below:
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="DELETE"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  style={{ width: '100%', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={loading || !confirmCheckbox || confirmText.trim().toUpperCase() !== 'DELETE'}
                  style={{
                    background: confirmCheckbox && confirmText.trim().toUpperCase() === 'DELETE' ? '#DC2626' : '#9CA3AF',
                    color: '#FFFFFF',
                    fontWeight: '700',
                    border: 'none',
                    cursor: confirmCheckbox && confirmText.trim().toUpperCase() === 'DELETE' ? 'pointer' : 'not-allowed',
                  }}
                >
                  <Trash2 size={16} style={{ marginRight: '0.4rem' }} />
                  {loading ? 'Deleting...' : 'Delete User Permanently'}
                </button>
              </div>
            </form>
          )}

          {/* ─── 5. VIEW FULL USER DETAILS ────────────────────────────────── */}
          {modalType === 'view' && (
            <div style={{ display: 'grid', gap: '1rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Account Name</div>
                  <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{user.name}</div>
                </div>
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Email Address</div>
                  <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{user.email}</div>
                </div>
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>ETX ID</div>
                  <div style={{ fontWeight: '600', fontFamily: 'monospace', color: 'var(--color-primary)' }}>{user.etxId}</div>
                </div>
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Primary Role</div>
                  <div style={{ fontWeight: '600', color: 'var(--text-main)', textTransform: 'capitalize' }}>{user.role}</div>
                </div>
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Institution</div>
                  <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{user.institutionId?.name || 'Platform-Wide'}</div>
                </div>
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Department</div>
                  <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{user.departmentId?.name || 'All Departments'}</div>
                </div>
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Created At</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</div>
                </div>
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Last Login</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never logged in'}</div>
                </div>
              </div>

              {/* Suspension / Deactivation Metadata */}
              {user.suspendedAt && (
                <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontWeight: '700', color: '#92400E', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertTriangle size={16} /> Suspension Details
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#78350F', display: 'grid', gap: '0.35rem' }}>
                    <div><strong>Suspended At:</strong> {new Date(user.suspendedAt).toLocaleString()}</div>
                    <div><strong>Suspension Reason:</strong> {user.suspensionReason || 'None recorded'}</div>
                    {user.suspendedUntil && <div><strong>Suspended Until:</strong> {new Date(user.suspendedUntil).toLocaleString()}</div>}
                  </div>
                </div>
              )}

              {user.deactivatedAt && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontWeight: '700', color: '#991B1B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Lock size={16} /> Deactivation Details
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#991B1B', display: 'grid', gap: '0.35rem' }}>
                    <div><strong>Deactivated At:</strong> {new Date(user.deactivatedAt).toLocaleString()}</div>
                    <div><strong>Deactivation Reason:</strong> {user.deactivationReason || 'None recorded'}</div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={onClose} className="btn btn-primary">
                  Close
                </button>
              </div>
            </div>
          )}

          {/* ─── 6. EDIT USER PROFILE ──────────────────────────────────────── */}
          {modalType === 'edit' && (
            <form onSubmit={handleActionSubmit}>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: 'var(--text-main)' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: 'var(--text-main)' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: 'var(--text-main)' }}>
                      Primary Role
                    </label>
                    <select
                      className="input-field"
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      style={{ width: '100%' }}
                    >
                      <option value="user">Student (user)</option>
                      <option value="teacher">Teacher / Faculty</option>
                      <option value="recruiter">Corporate Recruiter</option>
                      <option value="department_admin">Department Admin</option>
                      <option value="institution_admin">Institution Admin</option>
                    </select>
                  </div>

                  {departments.length > 0 && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem', color: 'var(--text-main)' }}>
                        Department
                      </label>
                      <select
                        className="input-field"
                        value={editForm.departmentId}
                        onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                        style={{ width: '100%' }}
                      >
                        <option value="">None / Unassigned</option>
                        {departments.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name} {d.code ? `(${d.code})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
