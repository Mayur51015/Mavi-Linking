import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, FileText, BarChart3, Edit, Trash2, Save, Filter, RefreshCw } from 'lucide-react';
import UserLayout from '../../layouts/UserLayout';
import api from '../../api/axios';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const roleParam = filterRole ? `&role=${filterRole}` : '';
      const searchParam = search ? `&search=${search}` : '';
      const res = await api.get(`/admin/users?limit=50${roleParam}${searchParam}`);
      setUsers(res.data.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/admin/logs?limit=50');
      setLogs(res.data.data.logs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchUsers(), fetchLogs()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [filterRole, search]);

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
      alert('Failed to update user.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to ban/delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <UserLayout>
      <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto', color: 'white' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield className="text-gradient" size={36} /> Super Admin Control Panel
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>System moderation console, global user verification controls, audit logs, and platform stats.</p>
        </div>
        <button onClick={loadData} className="btn btn-outline" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          <RefreshCw size={14} /> Sync System
        </button>
      </header>

      {/* Stats Board */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { label: 'Students', value: stats.students, color: 'var(--accent-purple)' },
            { label: 'Recruiters', value: stats.recruiters, color: 'var(--accent-cyan)' },
            { label: 'Teachers', value: stats.teachers, color: 'var(--accent-amber)' },
            { label: 'Jobs', value: stats.jobs, color: 'var(--text-primary)' },
            { label: 'Drives', value: stats.drives, color: 'var(--accent-emerald)' },
          ].map(item => (
            <div key={item.label} className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', paddingBottom: '0.5rem' }}>
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
          }}
        >
          <Users size={16} /> User Moderation
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
          }}
        >
          <FileText size={16} /> Audit Trails
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Syncing admin dashboard data...</div>
      ) : (
        <>
          {activeTab === 'users' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  placeholder="Search user by name / email..."
                  className="input-field"
                  style={{ flex: 1, marginBottom: 0 }}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <select
                  className="input-field"
                  style={{ width: '200px', marginBottom: 0 }}
                  value={filterRole}
                  onChange={e => setFilterRole(e.target.value)}
                >
                  <option value="">All Roles</option>
                  <option value="user">Student</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="glass-card-static" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '1rem' }}>Name / Email</th>
                      <th style={{ padding: '1rem' }}>Role</th>
                      <th style={{ padding: '1rem' }}>Status</th>
                      <th style={{ padding: '1rem' }}>Joined Date</th>
                      <th style={{ padding: '1rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} style={{ borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: '600' }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ textTransform: 'capitalize' }}>{u.role === 'user' ? 'Student' : u.role}</span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span className={`badge ${u.isVerified ? 'badge-primary' : 'badge-outline'}`}>
                            {u.isVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => setEditUser(u)} className="btn btn-outline" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Edit size={12} /> Edit
                          </button>
                          {u.role !== 'admin' && (
                            <button onClick={() => handleDeleteUser(u._id)} className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444', padding: '0.4rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Trash2 size={12} /> Delete
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

          {activeTab === 'logs' && (
            <div className="animate-fade-in glass-card-static" style={{ padding: '1rem' }}>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 3fr 1fr', padding: '0.75rem 1rem', fontWeight: 'bold', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                  <div>Timestamp</div>
                  <div>User</div>
                  <div>Action Details</div>
                  <div>IP Address</div>
                </div>
                {logs.map(log => (
                  <div key={log._id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 3fr 1fr', padding: '0.75rem 1rem', fontSize: '0.8rem', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>{new Date(log.createdAt).toLocaleString()}</div>
                    <div>
                      <span style={{ fontWeight: '600' }}>{log.userId?.name || 'System'}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                        {log.userId?.role || 'Guest'}
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

      {/* Edit User Modal */}
      {editUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <form onSubmit={handleUpdateUser} className="glass-card-static" style={{ width: '400px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Modify User: {editUser.name}</h3>
              <button type="button" onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="input-group">
                <label className="input-label">Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={editUser.name}
                  onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Role</label>
                <select
                  className="input-field"
                  value={editUser.role}
                  onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                >
                  <option value="user">Student</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="input-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="isVerified"
                  checked={editUser.isVerified}
                  onChange={e => setEditUser({ ...editUser, isVerified: e.target.checked })}
                />
                <label htmlFor="isVerified" style={{ cursor: 'pointer' }}>Verified Account</label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Save Changes
            </button>
          </form>
        </div>
      )}
    </div>
    </UserLayout>
  );
};

// Simple close button helper
const X = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default AdminDashboard;
