import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Users, GraduationCap, FileText, Megaphone, Search, AlertCircle, BarChart3, Trophy, Download, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { notify } from '../../context/ToastContext';
import DepartmentAdminLayout from '../../layouts/DepartmentAdminLayout';

const DepartmentAdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dashboardData, setDashboardData] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [search, setSearch] = useState('');

  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab) => {
    setSearchParams(tab === 'overview' ? {} : { tab });
  };

  const handleDownloadPdf = async () => {
    if (generatingPdf) return;
    setGeneratingPdf(true);
    try {
      const response = await api.get('/department-admin/reports/pdf', {
        responseType: 'blob',
      });

      let filename = `ETX_Department_Performance_Report_${(dashboardData?.departmentName || user?.university?.department || 'Department').replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      const disposition = response.headers?.['content-disposition'];
      if (disposition && disposition.includes('filename=')) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.setAttribute('download', filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      window.URL.revokeObjectURL(url);

      notify('success', 'PDF generated successfully.');
    } catch (err) {
      console.error('Error generating PDF report:', err);
      notify('error', 'Unable to generate the PDF report. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dashRes, stdRes, tchRes, anaRes, ldrRes, rptRes] = await Promise.all([
          api.get('/department-admin/dashboard').catch(() => null),
          api.get('/department-admin/students').catch(() => null),
          api.get('/department-admin/teachers').catch(() => null),
          api.get('/department-admin/analytics').catch(() => null),
          api.get('/department-admin/leaderboard').catch(() => null),
          api.get('/department-admin/reports').catch(() => null),
        ]);

        if (dashRes?.data?.data) setDashboardData(dashRes.data.data);
        if (stdRes?.data?.data?.students) setStudents(stdRes.data.data.students);
        if (tchRes?.data?.data) setTeachers(tchRes.data.data);
        if (anaRes?.data?.data) setAnalytics(anaRes.data.data);
        if (ldrRes?.data?.data?.leaderboard) setLeaderboard(ldrRes.data.data.leaderboard);
        if (rptRes?.data?.data) setReportsData(rptRes.data.data);
      } catch (err) {
        console.error('Error loading Department Admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredStudents = students.filter(
    (s) =>
      !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      (s.etxId && s.etxId.toLowerCase().includes(search.toLowerCase())) ||
      (s.prn && s.prn.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DepartmentAdminLayout>
      {/* Header Banner */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={24} style={{ color: 'var(--brand-blue)' }} />
              {dashboardData?.departmentName || user?.university?.department || 'Department Administration'}
            </h1>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
              Department Admin
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            {dashboardData?.institutionName || user?.university?.name || 'Institution Campus'} • {user?.name} ({user?.email})
          </p>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.25rem', flexWrap: 'wrap', gap: '0.25rem' }}>
          {['overview', 'students', 'teachers', 'analytics', 'leaderboard', 'reports'].map((t) => {
            const isSelected = activeTab === t;
            return (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  padding: '0.4rem 0.875rem',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: isSelected ? '600' : '500',
                  border: isSelected ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid transparent',
                  background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                  color: isSelected ? 'var(--brand-blue)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease',
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </header>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--brand-blue)', margin: '0 auto 0.75rem auto' }} />
          <div style={{ fontSize: '0.875rem' }}>Loading Department Records...</div>
        </div>
      ) : (
        <>
          {/* Overview View */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.08)', color: 'var(--brand-blue)' }}>
                    <GraduationCap size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department Students</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>{dashboardData?.metrics?.students || students.length}</div>
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.08)', color: 'var(--brand-blue)' }}>
                    <Users size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department Faculty</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>{dashboardData?.metrics?.teachers || teachers.length}</div>
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.08)', color: 'var(--brand-blue)' }}>
                    <BarChart3 size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Student Score</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>{dashboardData?.metrics?.avgMaviScore || 0} pts</div>
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.08)', color: 'var(--brand-blue)' }}>
                    <Megaphone size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Circulars</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>{dashboardData?.metrics?.announcementsCount || 0}</div>
                  </div>
                </div>
              </div>

              {/* Security Scope Banner */}
              <div
                style={{
                  padding: '1rem 1.25rem',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <AlertCircle size={18} style={{ color: 'var(--brand-blue)', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Department Security Boundary:</strong> Administrative access is strictly scoped to <strong>{dashboardData?.departmentName || 'your department'}</strong> at <strong>{dashboardData?.institutionName || 'your institution'}</strong>. Multi-department queries and global modifications are restricted.
                </div>
              </div>
            </div>
          )}

          {/* Students View */}
          {activeTab === 'students' && (
            <div>
              <div style={{ marginBottom: '1.25rem', position: 'relative', maxWidth: '400px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search department students..."
                  style={{ paddingLeft: '2.5rem', marginBottom: 0, fontSize: '0.875rem' }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>

              <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Student Name</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>ETX ID / PRN</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Overall Score</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => (
                      <tr key={s._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{s.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--text-primary)' }}>{s.etxId}</div>
                          <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.prn || 'Pending'}</div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--brand-blue)' }}>
                          {s.scores?.overall || 0} pts
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className="badge badge-primary">{s.status || 'Active'}</span>
                        </td>
                      </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          No students found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Teachers View */}
          {activeTab === 'teachers' && (
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Faculty Member</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Designation</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr key={t._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{t.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.email}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{t.designation || 'Assistant Professor'}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className="badge badge-primary">{t.status || 'Active'}</span>
                      </td>
                    </tr>
                  ))}
                  {teachers.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No faculty records found for this department.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Analytics View */}
          {activeTab === 'analytics' && (
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>Average Score Breakdown</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Overall EduTalentX Score</span>
                      <strong style={{ color: 'var(--brand-blue)' }}>{analytics?.averages?.overallScore || 0} pts</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Development Score</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{analytics?.averages?.developmentScore || 0} pts</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Problem Solving Score</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{analytics?.averages?.problemSolvingScore || 0} pts</strong>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>Score Tier Distribution</h3>
                  {analytics?.tierDistribution &&
                    Object.entries(analytics.tierDistribution).map(([tier, count]) => (
                      <div key={tier} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{tier}</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{count} students</strong>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard View */}
          {activeTab === 'leaderboard' && (
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', overflowX: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
                <Trophy size={18} style={{ color: 'var(--brand-blue)' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>Department Student Leaderboard</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Rank</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Student</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Tier</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((item) => (
                    <tr key={item._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--text-primary)' }}>#{item.rank}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.user?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.user?.etxId}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className="badge badge-primary">{item.scoreTier}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: 'var(--brand-blue)' }}>{item.score} pts</td>
                    </tr>
                  ))}
                  {leaderboard.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No leaderboard data currently available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Reports View */}
          {activeTab === 'reports' && (
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>Department Performance Report</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                    Generated at: {reportsData?.generatedAt ? new Date(reportsData.generatedAt).toLocaleString() : 'Just now'} | Total Records: {reportsData?.totalRecords || 0}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={generatingPdf}
                    className="btn btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      opacity: generatingPdf ? 0.7 : 1,
                      cursor: generatingPdf ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    {generatingPdf ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <FileText size={15} />
                        <span>Download PDF Report</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportsData, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      const cleanDept = (dashboardData?.departmentName || user?.university?.department || 'department').replace(/[^a-zA-Z0-9_-]/g, '_');
                      downloadAnchor.setAttribute("download", `department_report_${cleanDept}_${new Date().toISOString().split('T')[0]}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                    }}
                    className="btn btn-secondary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                    }}
                  >
                    <Download size={15} /> Export JSON Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </DepartmentAdminLayout>
  );
};

export default DepartmentAdminDashboard;
