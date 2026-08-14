import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  GraduationCap,
  Briefcase,
  CheckSquare,
  Megaphone,
  FolderOpen,
  ShieldAlert,
  Settings,
  Download,
  Upload,
  Calendar,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import InstitutionAdminLayout from '../../layouts/InstitutionAdminLayout';
import api from '../../api/axios';
import VoluntaryChangePasswordForm from '../../components/VoluntaryChangePasswordForm';
import { AuthContext } from '../../context/AuthContext';

const AdminDashboard = ({ activeTab: propActiveTab }) => {
  const { user: currentUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const userRoles = Array.isArray(currentUser?.roles) && currentUser.roles.length > 0 ? currentUser.roles : [currentUser?.role];
  const isSuperAdmin = userRoles.includes('super_admin') || currentUser?.role === 'super_admin' || currentUser?.role === 'admin';

  // Determine current active tab based on location URL path or prop
  const getTabFromPath = useCallback(() => {
    const path = location.pathname.replace(/\/$/u, '');
    if (path === '/admin/students') return 'students';
    if (path === '/admin/teachers') return 'teachers';
    if (path === '/admin/recruiters') return 'recruiters';
    if (path === '/admin/verifications') return 'verifications';
    if (path === '/admin/departments') return 'departments';
    if (path === '/admin/announcements') return 'announcements';
    if (path === '/admin/reports') return 'reports';
    if (path === '/admin/analytics') return 'analytics';
    if (path === '/admin/documents') return 'documents';
    if (path === '/admin/audit-logs' || path === '/admin/audit') return 'audit-logs';
    if (path === '/admin/settings') return 'settings';
    if (path === '/admin/profile') return 'profile';
    if (propActiveTab && propActiveTab !== 'overview') return propActiveTab;
    return 'overview';
  }, [location.pathname, propActiveTab]);

  const activeTab = getTabFromPath();

  // State definitions
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [roleRequests, setRoleRequests] = useState([]);
  const [prnRequests, setPrnRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [institutionData, setInstitutionData] = useState(null);
  const [allInstitutions, setAllInstitutions] = useState([]);

  // Fetch all institutions for administrative dropdowns
  useEffect(() => {
    api.get('/admin/institutions')
      .then(res => {
        const list = Array.isArray(res.data?.data?.institutions) ? res.data.data.institutions : Array.isArray(res.data?.data) ? res.data.data : [];
        setAllInstitutions(list);
      })
      .catch(() => {});
  }, []);

  // General Loading & Error State
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [editUser, setEditUser] = useState(null);
  const [suspendingUser, setSuspendingUser] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', department: '' });

  // Staff Provisioning Modal state
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    role: 'teacher',
    identifierType: 'FACULTY_ID',
    identifierValue: '',
    department: '',
    designation: '',
    phone: '',
    companyName: '',
  });
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [staffSuccessMsg, setStaffSuccessMsg] = useState('');
  const [staffErrorMsg, setStaffErrorMsg] = useState('');
  const [resendingInviteId, setResendingInviteId] = useState(null);

  // Institution Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    code: '',
    domain: '',
    city: '',
    state: '',
    country: 'India',
    contactEmail: '',
    contactPhone: '',
  });

  // Reset pagination on tab change or search/filter change
  useEffect(() => {
    setPage(1);
    setSearch('');
    setFilterDepartment('');
    setFilterStatus('');
    setErrorMessage(null);
  }, [activeTab]);

  // Main Data Loader
  const loadTabData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      if (activeTab === 'overview') {
        const [statsRes, reqsRes, prnRes] = await Promise.all([
          api.get('/admin/stats').catch(() => null),
          api.get('/admin/role-requests?status=pending').catch(() => null),
          api.get('/admin/prn-verifications?status=pending').catch(() => null),
        ]);
        if (statsRes?.data?.data) setStats(statsRes.data.data);
        if (reqsRes?.data?.data) setRoleRequests(reqsRes.data.data);
        if (prnRes?.data?.data) setPrnRequests(prnRes.data.data);
      } else if (activeTab === 'students') {
        const deptParam = filterDepartment ? `&department=${filterDepartment}` : '';
        const statusParam = filterStatus ? `&status=${filterStatus}` : '';
        const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
        const res = await api.get(`/admin/users?role=user&page=${page}&limit=20${deptParam}${statusParam}${searchParam}`);
        setStudents(res.data?.data?.users || []);
        setPagination(res.data?.data?.pagination || { page: 1, pages: 1, total: 0 });
      } else if (activeTab === 'teachers') {
        const deptParam = filterDepartment ? `&department=${filterDepartment}` : '';
        const statusParam = filterStatus ? `&status=${filterStatus}` : '';
        const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
        const res = await api.get(`/admin/users?role=teacher&page=${page}&limit=20${deptParam}${statusParam}${searchParam}`);
        setTeachers(res.data?.data?.users || []);
        setPagination(res.data?.data?.pagination || { page: 1, pages: 1, total: 0 });
      } else if (activeTab === 'recruiters') {
        const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
        const res = await api.get(`/admin/users?role=recruiter&page=${page}&limit=20${searchParam}`);
        setRecruiters(res.data?.data?.users || []);
        setPagination(res.data?.data?.pagination || { page: 1, pages: 1, total: 0 });
      } else if (activeTab === 'verifications') {
        const [roleRes, prnRes] = await Promise.all([
          api.get('/admin/role-requests?status=pending'),
          api.get('/admin/prn-verifications?status=pending'),
        ]);
        setRoleRequests(roleRes.data?.data || []);
        setPrnRequests(prnRes.data?.data || []);
      } else if (activeTab === 'departments') {
        const res = await api.get('/admin/departments');
        setDepartments(res.data?.data || []);
      } else if (activeTab === 'announcements') {
        const res = await api.get('/announcements/my-college').catch(() => api.get('/teacher/announcements'));
        setAnnouncements(res.data?.data || []);
      } else if (activeTab === 'reports') {
        const res = await api.get('/admin/stats');
        setStats(res.data?.data || null);
      } else if (activeTab === 'analytics') {
        const [statsRes, analyticsRes] = await Promise.all([
          api.get('/admin/stats').catch(() => null),
          api.get('/teacher/batch-analytics').catch(() => null),
        ]);
        if (statsRes?.data?.data) setStats(statsRes.data.data);
        if (analyticsRes?.data?.data) setAnalytics(analyticsRes.data.data);
      } else if (activeTab === 'documents') {
        const res = await api.get('/documents').catch(() => ({ data: { data: [] } }));
        setDocuments(res.data?.data || []);
      } else if (activeTab === 'audit-logs') {
        const res = await api.get(`/admin/logs?page=${page}&limit=50`);
        setLogs(res.data?.data?.logs || []);
        setPagination(res.data?.data?.pagination || { page: 1, pages: 1, total: 0 });
      } else if (activeTab === 'settings') {
        let instId = currentUser?.institutionId?._id || currentUser?.institutionId;
        if (instId) {
          const res = await api.get(`/admin/institutions/${instId}`).catch(() => null);
          if (res?.data?.data?.institution) {
            const inst = res.data.data.institution;
            setInstitutionData(inst);
            setSettingsForm({
              name: inst.name || '',
              code: inst.code || '',
              domain: inst.domain || inst.officialDomain || '',
              city: inst.city || '',
              state: inst.state || '',
              country: inst.country || 'India',
              contactEmail: inst.primaryContact?.email || '',
              contactPhone: inst.primaryContact?.phone || '',
            });
          }
        }
      }
    } catch (err) {
      console.error(`Error loading data for ${activeTab}:`, err);
      if (err.response?.status === 401) {
        setErrorMessage('Your session has expired. Please sign in again.');
      } else if (err.response?.status === 403) {
        setErrorMessage('You do not have permission to access this resource.');
      } else if (err.response?.status === 404) {
        setErrorMessage('The requested data endpoint was not found.');
      } else {
        setErrorMessage(err.response?.data?.message || 'Unable to load data from server.');
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, search, filterDepartment, filterStatus, currentUser]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  // Action Handlers
  const handleApproveRole = async (id) => {
    try {
      await api.post(`/admin/role-requests/${id}/approve`);
      loadTabData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve role request.');
    }
  };

  const handleRejectRole = async (e) => {
    e.preventDefault();
    if (!rejectingUser) return;
    try {
      if (rejectingUser.maviId || rejectingUser.prn) {
        await api.post(`/admin/prn-verifications/${rejectingUser._id}/reject`, { reason: rejectionReason });
      } else {
        await api.post(`/admin/role-requests/${rejectingUser._id}/reject`, { reason: rejectionReason });
      }
      setRejectingUser(null);
      setRejectionReason('');
      loadTabData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject request.');
    }
  };

  const handleApprovePrn = async (id) => {
    try {
      await api.post(`/admin/prn-verifications/${id}/approve`);
      loadTabData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify PRN identity.');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      if (editUser.selectedInstitutionId) {
        await api.patch(`/admin/users/${editUser._id}/institution`, {
          institutionId: editUser.selectedInstitutionId,
        });
      }
      await api.put(`/admin/users/${editUser._id}`, {
        role: editUser.role,
        isVerified: editUser.isVerified,
        name: editUser.name,
      });
      setEditUser(null);
      loadTabData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user profile.');
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
      loadTabData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update account status.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this account?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      loadTabData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete account.');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/admin/my-institution', {
        name: settingsForm.name,
        code: settingsForm.code,
        domain: settingsForm.domain,
        city: settingsForm.city,
        state: settingsForm.state,
        country: settingsForm.country,
        primaryContact: {
          email: settingsForm.contactEmail,
          phone: settingsForm.contactPhone,
        },
      });
      alert('Institution settings saved successfully!');
      loadTabData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update institution settings.');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teacher/announcements', newAnnouncement);
      setShowCreateAnnouncement(false);
      setNewAnnouncement({ title: '', content: '', department: '' });
      loadTabData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish announcement.');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/teacher/announcements/${id}`);
      loadTabData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete announcement.');
    }
  };

  const handleCreateStaffUser = async (e) => {
    e.preventDefault();
    setStaffErrorMsg('');
    setStaffSuccessMsg('');
    setCreatingStaff(true);

    try {
      const res = await api.post('/admin/users', staffForm);
      if (res.data?.success) {
        setStaffSuccessMsg(res.data.message || 'Staff account created successfully! Invitation email sent.');
        setTimeout(() => {
          setShowCreateStaffModal(false);
          setStaffSuccessMsg('');
          setStaffForm({
            name: '',
            email: '',
            role: 'teacher',
            identifierType: 'FACULTY_ID',
            identifierValue: '',
            department: '',
            designation: '',
            phone: '',
            companyName: '',
          });
          loadTabData();
        }, 1500);
      }
    } catch (err) {
      setStaffErrorMsg(err.response?.data?.message || 'Failed to create staff account.');
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleResendInvitation = async (userId, userEmail) => {
    try {
      setResendingInviteId(userId);
      const res = await api.post(`/admin/users/${userId}/resend-invitation`);
      if (res.data?.success) {
        alert(res.data.message || `Invitation email resent to ${userEmail}`);
        loadTabData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resend invitation email.');
    } finally {
      setResendingInviteId(null);
    }
  };

  return (
    <InstitutionAdminLayout activeTab={activeTab}>
      <div style={{ padding: '1rem', maxWidth: '1280px', margin: '0 auto', color: 'white' }}>
        {/* Top Branding Bar */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
                <Shield className="text-gradient" size={28} />
                {currentUser?.institutionId?.name || currentUser?.university?.name || 'Institution Administration'}
              </h1>
              <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                {currentUser?.designation || 'Academic Administrator'}
              </span>
              {currentUser?.tenantId && (
                <span className="badge badge-outline" style={{ fontSize: '0.75rem', fontFamily: 'monospace', borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }}>
                  Tenant: {currentUser.tenantId}
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.85rem' }}>
              Multi-Tenant Scoped Portal — Logged in as <strong>{currentUser?.name}</strong> ({currentUser?.email})
            </p>
          </div>

          <button onClick={loadTabData} className="btn btn-outline" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.85rem' }}>
            <RefreshCw size={14} /> Refresh Data
          </button>
        </header>

        {/* Global Error Banner */}
        {errorMessage && (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
            <div style={{ flex: 1, fontSize: '0.875rem' }}>{errorMessage}</div>
            <button onClick={loadTabData} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444' }}>
              Retry
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div className="animate-pulse" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', margin: '0 auto 1rem' }} />
            <p style={{ fontFamily: 'Outfit, sans-serif' }}>Loading {activeTab.replace('-', ' ')} data...</p>
          </div>
        ) : (
          <>
            {/* ─── 1. OVERVIEW VIEW ────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="animate-fade-in">
                {stats && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                      { label: 'Students', value: stats.students || 0, color: 'var(--accent-purple)', icon: <GraduationCap size={20} /> },
                      { label: 'Teachers', value: stats.teachers || 0, color: 'var(--accent-amber)', icon: <Users size={20} /> },
                      { label: 'Recruiters', value: stats.recruiters || 0, color: 'var(--accent-cyan)', icon: <Briefcase size={20} /> },
                      { label: 'Placement Drives', value: stats.drives || 0, color: 'var(--accent-emerald)', icon: <Building size={20} /> },
                      { label: 'Suspended Accounts', value: stats.suspended || 0, color: '#ef4444', icon: <UserX size={20} /> },
                    ].map((item) => (
                      <div key={item.label} className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: item.color }}>
                          {item.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: item.color }}>{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Navigation Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                  {[
                    { title: 'Student Directory', desc: 'View and manage student profiles, PRN identity, and statuses.', path: '/admin/students', icon: <GraduationCap size={24} />, color: 'var(--accent-purple)' },
                    { title: 'Faculty & Teachers', desc: 'Manage institutional faculty, department allocations, and permissions.', path: '/admin/teachers', icon: <Users size={24} />, color: 'var(--accent-amber)' },
                    { title: 'Identity Verifications', desc: `${roleRequests.length + prnRequests.length} pending verification requests requiring review.`, path: '/admin/verifications', icon: <CheckSquare size={24} />, color: 'var(--accent-cyan)' },
                    { title: 'Institution Settings', desc: 'Configure official institution details, domains, and contact profiles.', path: '/admin/settings', icon: <Settings size={24} />, color: 'var(--accent-emerald)' },
                  ].map((card) => (
                    <div
                      key={card.title}
                      className="glass-card"
                      onClick={() => navigate(card.path)}
                      style={{ padding: '1.5rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', transition: 'transform 0.2s' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ color: card.color }}>{card.icon}</div>
                        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{card.title}</h3>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>{card.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── 2. STUDENTS VIEW ────────────────────────────────────────────── */}
            {activeTab === 'students' && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search student by name, email, PRN, or MAVI ID..."
                      className="input-field"
                      style={{ marginBottom: 0, paddingLeft: '2.5rem' }}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                  <select
                    className="input-field"
                    style={{ width: '180px', marginBottom: 0 }}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="glass-card-static" style={{ overflowX: 'auto' }}>
                  {students.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <GraduationCap size={36} style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }} />
                      <p>No students found. Search criteria yielded no results.</p>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '1rem' }}>Student Profile</th>
                          <th style={{ padding: '1rem' }}>MAVI ID / PRN</th>
                          <th style={{ padding: '1rem' }}>Department & Year</th>
                          <th style={{ padding: '1rem' }}>Status</th>
                          <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s) => (
                          <tr key={s._id} style={{ borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle' }}>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ fontWeight: '600' }}>{s.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.email}</div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{s.maviId || '—'}</div>
                              <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{s.prn || 'PRN Pending'}</div>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              <div>{s.department || s.university?.department || 'Computer Science'}</div>
                              <div>Batch {s.university?.batch || '2026'}</div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span className={`badge ${s.status === 'suspended' ? 'badge-outline' : 'badge-primary'}`} style={{ color: s.status === 'suspended' ? '#ef4444' : undefined }}>
                                {s.status === 'suspended' ? 'Suspended' : 'Active'}
                              </span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button onClick={() => setEditUser(s)} className="btn btn-outline" style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem' }}>
                                  <Edit size={12} /> Edit
                                </button>
                                <button onClick={() => setSuspendingUser(s)} className="btn btn-outline" style={{ borderColor: s.status === 'suspended' ? 'var(--accent-emerald)' : '#eab308', color: s.status === 'suspended' ? 'var(--accent-emerald)' : '#eab308', padding: '0.35rem 0.55rem', fontSize: '0.75rem' }}>
                                  {s.status === 'suspended' ? 'Activate' : 'Suspend'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {pagination.pages > 1 && (
                    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Page {pagination.page} of {pagination.pages} ({pagination.total} students)</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Prev</button>
                        <button disabled={page >= pagination.pages} onClick={() => setPage(page + 1)} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Next</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── 3. TEACHERS VIEW ────────────────────────────────────────────── */}
            {activeTab === 'teachers' && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Faculty & Teacher Provisioning</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>Teacher accounts are admin-provisioned via secure email invitations</p>
                  </div>
                  <button
                    onClick={() => {
                      setStaffForm((prev) => ({ ...prev, role: 'teacher', identifierType: 'FACULTY_ID' }));
                      setShowCreateStaffModal(true);
                    }}
                    className="btn btn-primary"
                    style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}
                  >
                    <UserPlus size={16} /> Provision Teacher Account
                  </button>
                </div>

                <div className="glass-card-static" style={{ overflowX: 'auto' }}>
                  {teachers.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Users size={36} style={{ marginBottom: '0.5rem' }} />
                      <p>No teachers found for this institution.</p>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '1rem' }}>Faculty Member</th>
                          <th style={{ padding: '1rem' }}>Department & Designation</th>
                          <th style={{ padding: '1rem' }}>Status</th>
                          <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teachers.map((t) => (
                          <tr key={t._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ fontWeight: '600' }}>{t.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.email}</div>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              <div>{t.department || 'Computer Engineering'}</div>
                              <div>{t.designation || 'Assistant Professor'}</div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span className="badge badge-primary">{t.status || 'Active'}</span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <button onClick={() => setEditUser(t)} className="btn btn-outline" style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem' }}>
                                Edit Profile
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ─── 4. RECRUITERS VIEW ─────────────────────────────────────────── */}
            {activeTab === 'recruiters' && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Corporate Recruiter Provisioning</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>Recruiter accounts are admin-provisioned via secure email invitations</p>
                  </div>
                  <button
                    onClick={() => {
                      setStaffForm((prev) => ({ ...prev, role: 'recruiter', identifierType: 'RECRUITER_ID' }));
                      setShowCreateStaffModal(true);
                    }}
                    className="btn btn-primary"
                    style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}
                  >
                    <UserPlus size={16} /> Provision Recruiter Account
                  </button>
                </div>

                <div className="glass-card-static" style={{ overflowX: 'auto' }}>
                  {recruiters.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Briefcase size={36} style={{ marginBottom: '0.5rem' }} />
                      <p>No corporate recruiters registered under this institution.</p>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '1rem' }}>Recruiter</th>
                          <th style={{ padding: '1rem' }}>Company / Organization</th>
                          <th style={{ padding: '1rem' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recruiters.map((r) => (
                          <tr key={r._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ fontWeight: '600' }}>{r.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.email}</div>
                            </td>
                            <td style={{ padding: '1rem', fontWeight: '500' }}>{r.companyName || r.organization || 'Hiring Partner'}</td>
                            <td style={{ padding: '1rem' }}><span className="badge badge-primary">{r.status || 'Active'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ─── 5. VERIFICATIONS VIEW ───────────────────────────────────────── */}
            {activeTab === 'verifications' && (
              <div className="animate-fade-in" style={{ display: 'grid', gap: '2rem' }}>
                <div className="glass-card-static" style={{ padding: '1.5rem' }}>
                  <h3 style={{ marginBottom: '1rem', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckSquare size={20} /> Pending Role Requests ({roleRequests.length})
                  </h3>
                  {roleRequests.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No pending role requests.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.75rem' }}>Applicant</th>
                          <th style={{ padding: '0.75rem' }}>Requested Role</th>
                          <th style={{ padding: '0.75rem' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roleRequests.map((req) => (
                          <tr key={req._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ fontWeight: '600' }}>{req.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{req.email}</div>
                            </td>
                            <td style={{ padding: '0.75rem' }}><span className="badge badge-primary">{req.requestedRole}</span></td>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button onClick={() => handleApproveRole(req._id)} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Approve</button>
                                <button onClick={() => setRejectingUser(req)} className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Reject</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="glass-card-static" style={{ padding: '1.5rem' }}>
                  <h3 style={{ marginBottom: '1rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={20} /> PRN & Identity Verifications ({prnRequests.length})
                  </h3>
                  {prnRequests.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No pending PRN identity verifications.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.75rem' }}>Student / MAVI ID</th>
                          <th style={{ padding: '0.75rem' }}>PRN / Faculty ID</th>
                          <th style={{ padding: '0.75rem' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prnRequests.map((req) => (
                          <tr key={req._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ fontWeight: '600' }}>{req.name}</div>
                              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-purple)' }}>{req.maviId}</div>
                            </td>
                            <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: 'bold' }}>{req.prn || req.facultyId || 'Not Provided'}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button onClick={() => handleApprovePrn(req._id)} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Verify PRN</button>
                                <button onClick={() => setRejectingUser(req)} className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Reject</button>
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

            {/* ─── 6. DEPARTMENTS VIEW ────────────────────────────────────────── */}
            {activeTab === 'departments' && (
              <div className="animate-fade-in">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                  {departments.map((d) => (
                    <div key={d.name} className="glass-card" style={{ padding: '1.5rem' }}>
                      <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--accent-purple)' }}>{d.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                        <span>Students:</span> <span style={{ fontWeight: 'bold', color: 'white' }}>{d.students}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span>Faculty Teachers:</span> <span style={{ fontWeight: 'bold', color: 'white' }}>{d.teachers}</span>
                      </div>
                    </div>
                  ))}
                  {departments.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                      No departments configured.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── 7. ANNOUNCEMENTS VIEW ──────────────────────────────────────── */}
            {activeTab === 'announcements' && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3>Institution Announcements</h3>
                  <button onClick={() => setShowCreateAnnouncement(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <Plus size={16} /> New Announcement
                  </button>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  {announcements.map((a) => (
                    <div key={a._id} className="glass-card-static" style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent-purple)' }}>{a.title}</h4>
                        <button onClick={() => handleDeleteAnnouncement(a._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', whiteSpace: 'pre-wrap' }}>{a.content}</p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Posted on {new Date(a.createdAt).toLocaleDateString()} {a.department ? `• Target: ${a.department}` : ''}
                      </div>
                    </div>
                  ))}
                  {announcements.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No announcements posted yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── 8. REPORTS VIEW ────────────────────────────────────────────── */}
            {activeTab === 'reports' && (
              <div className="animate-fade-in glass-card-static" style={{ padding: '2rem', textAlign: 'center' }}>
                <FileText size={48} style={{ color: 'var(--accent-purple)', marginBottom: '1rem' }} />
                <h3>Institutional Performance & Placement Reports</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
                  Generate and download verified institutional performance reports for NAAC accreditation, placement drives, and academic audits.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                  <button onClick={() => alert('Exporting Placement & Readiness PDF...')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={16} /> Export Readiness Report (PDF)
                  </button>
                  <button onClick={() => alert('Exporting Student Audit Roster CSV...')} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={16} /> Export Student Roster (CSV)
                  </button>
                </div>
              </div>
            )}

            {/* ─── 9. ANALYTICS VIEW ──────────────────────────────────────────── */}
            {activeTab === 'analytics' && (
              <div className="animate-fade-in glass-card-static" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={22} style={{ color: 'var(--accent-purple)' }} /> Student Skill & Placement Readiness Distribution
                </h3>
                {stats ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--accent-purple)' }}>{stats.students || 0}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Enrolled Students</div>
                    </div>
                    <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--accent-emerald)' }}>84%</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Placement Readiness Rate</div>
                    </div>
                    <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>{stats.teachers || 0}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Faculty Evaluators</div>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>Analytics loading...</p>
                )}
              </div>
            )}

            {/* ─── 10. SHARED DOCUMENTS VIEW ──────────────────────────────────── */}
            {activeTab === 'documents' && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3>Shared Institution Documents</h3>
                  <button onClick={() => alert('Document upload modal activated')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <Upload size={16} /> Upload Document
                  </button>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {documents.map((doc) => (
                    <div key={doc._id} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FolderOpen size={20} style={{ color: 'var(--accent-purple)' }} />
                        <div>
                          <div style={{ fontWeight: '600' }}>{doc.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.category || 'General'}</div>
                        </div>
                      </div>
                      <a href={doc.fileUrl || '#'} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                        <ExternalLink size={12} /> View
                      </a>
                    </div>
                  ))}
                  {documents.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No shared documents available.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── 11. AUDIT LOGS VIEW ───────────────────────────────────────── */}
            {activeTab === 'audit-logs' && (
              <div className="animate-fade-in glass-card-static" style={{ padding: '1rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem' }}>Timestamp</th>
                      <th style={{ padding: '0.75rem' }}>User / Actor</th>
                      <th style={{ padding: '0.75rem' }}>Action & Details</th>
                      <th style={{ padding: '0.75rem' }}>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(log.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ fontWeight: '600' }}>{log.userId?.name || 'System'}</span>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.userId?.email || ''}</div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ color: 'var(--accent-purple)', fontWeight: '600', marginRight: '0.5rem' }}>{log.action}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{log.details}</span>
                        </td>
                        <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{log.ipAddress || '127.0.0.1'}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ─── 12. INSTITUTION SETTINGS VIEW ─────────────────────────────── */}
            {activeTab === 'settings' && (
              <div className="animate-fade-in glass-card-static" style={{ padding: '2rem', maxWidth: '720px' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Settings size={22} style={{ color: 'var(--accent-purple)' }} /> Institution Profile & Configuration
                </h3>
                <form onSubmit={handleSaveSettings} style={{ display: 'grid', gap: '1.25rem' }}>
                  <div className="input-group">
                    <label className="input-label">Institution Legal Name</label>
                    <input
                      type="text"
                      className="input-field"
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                      <label className="input-label">Institution Code</label>
                      <input
                        type="text"
                        className="input-field"
                        value={settingsForm.code}
                        onChange={(e) => setSettingsForm({ ...settingsForm, code: e.target.value })}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Official Domain</label>
                      <input
                        type="text"
                        className="input-field"
                        value={settingsForm.domain}
                        onChange={(e) => setSettingsForm({ ...settingsForm, domain: e.target.value })}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                      <label className="input-label">City</label>
                      <input
                        type="text"
                        className="input-field"
                        value={settingsForm.city}
                        onChange={(e) => setSettingsForm({ ...settingsForm, city: e.target.value })}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">State</label>
                      <input
                        type="text"
                        className="input-field"
                        value={settingsForm.state}
                        onChange={(e) => setSettingsForm({ ...settingsForm, state: e.target.value })}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                      <label className="input-label">Primary Contact Email</label>
                      <input
                        type="email"
                        className="input-field"
                        value={settingsForm.contactEmail}
                        onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Primary Contact Phone</label>
                      <input
                        type="text"
                        className="input-field"
                        value={settingsForm.contactPhone}
                        onChange={(e) => setSettingsForm({ ...settingsForm, contactPhone: e.target.value })}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ justifySelf: 'start', padding: '0.6rem 1.5rem' }}>
                    Save Settings
                  </button>
                </form>
              </div>
            )}

            {/* ─── 13. ADMIN PROFILE VIEW ────────────────────────────────────── */}
            {activeTab === 'profile' && (
              <>
                <div className="animate-fade-in glass-card-static" style={{ padding: '2rem', maxWidth: '640px' }}>
                  <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserCheck size={22} style={{ color: 'var(--accent-purple)' }} /> Administrator Profile
                  </h3>

                  <div style={{ display: 'grid', gap: '1rem', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', justify: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Full Name:</span>
                      <span style={{ fontWeight: 'bold' }}>{currentUser?.name}</span>
                    </div>
                    <div style={{ display: 'flex', justify: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Official Email:</span>
                      <span style={{ fontWeight: 'bold' }}>{currentUser?.email}</span>
                    </div>
                    <div style={{ display: 'flex', justify: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Designation:</span>
                      <span>{currentUser?.designation || 'Academic Administrator'}</span>
                    </div>
                    <div style={{ display: 'flex', justify: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Admin ID:</span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{currentUser?.adminId || currentUser?.adminLoginId || 'MAVI-ADM-001'}</span>
                    </div>
                    <div style={{ display: 'flex', justify: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Tenant ID:</span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--accent-purple)', fontWeight: 'bold' }}>{currentUser?.tenantId || currentUser?.institutionId?.tenantId || 'INST-SCOPED'}</span>
                    </div>
                    <div style={{ display: 'flex', justify: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>MAVI Identity ID:</span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--accent-emerald)' }}>{currentUser?.maviId}</span>
                    </div>
                    <div style={{ display: 'flex', justify: 'space-between', padding: '0.75rem 0' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Roles & Privileges:</span>
                      <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{userRoles.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '2rem', maxWidth: '640px' }}>
                  <VoluntaryChangePasswordForm />
                </div>
              </>
            )}
          </>
        )}

        {/* ─── MODAL: Edit User ────────────────────────────────────────────── */}
        {editUser && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <form onSubmit={handleUpdateUser} className="glass-card-static" style={{ width: '420px', padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Modify Account: {editUser.name}</h3>
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
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Institution Assignment (Admin Controlled)</label>
                  <select
                    className="input-field"
                    value={editUser.selectedInstitutionId || (typeof editUser.institutionId === 'object' ? editUser.institutionId?._id : editUser.institutionId) || ''}
                    onChange={(e) => setEditUser({ ...editUser, selectedInstitutionId: e.target.value })}
                  >
                    <option value="">Select Institution...</option>
                    {allInstitutions.map((inst) => (
                      <option key={inst._id} value={inst._id}>
                        {inst.name} ({inst.tenantId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setEditUser(null)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
              </div>
            </form>
          </div>
        )}

        {/* ─── MODAL: Suspend User ───────────────────────────────────────── */}
        {suspendingUser && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <form onSubmit={handleToggleUserStatus} className="glass-card-static" style={{ width: '450px', padding: '2rem' }}>
              <h3 style={{ color: suspendingUser.status === 'suspended' ? 'var(--accent-emerald)' : '#eab308', marginBottom: '1rem' }}>
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
                <button type="button" onClick={() => setSuspendingUser(null)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirm</button>
              </div>
            </form>
          </div>
        )}

        {/* ─── MODAL: Reject Verification ─────────────────────────────────── */}
        {rejectingUser && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <form onSubmit={handleRejectRole} className="glass-card-static" style={{ width: '450px', padding: '2rem' }}>
              <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>Reject Verification: {rejectingUser.name}</h3>
              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Reason for Rejection</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Provide feedback explaining why verification was rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setRejectingUser(null)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }}>Reject</button>
              </div>
            </form>
          </div>
        )}

        {/* ─── MODAL: Create Announcement ─────────────────────────────────── */}
        {showCreateAnnouncement && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <form onSubmit={handleCreateAnnouncement} className="glass-card-static" style={{ width: '480px', padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>New Institution Announcement</h3>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Title *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Announcement Title"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Content *</label>
                  <textarea
                    className="input-field"
                    rows={4}
                    placeholder="Write announcement details..."
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowCreateAnnouncement(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Publish</button>
              </div>
            </form>
          </div>
        )}

        {/* ─── MODAL: Create Staff Account (Teacher / Recruiter) ─────────────── */}
        {showCreateStaffModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '1rem' }}>
            <form onSubmit={handleCreateStaffUser} className="glass-card-static" style={{ width: '100%', maxWidth: '520px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserPlus className="text-purple-400" size={20} />
                  Provision Staff Account
                </h3>
                <button type="button" onClick={() => setShowCreateStaffModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                Provision a staff account. An invitation email with an activation link will be sent to the user. No password is created by the admin.
              </p>

              {staffErrorMsg && (
                <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#fca5a5', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  {staffErrorMsg}
                </div>
              )}

              {staffSuccessMsg && (
                <div style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', borderRadius: '8px', color: '#6ee7b7', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  {staffSuccessMsg}
                </div>
              )}

              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Staff Role *</label>
                  <select
                    className="input-field"
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({
                      ...staffForm,
                      role: e.target.value,
                      identifierType: e.target.value === 'teacher' ? 'FACULTY_ID' : 'RECRUITER_ID',
                    })}
                  >
                    <option value="teacher">Teacher / Faculty Member</option>
                    <option value="recruiter">Corporate Recruiter</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    className="input-field"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Email Address (Invitation Target) *</label>
                  <input
                    type="email"
                    required
                    placeholder="staff@institution.edu"
                    className="input-field"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">ID Type</label>
                    <select
                      className="input-field"
                      value={staffForm.identifierType}
                      onChange={(e) => setStaffForm({ ...staffForm, identifierType: e.target.value })}
                    >
                      {staffForm.role === 'teacher' ? (
                        <>
                          <option value="FACULTY_ID">FACULTY_ID</option>
                          <option value="EMPLOYEE_ID">EMPLOYEE_ID</option>
                        </>
                      ) : (
                        <>
                          <option value="RECRUITER_ID">RECRUITER_ID</option>
                          <option value="EMPLOYEE_ID">EMPLOYEE_ID</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">ID Number / Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. EMP-99201"
                      className="input-field"
                      value={staffForm.identifierValue}
                      onChange={(e) => setStaffForm({ ...staffForm, identifierValue: e.target.value })}
                    />
                  </div>
                </div>

                {staffForm.role === 'teacher' && (
                  <div className="input-group">
                    <label className="input-label">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Engineering"
                      className="input-field"
                      value={staffForm.department}
                      onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                    />
                  </div>
                )}

                {staffForm.role === 'recruiter' && (
                  <div className="input-group">
                    <label className="input-label">Company / Organization *</label>
                    <input
                      type="text"
                      required={staffForm.role === 'recruiter'}
                      placeholder="e.g. Google / Microsoft / TCS"
                      className="input-field"
                      value={staffForm.companyName}
                      onChange={(e) => setStaffForm({ ...staffForm, companyName: e.target.value })}
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Designation / Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Assistant Professor / Talent Lead"
                      className="input-field"
                      value={staffForm.designation}
                      onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      className="input-field"
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowCreateStaffModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={creatingStaff} className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}>
                  {creatingStaff ? 'Provisioning...' : 'Provision & Send Email'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </InstitutionAdminLayout>
  );
};

export default AdminDashboard;
