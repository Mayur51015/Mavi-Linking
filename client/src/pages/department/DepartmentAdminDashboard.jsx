import React, { useState, useEffect, useContext } from 'react';
import { Shield, Users, GraduationCap, FileText, Megaphone, Search, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const DepartmentAdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'students' | 'teachers'
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dashRes, stdRes, tchRes] = await Promise.all([
          api.get('/department-admin/dashboard').catch(() => null),
          api.get('/department-admin/students').catch(() => null),
          api.get('/department-admin/teachers').catch(() => null),
        ]);

        if (dashRes?.data?.data) setDashboardData(dashRes.data.data);
        if (stdRes?.data?.data?.students) setStudents(stdRes.data.data.students);
        if (tchRes?.data?.data) setTeachers(tchRes.data.data);
      } catch (err) {
        console.error('Error loading Department Admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredStudents = students.filter((s) =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.maviId && s.maviId.toLowerCase().includes(search.toLowerCase())) ||
    (s.prn && s.prn.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0b0c10', color: 'white', padding: '1.5rem 2rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Header Banner */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Shield className="text-gradient" size={30} />
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>
                {dashboardData?.departmentName || user?.university?.department || 'Department Administration'}
              </h1>
              <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                Department Admin
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.3rem', fontSize: '0.9rem' }}>
              Institution: <strong>{dashboardData?.institutionName || user?.university?.name || 'Zeal College'}</strong> | Logged in as <strong>{user?.name}</strong> ({user?.email})
            </p>
          </div>

          {/* Tab Controls */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '0.25rem' }}>
            {['overview', 'students', 'teachers'].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  border: 'none',
                  background: activeTab === t ? 'var(--accent-purple)' : 'transparent',
                  color: activeTab === t ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="animate-pulse" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gradient-primary)', margin: '0 auto 1rem' }} />
            Loading Department Portal Data...
          </div>
        ) : (
          <>
            {/* Overview View */}
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gap: '2rem' }}>
                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-purple)' }}>
                      <GraduationCap size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department Students</div>
                      <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--accent-purple)' }}>{dashboardData?.metrics?.students || students.length}</div>
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
                      <Users size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department Faculty</div>
                      <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--accent-amber)' }}>{dashboardData?.metrics?.teachers || teachers.length}</div>
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
                      <Megaphone size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Circulars</div>
                      <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--accent-emerald)' }}>{dashboardData?.metrics?.announcementsCount || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Security Scope Banner per Phase 23 */}
                <div style={{ padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <AlertCircle size={18} style={{ color: 'var(--accent-cyan)' }} />
                  <div>
                    <strong>Department Security Boundary:</strong> You have administrative access strictly scoped to <strong>{dashboardData?.departmentName || 'your department'}</strong> at <strong>{dashboardData?.institutionName || 'your institution'}</strong>. Global administrative actions and cross-department appointments are prohibited server-side.
                  </div>
                </div>
              </div>
            )}

            {/* Students View */}
            {activeTab === 'students' && (
              <div>
                <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '400px' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Search department students..."
                    style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>

                <div className="glass-card-static" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '1rem' }}>Student Name</th>
                        <th style={{ padding: '1rem' }}>MAVI ID / PRN</th>
                        <th style={{ padding: '1rem' }}>Overall Score</th>
                        <th style={{ padding: '1rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s) => (
                        <tr key={s._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: '600' }}>{s.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.email}</div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{s.maviId}</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{s.prn || 'Pending'}</div>
                          </td>
                          <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--accent-emerald)' }}>
                            {s.scores?.overall || 0} pts
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span className="badge badge-primary">{s.status || 'Active'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Teachers View */}
            {activeTab === 'teachers' && (
              <div className="glass-card-static" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '1rem' }}>Faculty Member</th>
                      <th style={{ padding: '1rem' }}>Designation</th>
                      <th style={{ padding: '1rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((t) => (
                      <tr key={t._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: '600' }}>{t.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.email}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>{t.designation || 'Assistant Professor'}</td>
                        <td style={{ padding: '1rem' }}><span className="badge badge-primary">{t.status || 'Active'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DepartmentAdminDashboard;
