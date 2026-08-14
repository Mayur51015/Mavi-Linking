import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  FileText,
  BarChart3,
  Edit,
  Trash2,
  RefreshCw,
  UserCheck,
  CheckCircle,
  XCircle,
  Building,
  Plus,
  Lock,
  UserX,
  UserPlus,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import UserLayout from '../../layouts/UserLayout';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user: currentUser } = useContext(AuthContext);
  const userRoles = Array.isArray(currentUser?.roles) && currentUser.roles.length > 0 ? currentUser.roles : [currentUser?.role];
  const isSuperAdmin = userRoles.includes('super_admin') || currentUser?.role === 'super_admin' || currentUser?.role === 'admin';
  const isInstAdmin = userRoles.includes('institution_admin') || currentUser?.role === 'institution_admin';

  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [roleRequests, setRoleRequests] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [editUser, setEditUser] = useState(null);
  const [suspendingUser, setSuspendingUser] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Institution Modal
  const [showCreateInstModal, setShowCreateInstModal] = useState(false);
  const [newInst, setNewInst] = useState({ name: '', code: '', domain: '', type: 'College', city: '', state: '' });
  const [assigningInst, setAssigningInst] = useState(null);
  const [adminEmailToAssign, setAdminEmailToAssign] = useState('');

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const roleParam = filterRole ? `&role=${filterRole}` : '';
      const statusParam = filterStatus ? `&status=${filterStatus}` : '';
      const searchParam = search ? `&search=${search}` : '';
      const res = await api.get(`/admin/users?page=${page}&limit=25${roleParam}${statusParam}${searchParam}`);
      setUsers(res.data.data.users || []);
      setPagination(res.data.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Users fetch error:', err);
    }
  };

  const [prnRequests, setPrnRequests] = useState([]);

  const fetchRoleRequests = async () => {
    try {
      const res = await api.get('/admin/role-requests?status=pending');
      setRoleRequests(res.data.data || []);
    } catch (err) {
      console.error('Role requests error:', err);
    }
  };

  const fetchPrnRequests = async () => {
    try {
      const res = await api.get('/admin/prn-verifications?status=pending');
      setPrnRequests(res.data.data || []);
    } catch (err) {
      console.error('PRN requests error:', err);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const res = await api.get('/admin/institutions');
      setInstitutions(res.data.data.institutions || []);
    } catch (err) {
      console.error('Institutions error:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/admin/logs?limit=50');
      setLogs(res.data.data.logs || []);
    } catch (err) {
      console.error('Logs fetch error:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchUsers(), fetchRoleRequests(), fetchPrnRequests(), fetchInstitutions(), fetchLogs()]);
    setLoading(false);
  };

  const handleApprovePrn = async (id) => {
    try {
      await api.post(`/admin/prn-verifications/${id}/approve`);
      loadData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to approve PRN verification.');
    }
  };

  useEffect(() => {
    loadData();
  }, [filterRole, filterStatus, search, page]);

  // Actions
  const handleApproveRole = async (id) => {
    try {
      await api.post(`/admin/role-requests/${id}/approve`);
      loadData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to approve role request.');
    }
  };

  const handleRejectRole = async (e) => {
    e.preventDefault();
    if (!rejectingUser) return;
    try {
      await api.post(`/admin/role-requests/${rejectingUser._id}/reject`, {
        reason: rejectionReason,
      });
      setRejectingUser(null);
      setRejectionReason('');
      loadData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to reject role request.');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/users/${editUser._id}`, {
        role: editUser.role,
        isVerified: editUser.isVerified,
        name: editUser.name,
      });
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update user.');
    }
  };

  const handleToggleUserStatus = async (e) => {
    e.preventDefault();
    if (!suspendingUser) return;
    const targetStatus = suspendingUser.status === 'suspended' ? 'active' : 'suspended';
    try {
      await api.put(`/admin/users/${suspendingUser._id}/status`, {
        status: targetStatus,
        reason: suspensionReason,
      });
      setSuspendingUser(null);
      setSuspensionReason('');
      fetchUsers();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update user account status.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  // Institution Actions
  const handleCreateInstitution = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/institutions', newInst);
      setShowCreateInstModal(false);
      setNewInst({ name: '', code: '', domain: '', type: 'College', city: '', state: '' });
      fetchInstitutions();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to create institution.');
    }
  };

  const handleAssignAdmin = async (e) => {
    e.preventDefault();
    if (!assigningInst || !adminEmailToAssign) return;
    try {
      await api.post(`/admin/institutions/${assigningInst._id}/assign-admin`, {
        email: adminEmailToAssign,
      });
      setAssigningInst(null);
      setAdminEmailToAssign('');
      fetchInstitutions();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to assign institution admin.');
    }
  };

  const handleRemoveAdmin = async (instId, userId) => {
    if (!window.confirm('Remove Institution Admin privileges from this user?')) return;
    try {
      await api.post(`/admin/institutions/${instId}/remove-admin`, { userId });
      fetchInstitutions();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to remove institution admin.');
    }
  };

  return (
    <UserLayout>
      <div style={{ padding: '1rem', maxWidth: '1280px', margin: '0 auto', color: 'white' }}>
        {/* Top Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                <Shield className="text-gradient" size={32} />
                {isSuperAdmin ? 'Platform Super Admin Console' : 'Institution Control Panel'}
              </h1>
              <span className={`badge ${isSuperAdmin ? 'badge-primary' : 'badge-outline'}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                {isSuperAdmin ? 'Super Admin' : 'Institution Admin'}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
              {isSuperAdmin
                ? 'Central management system, global tenant controls, multi-college administration, and audit trails.'
                : `Scoped administrative console for ${currentUser?.roleVerification?.institution || 'your assigned institution'}.`}
            </p>
          </div>

          <button onClick={loadData} className="btn btn-outline" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <RefreshCw size={14} /> Sync System Data
          </button>
        </header>

        {/* Stats Board */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Students', value: stats.students, color: 'var(--accent-purple)' },
              { label: 'Recruiters', value: stats.recruiters, color: 'var(--accent-cyan)' },
              { label: 'Teachers', value: stats.teachers, color: 'var(--accent-amber)' },
              { label: 'Institutions', value: stats.institutions, color: 'var(--accent-emerald)' },
              { label: 'Suspended Accounts', value: stats.suspended, color: '#ef4444' },
            ].map((item) => (
              <div key={item.label} className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', paddingBottom: '0.5rem', overflowX: 'auto' }}>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'users' ? 'white' : 'var(--text-muted)',
              borderBottom: activeTab === 'users' ? '2px solid var(--accent-purple)' : 'none',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
            }}
          >
            <Users size={16} /> User Moderation
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('institutions')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'institutions' ? 'white' : 'var(--text-muted)',
                borderBottom: activeTab === 'institutions' ? '2px solid var(--accent-purple)' : 'none',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap',
              }}
            >
              <Building size={16} /> Colleges & Institutions
            </button>
          )}

          <button
            onClick={() => setActiveTab('requests')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'requests' ? 'white' : 'var(--text-muted)',
              borderBottom: activeTab === 'requests' ? '2px solid var(--accent-purple)' : 'none',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
            }}
          >
            <UserCheck size={16} /> Verification Requests
            {roleRequests.length > 0 && (
              <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
                {roleRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'logs' ? 'white' : 'var(--text-muted)',
              borderBottom: activeTab === 'logs' ? '2px solid var(--accent-purple)' : 'none',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
            }}
          >
            <FileText size={16} /> Audit Trails
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Syncing administrative data...</div>
        ) : (
          <>
            {/* ─── TAB 1: User Moderation ───────────────────────────────────── */}
            {activeTab === 'users' && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search user by name or email..."
                      className="input-field"
                      style={{ marginBottom: 0, paddingLeft: '2.5rem' }}
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                    />
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                  <select
                    className="input-field"
                    style={{ width: '180px', marginBottom: 0 }}
                    value={filterRole}
                    onChange={(e) => {
                      setFilterRole(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">All Roles</option>
                    <option value="user">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="institution_admin">Inst Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  <select
                    className="input-field"
                    style={{ width: '180px', marginBottom: 0 }}
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="glass-card-static" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '1rem' }}>User Profile</th>
                        <th style={{ padding: '1rem' }}>Role</th>
                        <th style={{ padding: '1rem' }}>Institution</th>
                        <th style={{ padding: '1rem' }}>Status</th>
                        <th style={{ padding: '1rem' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No users matched your filter criteria.
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u._id} style={{ borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle' }}>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ fontWeight: '600' }}>{u.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>
                                {u.role === 'user' ? 'Student' : u.role}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {u.institutionId?.name || u.university?.name || '—'}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span className={`badge ${u.status === 'suspended' ? 'badge-outline' : 'badge-primary'}`} style={{ color: u.status === 'suspended' ? '#ef4444' : undefined, borderColor: u.status === 'suspended' ? '#ef4444' : undefined }}>
                                {u.status === 'suspended' ? 'Suspended' : 'Active'}
                              </span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => setEditUser(u)}
                                  className="btn btn-outline"
                                  style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                >
                                  <Edit size={12} /> Edit
                                </button>

                                <button
                                  onClick={() => setSuspendingUser(u)}
                                  className="btn btn-outline"
                                  style={{
                                    borderColor: u.status === 'suspended' ? 'var(--accent-emerald)' : '#eab308',
                                    color: u.status === 'suspended' ? 'var(--accent-emerald)' : '#eab308',
                                    padding: '0.35rem 0.55rem',
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                  }}
                                >
                                  {u.status === 'suspended' ? <UserCheck size={12} /> : <UserX size={12} />}
                                  {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                                </button>

                                {isSuperAdmin && !['super_admin', 'admin'].includes(u.role) && (
                                  <button
                                    onClick={() => handleDeleteUser(u._id)}
                                    className="btn btn-outline"
                                    style={{ borderColor: '#ef4444', color: '#ef4444', padding: '0.35rem 0.55rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                  >
                                    <Trash2 size={12} /> Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Pagination Bar */}
                  {pagination.pages > 1 && (
                    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Showing page {pagination.page} of {pagination.pages} ({pagination.total} users total)
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          disabled={page <= 1}
                          onClick={() => setPage(page - 1)}
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          <ChevronLeft size={14} /> Prev
                        </button>
                        <button
                          disabled={page >= pagination.pages}
                          onClick={() => setPage(page + 1)}
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          Next <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── TAB 2: Institutions (Super Admin Only) ────────────────────── */}
            {activeTab === 'institutions' && isSuperAdmin && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3>Registered Colleges & Institutions</h3>
                  <button onClick={() => setShowCreateInstModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Plus size={16} /> Add Institution
                  </button>
                </div>

                <div className="glass-card-static" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '1rem' }}>Institution Name</th>
                        <th style={{ padding: '1rem' }}>Code / Domain</th>
                        <th style={{ padding: '1rem' }}>Type & Location</th>
                        <th style={{ padding: '1rem' }}>Institution Admins</th>
                        <th style={{ padding: '1rem' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {institutions.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No institutions created yet. Click "Add Institution" to register one.
                          </td>
                        </tr>
                      ) : (
                        institutions.map((inst) => (
                          <tr key={inst._id} style={{ borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle' }}>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ fontWeight: '600' }}>{inst.name}</div>
                              <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>{inst.status}</span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{inst.code || '—'}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{inst.domain || 'No Domain'}</div>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              <div>{inst.type}</div>
                              <div>{[inst.city, inst.state].filter(Boolean).join(', ') || 'India'}</div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              {inst.admins && inst.admins.length > 0 ? (
                                inst.admins.map((adm) => (
                                  <div key={adm._id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                                    <span style={{ fontWeight: '600' }}>{adm.name}</span> ({adm.email})
                                    <button
                                      onClick={() => handleRemoveAdmin(inst._id, adm._id)}
                                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                                      title="Remove Admin"
                                    >
                                      <XCircle size={12} />
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No Admin Assigned</span>
                              )}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <button
                                onClick={() => setAssigningInst(inst)}
                                className="btn btn-outline"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                              >
                                <UserPlus size={12} /> Assign Admin
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── TAB 3: Verification Requests ────────────────────────────── */}
            {activeTab === 'requests' && (
              <div className="animate-fade-in">
                <div className="glass-card-static" style={{ overflowX: 'auto' }}>
                  {roleRequests.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <CheckCircle size={36} style={{ color: 'var(--accent-emerald)', marginBottom: '0.5rem' }} />
                      <p>All pending Teacher & Recruiter verification requests have been cleared!</p>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '1rem' }}>Applicant</th>
                          <th style={{ padding: '1rem' }}>Requested Role</th>
                          <th style={{ padding: '1rem' }}>Verification Details</th>
                          <th style={{ padding: '1rem' }}>Submission Date</th>
                          <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roleRequests.map((req) => (
                          <tr key={req._id} style={{ borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle' }}>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ fontWeight: '600' }}>{req.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{req.email}</div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                                {req.requestedRole}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                              {req.roleVerification ? (
                                <div>
                                  {req.roleVerification.institution && <div>Inst: {req.roleVerification.institution}</div>}
                                  {req.roleVerification.department && <div>Dept: {req.roleVerification.department}</div>}
                                  {req.roleVerification.companyName && <div>Company: {req.roleVerification.companyName}</div>}
                                </div>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td style={{ padding: '1rem' }}>{new Date(req.createdAt).toLocaleDateString()}</td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => handleApproveRole(req._id)}
                                  className="btn btn-primary"
                                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                  <CheckCircle size={14} /> Approve
                                </button>
                                <button
                                  onClick={() => setRejectingUser(req)}
                                  className="btn btn-outline"
                                  style={{ borderColor: '#ef4444', color: '#ef4444', padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                  <XCircle size={14} /> Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* PRN & Institutional Identity Verification Queue */}
                <div className="glass-card-static" style={{ marginTop: '2rem', padding: '1.5rem' }}>
                  <h3 style={{ marginBottom: '1rem', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={20} /> Institutional Identity & PRN Verifications
                  </h3>
                  {prnRequests.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <CheckCircle size={32} style={{ color: 'var(--accent-emerald)', marginBottom: '0.5rem' }} />
                      <p>No pending PRN or Faculty ID identity verifications.</p>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '1rem' }}>Applicant / MAVI ID</th>
                          <th style={{ padding: '1rem' }}>PRN / Faculty ID</th>
                          <th style={{ padding: '1rem' }}>Institution / College</th>
                          <th style={{ padding: '1rem' }}>Status</th>
                          <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prnRequests.map((req) => (
                          <tr key={req._id} style={{ borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle' }}>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ fontWeight: '600' }}>{req.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{req.email}</div>
                              <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--accent-purple)' }}>{req.maviId}</div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>
                                {req.prn || req.facultyId || 'Not Provided'}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {req.institutionId?.name || req.university?.name || 'Global Scope'}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span className="badge badge-outline" style={{ borderColor: '#eab308', color: '#eab308' }}>
                                Pending Review
                              </span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => handleApprovePrn(req._id)}
                                  className="btn btn-primary"
                                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                  <CheckCircle size={14} /> Verify PRN
                                </button>
                                <button
                                  onClick={() => setRejectingUser(req)}
                                  className="btn btn-outline"
                                  style={{ borderColor: '#ef4444', color: '#ef4444', padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                  <XCircle size={14} /> Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ─── TAB 4: Audit Logs ────────────────────────────────────────── */}
            {activeTab === 'logs' && (
              <div className="animate-fade-in glass-card-static" style={{ padding: '1rem' }}>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 3fr 1fr', padding: '0.75rem 1rem', fontWeight: 'bold', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                    <div>Timestamp</div>
                    <div>Actor / User</div>
                    <div>Action & Details</div>
                    <div>IP Address</div>
                  </div>
                  {logs.map((log) => (
                    <div key={log._id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 3fr 1fr', padding: '0.75rem 1rem', fontSize: '0.8rem', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}>
                      <div style={{ color: 'var(--text-secondary)' }}>{new Date(log.createdAt).toLocaleString()}</div>
                      <div>
                        <span style={{ fontWeight: '600' }}>{log.userId?.name || 'System'}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                          {log.userId?.email || ''}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--accent-purple)', fontWeight: '600', marginRight: '0.5rem' }}>{log.action}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{log.details}</span>
                      </div>
                      <div style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{log.ipAddress || '127.0.0.1'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── MODAL: Edit User ────────────────────────────────────────────── */}
        {editUser && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <form onSubmit={handleUpdateUser} className="glass-card-static" style={{ width: '420px', padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Modify Profile: {editUser.name}</h3>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editUser.name}
                    onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Assigned Role</label>
                  <select
                    className="input-field"
                    value={editUser.role}
                    onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  >
                    <option value="user">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="institution_admin">Institution Admin</option>
                    {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setEditUser(null)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── MODAL: Suspend / Activate User ─────────────────────────────── */}
        {suspendingUser && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <form onSubmit={handleToggleUserStatus} className="glass-card-static" style={{ width: '450px', padding: '2rem' }}>
              <h3 style={{ color: suspendingUser.status === 'suspended' ? 'var(--accent-emerald)' : '#eab308', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={22} />
                {suspendingUser.status === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Target user: <strong>{suspendingUser.name}</strong> ({suspendingUser.email})
              </p>
              {suspendingUser.status !== 'suspended' && (
                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label">Reason for Suspension</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    placeholder="Describe why this account is being suspended..."
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                    required
                  />
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setSuspendingUser(null)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    background: suspendingUser.status === 'suspended' ? 'var(--accent-emerald)' : '#eab308',
                    borderColor: suspendingUser.status === 'suspended' ? 'var(--accent-emerald)' : '#eab308',
                  }}
                >
                  Confirm {suspendingUser.status === 'suspended' ? 'Reactivation' : 'Suspension'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── MODAL: Reject Verification Request ────────────────────────── */}
        {rejectingUser && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <form onSubmit={handleRejectRole} className="glass-card-static" style={{ width: '450px', padding: '2rem' }}>
              <h3 style={{ color: '#ef4444', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <XCircle size={22} /> Reject Request: {rejectingUser.name}
              </h3>
              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Reason for Rejection</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Feedback explaining why this verification request was rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setRejectingUser(null)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }}>
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── MODAL: Create Institution ──────────────────────────────────── */}
        {showCreateInstModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <form onSubmit={handleCreateInstitution} className="glass-card-static" style={{ width: '480px', padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Register New College / Institution</h3>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Institution Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Oxford Institute of Technology"
                    value={newInst.name}
                    onChange={(e) => setNewInst({ ...newInst, name: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Institution Code</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. OIT-ENG"
                      value={newInst.code}
                      onChange={(e) => setNewInst({ ...newInst, code: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email Domain</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. oit.edu"
                      value={newInst.domain}
                      onChange={(e) => setNewInst({ ...newInst, domain: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">City</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Mumbai"
                      value={newInst.city}
                      onChange={(e) => setNewInst({ ...newInst, city: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">State</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Maharashtra"
                      value={newInst.state}
                      onChange={(e) => setNewInst({ ...newInst, state: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowCreateInstModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Create Institution
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── MODAL: Assign Institution Admin ────────────────────────────── */}
        {assigningInst && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <form onSubmit={handleAssignAdmin} className="glass-card-static" style={{ width: '450px', padding: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Assign Institution Admin</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Institution: <strong>{assigningInst.name}</strong>
              </p>
              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">User Email Address</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="Enter email of registered user..."
                  value={adminEmailToAssign}
                  onChange={(e) => setAdminEmailToAssign(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setAssigningInst(null)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Assign Privileges
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default AdminDashboard;
