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
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield className="text-gradient" size={22} />
            Department Administrator Governance {activeDepartment ? `— ${activeDepartment.name}` : ''}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
            Appoint, reassign, and manage department admins with strict multi-tenant isolation
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.2rem' }}>
            <button
              onClick={() => setActiveTab('admins')}
              style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', border: 'none', background: activeTab === 'admins' ? 'var(--accent-purple)' : 'transparent', color: activeTab === 'admins' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600' }}
            >
              Active Admins ({departmentAdmins.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', border: 'none', background: activeTab === 'history' ? 'var(--accent-purple)' : 'transparent', color: activeTab === 'history' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
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
          <div className="animate-pulse" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gradient-primary)', margin: '0 auto 1rem' }} />
          Loading Department Admins...
        </div>
      ) : activeTab === 'admins' ? (
        <div className="glass-card-static" style={{ overflowX: 'auto' }}>
          {departmentAdmins.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Shield size={36} style={{ marginBottom: '0.5rem' }} />
              <p>No Department Administrators provisioned yet for this scope.</p>
              <button onClick={() => setShowCreateModal(true)} className="btn btn-outline" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                Create First Department Admin
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem' }}>Administrator</th>
                  <th style={{ padding: '1rem' }}>Assigned Department</th>
                  <th style={{ padding: '1rem' }}>MAVI ID</th>
                  <th style={{ padding: '1rem' }}>Account Status</th>
                  <th style={{ padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departmentAdmins.map((admin) => {
                  const isInvited = admin.accountStatus === 'INVITED' || admin.status === 'invited';
                  const isSuspended = admin.status === 'suspended' || admin.accountStatus === 'SUSPENDED';

                  return (
                    <tr key={admin._id} style={{ borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '600', color: 'white' }}>{admin.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{admin.email}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                          {admin.departmentId?.name || 'Assigned Department'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent-purple)' }}>
                        {admin.maviId}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span
                          className={`badge ${isInvited ? 'badge-amber' : isSuspended ? 'badge-outline' : 'badge-primary'}`}
                          style={{
                            color: isInvited ? '#f59e0b' : isSuspended ? '#ef4444' : '#10b981',
                            borderColor: isInvited ? '#f59e0b' : isSuspended ? '#ef4444' : '#10b981',
                          }}
                        >
                          {isInvited ? 'INVITED' : isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleResendInvite(admin._id)}
                            disabled={resendingId === admin._id}
                            className="btn btn-outline"
                            title="Resend 24-Hour Invitation / Setup Email"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--accent-purple, #a855f7)', color: 'var(--accent-purple, #a855f7)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <RefreshCw size={12} className={resendingId === admin._id ? 'animate-spin' : ''} /> Resend Invite
                          </button>
                          <button
                            onClick={() => setReassigningAdmin(admin)}
                            className="btn btn-outline"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Edit size={12} /> Reassign
                          </button>
                          <button
                            onClick={() => setSuspendingAdmin(admin)}
                            className="btn btn-outline"
                            style={{ borderColor: isSuspended ? 'var(--accent-emerald)' : '#eab308', color: isSuspended ? 'var(--accent-emerald)' : '#eab308', padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
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
        <div className="glass-card-static" style={{ padding: '1.5rem' }}>
          <h4 style={{ color: '#fbbf24', fontSize: '0.95rem', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <History size={16} /> Department Admin Governance Audit Trail
          </h4>
          {appointmentHistory.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No audit logs recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {appointmentHistory.map((item) => (
                <div key={item._id} style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid var(--accent-purple)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: 'bold' }}>
                      {item.action} — Admin Account: <span style={{ color: 'var(--accent-cyan)' }}>{item.targetUserId?.name || 'User'}</span>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <form onSubmit={handleReassign} className="glass-card-static" style={{ width: '420px', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Reassign Department Admin</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Target Admin: <strong>{reassigningAdmin.name}</strong> ({reassigningAdmin.maviId})
            </p>
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label className="input-label">Select New Department</label>
              <select
                className="input-field"
                value={targetDeptId}
                onChange={(e) => setTargetDeptId(e.target.value)}
                required
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
              <button type="button" onClick={() => setReassigningAdmin(null)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" disabled={reassigning} className="btn btn-primary" style={{ flex: 1 }}>
                {reassigning ? 'Reassigning...' : 'Confirm Reassign'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Suspension Modal */}
      {suspendingAdmin && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <form onSubmit={handleToggleStatus} className="glass-card-static" style={{ width: '450px', padding: '2rem' }}>
            <h3 style={{ color: suspendingAdmin.status === 'suspended' ? 'var(--accent-emerald)' : '#eab308', marginBottom: '1rem' }}>
              {suspendingAdmin.status === 'suspended' ? 'Reactivate Department Admin' : 'Suspend Department Admin'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Target Admin: <strong>{suspendingAdmin.name}</strong> ({suspendingAdmin.email})
            </p>
            {suspendingAdmin.status !== 'suspended' && (
              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Reason for Suspension</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Compliance violation, tenure end..."
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={() => setSuspendingAdmin(null)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" disabled={suspending} className="btn btn-primary" style={{ flex: 1 }}>
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
