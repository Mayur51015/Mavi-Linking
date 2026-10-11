import React, { useState, useEffect } from 'react';
import {
  Eye,
  Edit2,
  Mail,
  AlertTriangle,
  Lock,
  UserCheck,
  Trash2,
  Building2,
  Calendar,
  Clock,
  Shield,
  Search,
  Filter,
} from 'lucide-react';
import UserLifecycleModal from './UserLifecycleModal';
import FacultyDepartmentAssignModal from './FacultyDepartmentAssignModal';
import api from '../../api/axios';

/**
 * Reusable Enterprise User Lifecycle Management Table & Actions
 */
export default function UserLifecycleTable({
  users = [],
  departments = [],
  institutions = [],
  onRefresh,
  loading = false,
  currentUserRole = 'admin',
}) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState(null); // 'view' | 'edit' | 'suspend' | 'deactivate' | 'reactivate' | 'permanent_delete'
  const [actionLoading, setActionLoading] = useState(false);
  const [assigningFacultyUser, setAssigningFacultyUser] = useState(null);
  const [resendingUserId, setResendingUserId] = useState(null);
  const [cooldowns, setCooldowns] = useState({});

  useEffect(() => {
    const hasActiveCooldown = Object.values(cooldowns).some((t) => t > Date.now());
    if (!hasActiveCooldown) return;

    const timer = setInterval(() => {
      setCooldowns((prev) => {
        const now = Date.now();
        let changed = false;
        const next = { ...prev };
        for (const [id, expireTime] of Object.entries(next)) {
          if (expireTime <= now) {
            delete next[id];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldowns]);

  const openModal = (user, type) => {
    setSelectedUser(user);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setModalType(null);
  };

  const handleModalSubmit = async (formData) => {
    if (!selectedUser || !modalType) return;
    setActionLoading(true);
    try {
      if (modalType === 'suspend') {
        await api.post(`/admin/users/${selectedUser._id}/suspend`, formData);
        alert(`User account ${selectedUser.email} has been suspended.`);
      } else if (modalType === 'deactivate') {
        await api.post(`/admin/users/${selectedUser._id}/deactivate`, formData);
        alert(`User account ${selectedUser.email} has been deactivated.`);
      } else if (modalType === 'reactivate') {
        await api.post(`/admin/users/${selectedUser._id}/reactivate`, formData);
        alert(`User account ${selectedUser.email} has been reactivated.`);
      } else if (modalType === 'permanent_delete') {
        await api.delete(`/admin/users/${selectedUser._id}/permanent`, { data: formData });
        alert(`User account ${selectedUser.email} has been permanently deleted.`);
      } else if (modalType === 'edit') {
        await api.put(`/admin/users/${selectedUser._id}`, formData);
        alert(`User profile for ${selectedUser.email} updated successfully.`);
      }
      closeModal();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Lifecycle action failed:', err);
      const errMsg = err.response?.data?.message || err.message || 'Operation failed.';
      alert(`Action Error: ${errMsg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendInvite = async (user) => {
    if (!user?._id) return;

    if (cooldowns[user._id] && cooldowns[user._id] > Date.now()) {
      const remaining = Math.ceil((cooldowns[user._id] - Date.now()) / 1000);
      alert(`Please wait ${remaining} seconds before resending another invitation email.`);
      return;
    }

    if (resendingUserId === user._id || actionLoading) return;

    setResendingUserId(user._id);
    try {
      // Determine the single authoritative endpoint based on user role and caller role
      let endpoint;
      if (user.role === 'department_admin') {
        endpoint = `/admin/department-admins/${user._id}/resend-invite`;
      } else if (['platform_owner', 'owner'].includes(currentUserRole) && (['super_admin', 'institution_admin', 'admin'].includes(user.role) || user.role?.includes('admin'))) {
        endpoint = `/owner/admins/${user._id}/resend-invite`;
      } else if (currentUserRole === 'super_admin' && (['institution_admin', 'admin'].includes(user.role) || user.role?.includes('admin'))) {
        endpoint = `/super-admin/admins/${user._id}/resend-invite`;
      } else {
        endpoint = `/admin/users/${user._id}/resend-invitation`;
      }

      const res = await api.post(endpoint);
      setCooldowns((prev) => ({ ...prev, [user._id]: Date.now() + 60000 }));
      alert(res.data?.message || `New invitation and setup email dispatched to ${user.email}`);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (err.response?.status === 429) {
        const retryAfter = err.response.data?.data?.retryAfter || parseInt(err.response.headers?.['retry-after'], 10) || 60;
        setCooldowns((prev) => ({ ...prev, [user._id]: Date.now() + retryAfter * 1000 }));
        alert(err.response.data?.message || `Rate limit active: please wait ${retryAfter}s before retrying.`);
      } else {
        alert(err.response?.data?.message || 'Failed to resend invitation email.');
      }
    } finally {
      setResendingUserId(null);
    }
  };

  const getStatusBadge = (accStatus, simpleStatus, expiresAt) => {
    const s = (accStatus || simpleStatus || 'ACTIVE').toUpperCase();
    const isExpired = expiresAt && new Date(expiresAt) < new Date();

    if (s === 'INVITED' || s === 'INVITATION_PENDING') {
      if (isExpired) {
        return (
          <span
            className="badge"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid #ef4444',
              fontWeight: '600',
              fontSize: '0.75rem',
            }}
          >
            INVITE EXPIRED
          </span>
        );
      }
      return (
        <span
          className="badge"
          style={{
            background: 'rgba(168, 85, 247, 0.15)',
            color: '#c084fc',
            border: '1px solid #a855f7',
            fontWeight: '600',
            fontSize: '0.75rem',
          }}
        >
          INVITED (24H)
        </span>
      );
    }
    if (s === 'ACTIVE') {
      return (
        <span
          className="badge"
          style={{
            background: '#ECFDF5',
            color: '#059669',
            border: '1px solid #A7F3D0',
            fontWeight: '600',
            fontSize: '0.75rem',
          }}
        >
          ACTIVE
        </span>
      );
    }
    if (s === 'SUSPENDED') {
      return (
        <span
          className="badge"
          style={{
            background: '#FEF3C7',
            color: '#D97706',
            border: '1px solid #FDE68A',
            fontWeight: '600',
            fontSize: '0.75rem',
          }}
        >
          SUSPENDED
        </span>
      );
    }
    if (s === 'DEACTIVATED') {
      return (
        <span
          className="badge"
          style={{
            background: '#F3F4F6',
            color: '#4B5563',
            border: '1px solid #E5E7EB',
            fontWeight: '600',
            fontSize: '0.75rem',
          }}
        >
          DEACTIVATED
        </span>
      );
    }
    if (s.includes('PENDING')) {
      return (
        <span
          className="badge"
          style={{
            background: '#EFF6FF',
            color: '#2563EB',
            border: '1px solid #BFDBFE',
            fontWeight: '600',
            fontSize: '0.75rem',
          }}
        >
          {s.replace(/_/g, ' ')}
        </span>
      );
    }
    if (s === 'REJECTED') {
      return (
        <span
          className="badge"
          style={{
            background: '#FEF2F2',
            color: '#DC2626',
            border: '1px solid #FECACA',
            fontSize: '0.75rem',
            fontWeight: '600',
          }}
        >
          REJECTED
        </span>
      );
    }
    return <span className="badge badge-outline" style={{ fontSize: '0.75rem' }}>{s}</span>;
  };

  return (
    <>
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>ETX ID</th>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>Role</th>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>Institution</th>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>Department</th>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>Created Date</th>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>Last Login</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSuspended = u.accountStatus === 'SUSPENDED' || u.status === 'suspended';
              const isDeactivated = u.accountStatus === 'DEACTIVATED';
              const isOwnerOrSuper = u.role === 'super_admin' || u.role === 'platform_owner' || u.role === 'owner';

              return (
                <tr
                  key={u._id}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    verticalAlign: 'middle',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <td style={{ padding: '0.75rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {u.name}
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                    {u.email}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.8rem' }}>
                      {u.etxId || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className="badge badge-outline" style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                      {u.role ? u.role.replace(/_/g, ' ') : 'User'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {u.institutionId?.name || u.institutionId?.code || 'Platform-wide'}
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {u.departmentId?.name || u.departmentId?.code || u.university?.department || (
                      <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {getStatusBadge(u.accountStatus, u.status, u.invitationExpires)}
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {/* Assign Department Action (For Faculty / Teachers) */}
                      {(u.role === 'teacher' || u.role === 'professor') && (
                        <button
                          onClick={() => setAssigningFacultyUser(u)}
                          className="btn btn-outline"
                          title="Assign Faculty to Department"
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            borderColor: 'var(--brand-blue, #2563EB)',
                            color: 'var(--brand-blue, #2563EB)',
                          }}
                        >
                          <Building2 size={13} /> Assign Dept
                        </button>
                      )}

                      {/* View Action */}
                      <button
                        onClick={() => openModal(u, 'view')}
                        className="btn btn-outline"
                        title="View Full User Details"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <Eye size={13} /> View
                      </button>

                      {/* Edit Action */}
                      <button
                        onClick={() => openModal(u, 'edit')}
                        className="btn btn-outline"
                        title="Edit User Details"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <Edit2 size={13} /> Edit
                      </button>

                      {/* Resend Invite / Setup Mail Action */}
                      {!u.isDeleted && u.accountStatus !== 'PERMANENTLY_DELETED' && (() => {
                        const userCooldown = cooldowns[u._id] ? Math.max(0, Math.ceil((cooldowns[u._id] - Date.now()) / 1000)) : 0;
                        const isResending = resendingUserId === u._id;
                        const isBtnDisabled = actionLoading || isResending || userCooldown > 0;
                        return (
                          <button
                            onClick={() => handleResendInvite(u)}
                            disabled={isBtnDisabled}
                            className="btn btn-outline"
                            title={userCooldown > 0 ? `Please wait ${userCooldown}s before resending` : 'Resend 24-Hour Invitation / Setup Email'}
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              borderColor: 'var(--accent-purple, #a855f7)',
                              color: 'var(--accent-purple, #a855f7)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              opacity: isBtnDisabled ? 0.6 : 1,
                              cursor: isBtnDisabled ? 'not-allowed' : 'pointer',
                            }}
                          >
                            <Mail size={13} className={isResending ? 'animate-spin' : ''} />
                            {isResending ? 'Sending...' : userCooldown > 0 ? `Wait ${userCooldown}s` : 'Resend Mail'}
                          </button>
                        );
                      })()}

                      {/* Suspend / Reactivate Action */}
                      {isSuspended || isDeactivated ? (
                        <button
                          onClick={() => openModal(u, 'reactivate')}
                          className="btn btn-outline"
                          title="Reactivate Account"
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            borderColor: '#10b981',
                            color: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                          }}
                        >
                          <UserCheck size={13} /> Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => openModal(u, 'suspend')}
                          className="btn btn-outline"
                          title="Suspend Account"
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            borderColor: '#f59e0b',
                            color: '#f59e0b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                          }}
                        >
                          <AlertTriangle size={13} /> Suspend
                        </button>
                      )}

                      {/* Deactivate Action */}
                      {!isDeactivated && (
                        <button
                          onClick={() => openModal(u, 'deactivate')}
                          className="btn btn-outline"
                          title="Deactivate Account"
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            borderColor: '#f87171',
                            color: '#f87171',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                          }}
                        >
                          <Lock size={13} /> Deactivate
                        </button>
                      )}

                      {/* Permanent Delete Action */}
                      <button
                        onClick={() => openModal(u, 'permanent_delete')}
                        className="btn btn-outline"
                        title="Delete User Permanently"
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          borderColor: '#ef4444',
                          color: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                        }}
                      >
                        <Trash2 size={13} /> Delete Permanently
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {users.length === 0 && (
              <tr>
                <td colSpan={10} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No user records found matching the current criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Lifecycle Modal */}
      {modalType && selectedUser && (
        <UserLifecycleModal
          modalType={modalType}
          user={selectedUser}
          onClose={closeModal}
          onSubmit={handleModalSubmit}
          loading={actionLoading}
          departments={departments}
          institutions={institutions}
        />
      )}

      {/* Faculty Department Assignment Modal */}
      {assigningFacultyUser && (
        <FacultyDepartmentAssignModal
          facultyMember={assigningFacultyUser}
          departments={departments}
          onClose={() => setAssigningFacultyUser(null)}
          onSuccess={() => {
            setAssigningFacultyUser(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </>
  );
}
