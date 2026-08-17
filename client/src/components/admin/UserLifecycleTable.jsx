import React, { useState } from 'react';
import {
  Eye,
  Edit2,
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

  const getStatusBadge = (accStatus, simpleStatus) => {
    const s = (accStatus || simpleStatus || 'ACTIVE').toUpperCase();
    if (s === 'ACTIVE') {
      return (
        <span
          className="badge"
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            border: '1px solid #10b981',
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
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#f59e0b',
            border: '1px solid #f59e0b',
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
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            border: '1px solid #ef4444',
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
            background: 'rgba(168, 85, 247, 0.15)',
            color: '#c084fc',
            border: '1px solid #a855f7',
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
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            border: '1px solid #ef4444',
            fontSize: '0.75rem',
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
      <div className="glass-card-static" style={{ overflowX: 'auto', borderRadius: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem 0.75rem' }}>Name</th>
              <th style={{ padding: '1rem 0.75rem' }}>Email</th>
              <th style={{ padding: '1rem 0.75rem' }}>MAVI ID</th>
              <th style={{ padding: '1rem 0.75rem' }}>Role</th>
              <th style={{ padding: '1rem 0.75rem' }}>Institution</th>
              <th style={{ padding: '1rem 0.75rem' }}>Department</th>
              <th style={{ padding: '1rem 0.75rem' }}>Status</th>
              <th style={{ padding: '1rem 0.75rem' }}>Created Date</th>
              <th style={{ padding: '1rem 0.75rem' }}>Last Login</th>
              <th style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>Actions</th>
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
                    borderBottom: '1px solid var(--border-subtle)',
                    verticalAlign: 'middle',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <td style={{ padding: '0.85rem 0.75rem', fontWeight: '600', color: '#ffffff' }}>
                    {u.name}
                  </td>
                  <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)' }}>
                    {u.email}
                  </td>
                  <td style={{ padding: '0.85rem 0.75rem' }}>
                    <span style={{ fontFamily: 'monospace', color: '#c084fc', fontWeight: '600', fontSize: '0.8rem' }}>
                      {u.maviId || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 0.75rem' }}>
                    <span className="badge badge-outline" style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                      {u.role ? u.role.replace(/_/g, ' ') : 'User'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {u.institutionId?.name || u.institutionId?.code || 'Platform-wide'}
                  </td>
                  <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {u.departmentId?.name || u.departmentId?.code || 'All Depts'}
                  </td>
                  <td style={{ padding: '0.85rem 0.75rem' }}>
                    {getStatusBadge(u.accountStatus, u.status)}
                  </td>
                  <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
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
    </>
  );
}
