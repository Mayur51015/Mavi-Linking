import React, { useState, useEffect } from 'react';
import { Shield, User, History, Edit, UserX, UserCheck, RefreshCw, AlertTriangle, Building, BookOpen, Plus } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';
import DepartmentAdminCreateModal from './DepartmentAdminCreateModal';

const DepartmentAdminManager = ({ activeDepartment }) => {
  const toast = useToast();
  const [departmentAdmins, setDepartmentAdmins] = useState([]);
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('admins'); // 'admins' | 'history'

  // Creation Modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Reassignment Modal
  const [reassigningAdmin, setReassigningAdmin] = useState(null);
  const [targetDeptId, setTargetDeptId] = useState('');
  const [reassigning, setReassigning] = useState(false);

  // Suspension Modal
  const [suspendingAdmin, setSuspendingAdmin] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspending, setSuspending] = useState(false);

  // Resend Invitation State
  const [resendingId, setResendingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminsRes, deptsRes] = await Promise.all([
        api.get('/admin/department-admins'),
        api.get('/admin/departments'),
      ]);

      const admins = Array.isArray(adminsRes.data?.data) ? adminsRes.data.data : [];
      const depts = Array.isArray(deptsRes.data?.data) ? deptsRes.data.data : [];
      setDepartmentsList(depts);

      // Filter by activeDepartment if provided
      if (activeDepartment && activeDepartment._id) {
        setDepartmentAdmins(admins.filter((a) => a.departmentId?._id === activeDepartment._id || a.departmentId === activeDepartment._id));
        const historyRes = await api.get(`/admin/departments/${activeDepartment._id}/appointment-history`).catch(() => null);
        if (historyRes?.data?.data) setAppointmentHistory(historyRes.data.data);
      } else {
        setDepartmentAdmins(admins);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load Department Admins data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeDepartment]);

  const handleResendInvite = async (adminId) => {
    setResendingId(adminId);
    try {
      const res = await api.post(`/admin/department-admins/${adminId}/resend-invite`).catch(() =>
        api.post(`/admin/users/${adminId}/resend-invitation`)
      );
      toast.success(res.data?.message || 'New 24-hour invitation email resent successfully!');
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to resend invitation email.'));
    } finally {
      setResendingId(null);
    }
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    if (!reassigningAdmin || !targetDeptId) return;
    setReassigning(true);

    try {
      const res = await api.patch(`/admin/department-admins/${reassigningAdmin._id}/reassign`, {
        newDepartmentId: targetDeptId,
      });
      toast.success(res.data?.message || 'Department Admin reassigned successfully!');
      setReassigningAdmin(null);
      setTargetDeptId('');
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to reassign Department Admin.'));
    } finally {
      setReassigning(false);
    }
  };

  const handleToggleStatus = async (e) => {
    e.preventDefault();
    if (!suspendingAdmin) return;
    setSuspending(true);

    const newStatus = suspendingAdmin.status === 'suspended' ? 'active' : 'suspended';

    try {
      const res = await api.put(`/admin/department-admins/${suspendingAdmin._id}/status`, {
        status: newStatus,
        reason: suspensionReason,
      });
      toast.success(res.data?.message || `Department Admin account status updated to ${newStatus}.`);
      setSuspendingAdmin(null);
      setSuspensionReason('');
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update Department Admin status.'));
    } finally {
      setSuspending(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      
      {/* Top Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Shield size={20} style={{ color: 'var(--brand-blue)' }} />
            Department Administrator Governance {activeDepartment ? `— ${activeDepartment.name}` : ''}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
            Appoint, reassign, and manage department admins with strict multi-tenant isolation
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.15rem' }}>
            <button
              onClick={() => setActiveTab('admins')}
              style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8125rem', border: 'none', background: activeTab === 'admins' ? 'var(--brand-blue)' : 'transparent', color: activeTab === 'admins' ? '#FFFFFF' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}
            >
              Active Admins ({departmentAdmins.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8125rem', border: 'none', background: activeTab === 'history' ? 'var(--brand-blue)' : 'transparent', color: activeTab === 'history' ? '#FFFFFF' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <History size={13} /> Appointment History
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Plus size={16} /> Create Department Admin
          </button>
        </div>
      </div>

      {/* Main View */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading Department Admins...
        </div>
      ) : activeTab === 'admins' ? (
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', overflowX: 'auto' }}>
          {departmentAdmins.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Shield size={36} style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }} />
              <p>No Department Administrators provisioned yet for this scope.</p>
              <button onClick={() => setShowCreateModal(true)} className="btn btn-outline" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                Create First Department Admin
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Administrator</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Assigned Department</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>ETX ID</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Account Status</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departmentAdmins.map((admin) => {
                  const isInvited = admin.accountStatus === 'INVITED' || admin.status === 'invited';
                  const isSuspended = admin.status === 'suspended' || admin.accountStatus === 'SUSPENDED';

                  return (
                    <tr key={admin._id} style={{ borderBottom: '1px solid var(--border-color)', verticalAlign: 'middle' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{admin.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{admin.email}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className="badge badge-outline" style={{ fontSize: '0.75rem' }}>
                          {admin.departmentId?.name || 'Assigned Department'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--brand-blue)' }}>
                        {admin.etxId}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          className={`badge ${isInvited ? 'badge-amber' : isSuspended ? 'badge-danger' : 'badge-emerald'}`}
                          style={{
                            background: isInvited ? '#FEF3C7' : isSuspended ? '#FEF2F2' : '#ECFDF5',
                            color: isInvited ? '#D97706' : isSuspended ? '#DC2626' : '#059669',
                            border: `1px solid ${isInvited ? '#FDE68A' : isSuspended ? '#FECACA' : '#A7F3D0'}`,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          {isInvited ? 'INVITED' : isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleResendInvite(admin._id)}
                            disabled={resendingId === admin._id}
                            className="btn btn-outline"
                            title="Resend 24-Hour Invitation Email"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <RefreshCw size={12} className={resendingId === admin._id ? 'animate-spin' : ''} /> Resend Invite
                          </button>
                          <button
                            onClick={() => setReassigningAdmin(admin)}
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Edit size={12} /> Reassign
                          </button>
                          <button
                            onClick={() => setSuspendingAdmin(admin)}
                            className="btn btn-outline"
                            style={{ borderColor: isSuspended ? '#059669' : '#D97706', color: isSuspended ? '#059669' : '#D97706', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            {isSuspended ? 'Reactivate' : 'Suspend'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* Appointment / Creation Audit History Tab */
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 600, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <History size={16} /> Department Admin Governance Audit Trail
          </h4>
          {appointmentHistory.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No audit logs recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {appointmentHistory.map((item) => (
                <div key={item._id} style={{ padding: '0.75rem 1rem', background: 'var(--bg-subtle)', borderRadius: '6px', borderLeft: '3px solid var(--brand-blue)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {item.action} — Admin Account: <span>{item.targetUserId?.name || 'User'}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Actor: {item.actorId?.name || 'Admin'} ({item.actorRole}) | Role: {item.newRole || 'department_admin'}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Creation Modal */}
      {showCreateModal && (
        <DepartmentAdminCreateModal
          defaultDepartment={activeDepartment || departmentsList[0]}
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadData}
        />
      )}

      {/* Reassignment Modal */}
      {reassigningAdmin && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <form onSubmit={handleReassign} style={{ width: '100%', maxWidth: '420px', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Reassign Department Admin</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Target Admin: <strong>{reassigningAdmin.name}</strong> ({reassigningAdmin.etxId})
            </p>
            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Select New Department</label>
              <select
                className="input-field"
                value={targetDeptId}
                onChange={(e) => setTargetDeptId(e.target.value)}
                required
                style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }}
              >
                <option value="">-- Choose New Department --</option>
                {departmentsList.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={() => setReassigningAdmin(null)} className="btn btn-outline" style={{ flex: 1, padding: '0.5rem' }}>Cancel</button>
              <button type="submit" disabled={reassigning} className="btn btn-primary" style={{ flex: 1, padding: '0.5rem' }}>
                {reassigning ? 'Reassigning...' : 'Confirm Reassign'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Suspension Modal */}
      {suspendingAdmin && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <form onSubmit={handleToggleStatus} style={{ width: '100%', maxWidth: '450px', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '1.5rem' }}>
            <h3 style={{ color: suspendingAdmin.status === 'suspended' ? '#059669' : '#D97706', fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              {suspendingAdmin.status === 'suspended' ? 'Reactivate Department Admin' : 'Suspend Department Admin'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Target Admin: <strong>{suspendingAdmin.name}</strong> ({suspendingAdmin.email})
            </p>
            {suspendingAdmin.status !== 'suspended' && (
              <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Reason for Suspension</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Compliance violation, tenure end..."
                  style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem', resize: 'vertical' }}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={() => setSuspendingAdmin(null)} className="btn btn-outline" style={{ flex: 1, padding: '0.5rem' }}>Cancel</button>
              <button type="submit" disabled={suspending} className="btn btn-primary" style={{ flex: 1, padding: '0.5rem' }}>
                {suspending ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DepartmentAdminManager;
