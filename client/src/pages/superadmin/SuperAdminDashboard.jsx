import React, { useState, useEffect, useContext } from 'react';
import {
  ShieldAlert,
  Users,
  Building,
  UserPlus,
  Shield,
  FileText,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  UserX,
  UserCheck,
  Plus,
  Lock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Settings,
  Activity,
} from 'lucide-react';
import UserLayout from '../../layouts/UserLayout';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const SuperAdminDashboard = () => {
  const { user: currentUser } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [admins, setAdmins] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', role: 'admin', institutionId: '' });
  const [showCreateInstModal, setShowCreateInstModal] = useState(false);
  const [newInst, setNewInst] = useState({ name: '', code: '', domain: '', type: 'College', city: '', state: '' });
  const [suspendingUser, setSuspendingUser] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');

  const fetchStats = async () => {
    try {
      const res = await api.get('/super-admin/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error('Super Admin Stats error:', err);
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
      console.error('Super Admin users fetch error:', err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/super-admin/admins');
      setAdmins(res.data.data.admins || []);
    } catch (err) {
      console.error('Admins fetch error:', err);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const res = await api.get('/super-admin/institutions');
      setInstitutions(res.data.data.institutions || []);
    } catch (err) {
      console.error('Institutions fetch error:', err);
    }
  };

  const fetchSecurityEvents = async () => {
    try {
      const res = await api.get('/super-admin/security-events?limit=50');
      setSecurityEvents(res.data.data.events || []);
    } catch (err) {
      console.error('Security events fetch error:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchUsers(), fetchAdmins(), fetchInstitutions(), fetchSecurityEvents()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [filterRole, filterStatus, search, page]);

  // Actions
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await api.post('/super-admin/admins', newAdmin);
      setShowCreateAdminModal(false);
      setNewAdmin({ name: '', email: '', password: '', role: 'admin', institutionId: '' });
      fetchAdmins();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to create admin.');
    }
  };

  const handleRevokeAdmin = async (id) => {
    if (!window.confirm('Are you sure you want to revoke administrative access for this account?')) return;
    try {
      await api.delete(`/super-admin/admins/${id}`);
      fetchAdmins();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to revoke admin.');
    }
  };

  const handleCreateInstitution = async (e) => {
    e.preventDefault();
    try {
      await api.post('/super-admin/institutions', newInst);
      setShowCreateInstModal(false);
      setNewInst({ name: '', code: '', domain: '', type: 'College', city: '', state: '' });
      fetchInstitutions();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to create institution.');
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
      alert(err.response?.data?.message || 'Failed to update account status.');
    }
  };

  return (
    <UserLayout>
      <div style={{ padding: '1rem', maxWidth: '1280px', margin: '0 auto', color: 'white' }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                <ShieldAlert style={{ color: '#ef4444' }} size={32} />
                Platform Super Admin Governance Portal
              </h1>
              <span className="badge badge-primary" style={{ background: '#ef4444', borderColor: '#ef4444', fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                Master Control
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
              Global platform administration, multi-tenant college governance, admin provisioning, and system security monitoring.
            </p>
          </div>

          <button onClick={loadData} className="btn btn-outline" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <RefreshCw size={14} /> Refresh Platform Data
          </button>
        </header>

        {/* Global Overview Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total Users', value: stats.totalUsers, color: 'var(--accent-purple)' },
              { label: 'Institutions', value: stats.totalInstitutions, color: 'var(--accent-cyan)' },
              { label: 'Administrators', value: stats.totalAdmins, color: '#ec4899' },
              { label: 'Students', value: stats.students, color: 'var(--accent-emerald)' },
              { label: 'Pending Verifications', value: stats.pendingVerifications, color: 'var(--accent-amber)' },
              { label: 'Suspended Accounts', value: stats.suspended, color: '#ef4444' },
              { label: 'Security Events', value: stats.securityEvents, color: '#f97316' },
            ].map((item) => (
              <div key={item.label} className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: '800', color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Super Admin Navigation Tabs */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', paddingBottom: '0.5rem', overflowX: 'auto' }}>
          {[
            { id: 'overview', label: 'Platform Users', icon: Users },
            { id: 'institutions', label: 'Colleges & Institutions', icon: Building },
            { id: 'admins', label: 'Admin Management', icon: Shield },
            { id: 'security', label: 'Security Events Log', icon: ShieldAlert },
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                  borderBottom: activeTab === tab.id ? '2px solid #ef4444' : 'none',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                }}
              >
                <IconComponent size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading governance console...</div>
        ) : (
          <>
            {/* ─── TAB 1: User Governance ─────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search users by Name, Email, or MAVI ID (e.g. MAVI-8F3K7Q)..."
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
                        <th style={{ padding: '1rem' }}>MAVI ID / Profile</th>
                        <th style={{ padding: '1rem' }}>Role</th>
                        <th style={{ padding: '1rem' }}>Institution Scope</th>
                        <th style={{ padding: '1rem' }}>Status</th>
                        <th style={{ padding: '1rem' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No user records matched your criteria.
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u._id} style={{ borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle' }}>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent-purple)', fontSize: '0.8rem' }}>
                                {u.maviId || `MAVI-${u._id.slice(-8).toUpperCase()}`}
                              </div>
                              <div style={{ fontWeight: '600' }}>{u.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span className="badge badge-outline" style={{ textTransform: 'capitalize' }}>
                                {u.role === 'user' ? 'Student' : u.role}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {u.institutionId?.name || u.university?.name || 'Global Scope'}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span className={`badge ${u.status === 'suspended' ? 'badge-outline' : 'badge-primary'}`} style={{ color: u.status === 'suspended' ? '#ef4444' : undefined, borderColor: u.status === 'suspended' ? '#ef4444' : undefined }}>
                                {u.status === 'suspended' ? 'Suspended' : 'Active'}
                              </span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <button
                                onClick={() => setSuspendingUser(u)}
                                className="btn btn-outline"
                                style={{
                                  borderColor: u.status === 'suspended' ? 'var(--accent-emerald)' : '#eab308',
                                  color: u.status === 'suspended' ? 'var(--accent-emerald)' : '#eab308',
                                  padding: '0.35rem 0.65rem',
                                  fontSize: '0.75rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                }}
                              >
                                {u.status === 'suspended' ? <UserCheck size={12} /> : <UserX size={12} />}
                                {u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Page {pagination.page} of {pagination.pages} ({pagination.total} records)
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                          <ChevronLeft size={14} /> Prev
                        </button>
                        <button disabled={page >= pagination.pages} onClick={() => setPage(page + 1)} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                          Next <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── TAB 2: Colleges & Institutions ───────────────────────────── */}
            {activeTab === 'institutions' && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3>Registered Institutions & Colleges</h3>
                  <button onClick={() => setShowCreateInstModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Plus size={16} /> Add Institution
                  </button>
                </div>

                <div className="glass-card-static" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '1rem' }}>College / University</th>
                        <th style={{ padding: '1rem' }}>Code / Domain</th>
                        <th style={{ padding: '1rem' }}>Location</th>
                        <th style={{ padding: '1rem' }}>Assigned Inst Admins</th>
                      </tr>
                    </thead>
                    <tbody>
                      {institutions.map((inst) => (
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
                            {[inst.city, inst.state].filter(Boolean).join(', ') || 'India'}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {inst.admins && inst.admins.length > 0 ? (
                              inst.admins.map((adm) => (
                                <div key={adm._id} style={{ fontSize: '0.75rem', fontWeight: '600' }}>
                                  {adm.name} ({adm.email})
                                </div>
                              ))
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>None Assigned</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── TAB 3: Admin Management ──────────────────────────────────── */}
            {activeTab === 'admins' && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3>Platform & Institution Administrators</h3>
                  <button onClick={() => setShowCreateAdminModal(true)} className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <UserPlus size={16} /> Invite / Provision Admin
                  </button>
                </div>

                <div className="glass-card-static" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '1rem' }}>Admin Name / Email</th>
                        <th style={{ padding: '1rem' }}>MAVI ID</th>
                        <th style={{ padding: '1rem' }}>Administrative Role</th>
                        <th style={{ padding: '1rem' }}>Institution Scope</th>
                        <th style={{ padding: '1rem' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((adm) => (
                        <tr key={adm._id} style={{ borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle' }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: '600' }}>{adm.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{adm.email}</div>
                          </td>
                          <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent-purple)' }}>
                            {adm.maviId || `MAVI-${adm._id.slice(-8).toUpperCase()}`}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span className="badge badge-primary" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                              {adm.role}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {adm.institutionId?.name || 'Platform Wide (Global)'}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {adm._id !== currentUser._id && (
                              <button
                                onClick={() => handleRevokeAdmin(adm._id)}
                                className="btn btn-outline"
                                style={{ borderColor: '#ef4444', color: '#ef4444', padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                              >
                                Revoke Privileges
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── TAB 4: Security Events ───────────────────────────────────── */}
            {activeTab === 'security' && (
              <div className="animate-fade-in glass-card-static" style={{ padding: '1rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldAlert size={20} /> Security & Governance Audit Log
                </h3>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 3fr 1fr', padding: '0.75rem 1rem', fontWeight: 'bold', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                    <div>Timestamp</div>
                    <div>Actor / MAVI ID</div>
                    <div>Event Details</div>
                    <div>IP Address</div>
                  </div>
                  {securityEvents.map((evt) => (
                    <div key={evt._id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 3fr 1fr', padding: '0.75rem 1rem', fontSize: '0.8rem', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}>
                      <div style={{ color: 'var(--text-secondary)' }}>{new Date(evt.createdAt).toLocaleString()}</div>
                      <div>
                        <span style={{ fontWeight: '600' }}>{evt.userId?.name || 'System'}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', display: 'block', fontFamily: 'monospace' }}>
                          {evt.userId?.maviId || ''}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: '#ef4444', fontWeight: '600', marginRight: '0.5rem' }}>{evt.action}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{evt.details}</span>
                      </div>
                      <div style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{evt.ipAddress || '127.0.0.1'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── MODAL: Provision / Invite Admin ────────────────────────────── */}
        {showCreateAdminModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <form onSubmit={handleCreateAdmin} className="glass-card-static" style={{ width: '450px', padding: '2rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <h3 style={{ marginBottom: '1rem', color: '#ef4444' }}>Provision Administrator Access</h3>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Full Name *</label>
                  <input type="text" className="input-field" value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Email Address *</label>
                  <input type="email" className="input-field" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Initial Password (If new user)</label>
                  <input type="password" className="input-field" placeholder="••••••••" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Admin Role Level *</label>
                  <select className="input-field" value={newAdmin.role} onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}>
                    <option value="admin">Operational Admin</option>
                    <option value="institution_admin">Institution Admin</option>
                    <option value="super_admin">Super Admin (Global Authority)</option>
                  </select>
                </div>
                {newAdmin.role === 'institution_admin' && (
                  <div className="input-group">
                    <label className="input-label">Target Institution *</label>
                    <select className="input-field" value={newAdmin.institutionId} onChange={(e) => setNewAdmin({ ...newAdmin, institutionId: e.target.value })} required>
                      <option value="">Select College / Institution...</option>
                      {institutions.map((inst) => (
                        <option key={inst._id} value={inst._id}>{inst.name} ({inst.code || 'No Code'})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowCreateAdminModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }}>Grant Privileges</button>
              </div>
            </form>
          </div>
        )}

        {/* ─── MODAL: Create Institution ──────────────────────────────────── */}
        {showCreateInstModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <form onSubmit={handleCreateInstitution} className="glass-card-static" style={{ width: '480px', padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Register New College / Institution</h3>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Institution Name *</label>
                  <input type="text" className="input-field" placeholder="e.g. Stanford University" value={newInst.name} onChange={(e) => setNewInst({ ...newInst, name: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Code</label>
                    <input type="text" className="input-field" placeholder="e.g. STF-ENG" value={newInst.code} onChange={(e) => setNewInst({ ...newInst, code: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Domain</label>
                    <input type="text" className="input-field" placeholder="e.g. stanford.edu" value={newInst.domain} onChange={(e) => setNewInst({ ...newInst, domain: e.target.value })} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowCreateInstModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Institution</button>
              </div>
            </form>
          </div>
        )}

        {/* ─── MODAL: Account Suspension ──────────────────────────────────── */}
        {suspendingUser && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <form onSubmit={handleToggleUserStatus} className="glass-card-static" style={{ width: '450px', padding: '2rem' }}>
              <h3 style={{ color: suspendingUser.status === 'suspended' ? 'var(--accent-emerald)' : '#eab308', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={22} />
                {suspendingUser.status === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                User: <strong>{suspendingUser.name}</strong> ({suspendingUser.email}) <br />
                MAVI ID: <span style={{ fontFamily: 'monospace', color: 'var(--accent-purple)' }}>{suspendingUser.maviId || `MAVI-${suspendingUser._id.slice(-8).toUpperCase()}`}</span>
              </p>
              {suspendingUser.status !== 'suspended' && (
                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label">Reason for Suspension</label>
                  <textarea className="input-field" rows={3} placeholder="Provide explanation for security/policy log..." value={suspensionReason} onChange={(e) => setSuspensionReason(e.target.value)} required />
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setSuspendingUser(null)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: suspendingUser.status === 'suspended' ? 'var(--accent-emerald)' : '#eab308', borderColor: suspendingUser.status === 'suspended' ? 'var(--accent-emerald)' : '#eab308' }}>
                  Confirm {suspendingUser.status === 'suspended' ? 'Reactivation' : 'Suspension'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default SuperAdminDashboard;
