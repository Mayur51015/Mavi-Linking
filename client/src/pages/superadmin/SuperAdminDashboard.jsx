import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  KeyRound,
  BarChart3,
  Sliders,
  User,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Download,
  ExternalLink,
} from 'lucide-react';
import SuperAdminLayout from '../../layouts/SuperAdminLayout';
import api from '../../api/axios';
import VoluntaryChangePasswordForm from '../../components/VoluntaryChangePasswordForm';
import PasswordInput from '../../components/ui/PasswordInput';
import UserLifecycleTable from '../../components/admin/UserLifecycleTable';
import UserLifecycleModal from '../../components/admin/UserLifecycleModal';
import { AuthContext } from '../../context/AuthContext';

const SuperAdminDashboard = ({ activeTab: propActiveTab }) => {
  const { user: currentUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Resolve current active tab from route URL or prop
  const getTabFromPath = useCallback(() => {
    const path = location.pathname.replace(/\/$/u, '');
    if (path === '/super-admin/institutions') return 'institutions';
    if (path === '/super-admin/institution-admins' || path === '/super-admin/admins') return 'institution-admins';
    if (path === '/super-admin/users') return 'users';
    if (path === '/super-admin/verification' || path === '/super-admin/verifications') return 'verification';
    if (path === '/super-admin/licenses') return 'licenses';
    if (path === '/super-admin/analytics') return 'analytics';
    if (path === '/super-admin/security') return 'security';
    if (path === '/super-admin/audit-logs' || path === '/super-admin/audit') return 'audit-logs';
    if (path === '/super-admin/settings') return 'settings';
    if (path === '/super-admin/profile') return 'profile';
    if (propActiveTab && propActiveTab !== 'overview') return propActiveTab;
    return 'overview';
  }, [location.pathname, propActiveTab]);

  const activeTab = getTabFromPath();

  // State definitions
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [roleRequests, setRoleRequests] = useState([]);
  const [prnRequests, setPrnRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // General Loading & Error state
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

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
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [errorInstitutions, setErrorInstitutions] = useState('');
  const [superAdminBilling, setSuperAdminBilling] = useState(null);
  const [assigningPlan, setAssigningPlan] = useState(false);

  // Administrator Lifecycle State
  const [selectedAdminForLifecycle, setSelectedAdminForLifecycle] = useState(null);
  const [adminLifecycleModalType, setAdminLifecycleModalType] = useState(null);
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  const handleAdminLifecycleSubmit = async (formData) => {
    if (!selectedAdminForLifecycle || !adminLifecycleModalType) return;
    setAdminActionLoading(true);
    try {
      if (adminLifecycleModalType === 'permanent_delete') {
        await api.delete(`/admin/users/${selectedAdminForLifecycle._id}/permanent`, { data: formData });
        alert(`Admin account ${selectedAdminForLifecycle.email} permanently deleted.`);
      } else if (adminLifecycleModalType === 'suspend') {
        await api.post(`/admin/users/${selectedAdminForLifecycle._id}/suspend`, formData);
        alert(`Admin account ${selectedAdminForLifecycle.email} suspended.`);
      } else if (adminLifecycleModalType === 'deactivate') {
        await api.post(`/admin/users/${selectedAdminForLifecycle._id}/deactivate`, formData);
        alert(`Admin account ${selectedAdminForLifecycle.email} deactivated.`);
      } else if (adminLifecycleModalType === 'reactivate') {
        await api.post(`/admin/users/${selectedAdminForLifecycle._id}/reactivate`, formData);
        alert(`Admin account ${selectedAdminForLifecycle.email} reactivated.`);
      }
      setSelectedAdminForLifecycle(null);
      setAdminLifecycleModalType(null);
      loadTabData();
    } catch (err) {
      alert(err.response?.data?.message || 'Admin lifecycle action failed.');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleAssignPlan = async (targetInstitutionId, planCode) => {
    setAssigningPlan(true);
    try {
      const res = await api.post('/super-admin/billing/assign-plan', { targetInstitutionId, planCode });
      if (res.data?.success) {
        loadTabData();
      }
    } catch (err) {
      console.error('Failed to assign plan:', err);
    } finally {
      setAssigningPlan(false);
    }
  };

  // Platform Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    platformName: 'MAVI Linking',
    requireEmailVerification: true,
    allowPublicRegistrations: true,
    defaultUserPlan: 'FREE',
    supportEmail: 'support@mavilinking.com',
    maxLoginAttempts: 5,
    sessionTimeoutMinutes: 120,
  });

  // Reset page & filters on tab change
  useEffect(() => {
    setPage(1);
    setSearch('');
    setFilterRole('');
    setFilterStatus('');
    setErrorMessage(null);
  }, [activeTab]);

  // Fetch Institutions dropdown helper
  const fetchInstitutionsDropdown = async () => {
    setLoadingInstitutions(true);
    setErrorInstitutions('');
    try {
      const res = await api.get('/super-admin/institutions');
      setInstitutions(res.data?.data?.institutions || []);
    } catch (err) {
      setErrorInstitutions('Unable to load registered colleges.');
    } finally {
      setLoadingInstitutions(false);
    }
  };

  // Main Data Loader for current active tab
  const loadTabData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      if (activeTab === 'overview') {
        const [statsRes, reqsRes, prnRes] = await Promise.all([
          api.get('/super-admin/stats').catch(() => null),
          api.get('/admin/role-requests?status=pending').catch(() => null),
          api.get('/admin/prn-verifications?status=pending').catch(() => null),
        ]);
        if (statsRes?.data?.data) setStats(statsRes.data.data);
        if (reqsRes?.data?.data) setRoleRequests(Array.isArray(reqsRes.data.data) ? reqsRes.data.data : []);
        if (prnRes?.data?.data) setPrnRequests(Array.isArray(prnRes.data.data) ? prnRes.data.data : []);
      } else if (activeTab === 'institutions') {
        const res = await api.get('/super-admin/institutions');
        const list = res.data?.data?.institutions || (Array.isArray(res.data?.data) ? res.data.data : []);
        setInstitutions(Array.isArray(list) ? list : []);
      } else if (activeTab === 'institution-admins') {
        const [adminsRes, instRes] = await Promise.all([
          api.get('/super-admin/admins'),
          api.get('/super-admin/institutions').catch(() => null),
        ]);
        const adminList = adminsRes.data?.data?.admins || (Array.isArray(adminsRes.data?.data) ? adminsRes.data.data : []);
        setAdmins(Array.isArray(adminList) ? adminList : []);
        if (instRes?.data?.data?.institutions && Array.isArray(instRes.data.data.institutions)) {
          setInstitutions(instRes.data.data.institutions);
        }
      } else if (activeTab === 'users') {
        const roleParam = filterRole ? `&role=${filterRole}` : '';
        const statusParam = filterStatus ? `&status=${filterStatus}` : '';
        const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
        const res = await api.get(`/admin/users?page=${page}&limit=25${roleParam}${statusParam}${searchParam}`);
        const userList = res.data?.data?.users || (Array.isArray(res.data?.data) ? res.data.data : []);
        setUsers(Array.isArray(userList) ? userList : []);
        setPagination(res.data?.data?.pagination || { page: 1, pages: 1, total: 0 });
      } else if (activeTab === 'verification') {
        const [roleRes, prnRes] = await Promise.all([
          api.get('/admin/role-requests?status=pending'),
          api.get('/admin/prn-verifications?status=pending'),
        ]);
        setRoleRequests(Array.isArray(roleRes.data?.data) ? roleRes.data.data : []);
        setPrnRequests(Array.isArray(prnRes.data?.data) ? prnRes.data.data : []);
      } else if (activeTab === 'licenses' || activeTab === 'billing') {
        const res = await api.get('/super-admin/billing/institutions').catch(() => api.get('/super-admin/licenses').catch(() => api.get('/super-admin/institutions')));
        const rawData = res?.data?.data;
        if (rawData?.institutions) {
          setLicenses(rawData.institutions);
          setSuperAdminBilling(rawData);
        } else {
          const licList = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.institutions) ? rawData.institutions : []);
          setLicenses(licList);
        }
      } else if (activeTab === 'analytics') {
        const [statsRes, analyticsRes] = await Promise.all([
          api.get('/super-admin/stats').catch(() => null),
          api.get('/super-admin/analytics').catch(() => null),
        ]);
        if (statsRes?.data?.data) setStats(statsRes.data.data);
        if (analyticsRes?.data?.data) setAnalytics(analyticsRes.data.data);
      } else if (activeTab === 'security' || activeTab === 'audit-logs') {
        const res = await api.get(`/super-admin/security-events?page=${page}&limit=50`);
        const eventList = res.data?.data?.events || (Array.isArray(res.data?.data) ? res.data.data : []);
        setSecurityEvents(Array.isArray(eventList) ? eventList : []);
        setPagination(res.data?.data?.pagination || { page: 1, pages: 1, total: 0 });
      } else if (activeTab === 'settings') {
        const res = await api.get('/super-admin/settings').catch(() => null);
        if (res?.data?.data) setSettingsForm((prev) => ({ ...prev, ...res.data.data }));
      }
    } catch (err) {
      console.error(`Error loading data for ${activeTab}:`, err);
      if (err.response?.status === 401) {
        setErrorMessage('Your Super Admin session has expired. Please log in again.');
      } else if (err.response?.status === 403) {
        setErrorMessage('Access denied. Super Admin authority required.');
      } else {
        setErrorMessage(err.response?.data?.message || 'Failed to communicate with Super Admin API.');
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, search, filterRole, filterStatus]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  // Action Handlers
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await api.post('/super-admin/admins', newAdmin);
      setShowCreateAdminModal(false);
      setNewAdmin({ name: '', email: '', password: '', role: 'admin', institutionId: '' });
      toast.success('Admin provisioned successfully. Invitation email dispatched.');
      loadTabData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to provision admin.'));
    }
  };

  const handleResendAdminInvite = async (adminId, adminEmail) => {
    try {
      const res = await api.post(`/super-admin/admins/${adminId}/resend-invite`);
      if (res.data?.emailSent || res.data?.data?.emailSent) {
        toast.success(`New 24-hour invitation email sent to ${adminEmail}`);
      } else {
        toast.warning(`Admin invitation updated, but email could not be sent to ${adminEmail}`);
      }
      loadTabData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to resend admin invitation.'));
    }
  };

  const handleRevokeAdmin = async (id) => {
    if (!window.confirm('Revoke administrative privileges for this user account?')) return;
    try {
      await api.delete(`/super-admin/admins/${id}`);
      loadTabData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to revoke admin.');
    }
  };

  const handleCreateInstitution = async (e) => {
    e.preventDefault();
    try {
      await api.post('/super-admin/institutions', newInst);
      setShowCreateInstModal(false);
      setNewInst({ name: '', code: '', domain: '', type: 'College', city: '', state: '' });
      loadTabData();
    } catch (err) {
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
      loadTabData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update account status.');
    }
  };

  const handleApproveRole = async (id) => {
    try {
      await api.post(`/admin/role-requests/${id}/approve`);
      loadTabData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve role request.');
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

  const handleRejectRequest = async (e) => {
    e.preventDefault();
    if (!rejectingUser) return;
    try {
      if (rejectingUser.prn || rejectingUser.maviId) {
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

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/super-admin/settings', settingsForm);
      alert('Platform settings updated successfully!');
      loadTabData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update platform settings.');
    }
  };

  return (
    <SuperAdminLayout activeTab={activeTab}>
      <div style={{ padding: '1rem', maxWidth: '1280px', margin: '0 auto', color: 'white' }}>
        {/* Top Governance Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.85rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
                <ShieldAlert style={{ color: '#ef4444' }} size={30} />
                Platform Super Admin Console
              </h1>
              <span className="badge badge-primary" style={{ background: '#ef4444', borderColor: '#ef4444', fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                Master Governance
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.85rem' }}>
              Global platform oversight, multi-tenant college governance, admin provisioning, and system security monitoring.
            </p>
          </div>

          <button onClick={loadTabData} className="btn btn-outline" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.85rem' }}>
            <RefreshCw size={14} /> Refresh Platform Data
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
            <div className="animate-pulse" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)', margin: '0 auto 1rem' }} />
            <p style={{ fontFamily: 'Outfit, sans-serif' }}>Loading {activeTab.replace('-', ' ')} data...</p>
          </div>
        ) : (
          <>
            {/* ─── 1. PLATFORM OVERVIEW VIEW ────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="animate-fade-in">
                {stats && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                      { label: 'Total Users', value: stats.totalUsers || 0, color: 'var(--accent-purple)', icon: <Users size={20} /> },
                      { label: 'Institutions', value: stats.totalInstitutions || 0, color: 'var(--accent-cyan)', icon: <Building size={20} /> },
                      { label: 'Administrators', value: stats.totalAdmins || 0, color: '#ec4899', icon: <Shield size={20} /> },
                      { label: 'Students', value: stats.students || 0, color: 'var(--accent-emerald)', icon: <GraduationCap size={20} /> },
                      { label: 'Pending Verifications', value: stats.pendingVerifications || 0, color: 'var(--accent-amber)', icon: <CheckCircle size={20} /> },
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

                {/* Quick Action Navigation Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                  {[
                    { title: 'Institutions Registry', desc: 'Provision and manage multi-tenant colleges, universities, and domains.', path: '/super-admin/institutions', icon: <Building size={24} />, color: 'var(--accent-cyan)' },
                    { title: 'Admin Provisioning', desc: 'Invite or manage Super Admins and Institution Administrators.', path: '/super-admin/institution-admins', icon: <UserPlus size={24} />, color: '#ef4444' },
                    { title: 'Global User Directory', desc: 'Search, filter, suspend, or moderate platform-wide accounts.', path: '/super-admin/users', icon: <Users size={24} />, color: 'var(--accent-purple)' },
                    { title: 'Verification Oversight', desc: `${roleRequests.length + prnRequests.length} pending identity requests requiring governance review.`, path: '/super-admin/verification', icon: <ShieldCheck size={24} />, color: 'var(--accent-amber)' },
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

            {/* ─── 2. INSTITUTIONS VIEW ────────────────────────────────────────── */}
            {activeTab === 'institutions' && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3>Registered Institutions & Colleges ({Array.isArray(institutions) ? institutions.length : 0})</h3>
                  <button onClick={() => setShowCreateInstModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <Plus size={16} /> Provision Institution
                  </button>
                </div>

                <div className="glass-card-static" style={{ overflowX: 'auto' }}>
                  {!Array.isArray(institutions) || institutions.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Building size={36} style={{ marginBottom: '0.5rem' }} />
                      <p>No institutions registered yet.</p>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '1rem' }}>College / University</th>
                          <th style={{ padding: '1rem' }}>Tenant ID / Code</th>
                          <th style={{ padding: '1rem' }}>Domain & Location</th>
                          <th style={{ padding: '1rem' }}>Admins Assigned</th>
                          <th style={{ padding: '1rem' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Array.isArray(institutions) ? institutions : []).map((inst) => (
                          <tr key={inst._id} style={{ borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle' }}>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ fontWeight: '600' }}>{inst.name}</div>
                              <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>{inst.type || 'College'}</span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{inst.tenantId || '—'}</div>
                              <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{inst.code || '—'}</div>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              <div>{inst.domain || inst.officialDomain || 'No Domain'}</div>
                              <div>{[inst.city, inst.state].filter(Boolean).join(', ') || 'India'}</div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              {Array.isArray(inst.admins) && inst.admins.length > 0 ? (
                                inst.admins.map((adm) => (
                                  <div key={adm._id} style={{ fontSize: '0.75rem', fontWeight: '600' }}>
                                    {adm.name} ({adm.email})
                                  </div>
                                ))
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>None Assigned</span>
                              )}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                                {inst.status || 'Active'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ─── 3. INSTITUTION ADMINS VIEW ──────────────────────────────────── */}
            {activeTab === 'institution-admins' && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3>Administrator Roster & Privileges ({admins.length})</h3>
                  <button onClick={() => { fetchInstitutionsDropdown(); setShowCreateAdminModal(true); }} className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <UserPlus size={16} /> Provision / Invite Admin
                  </button>
                </div>

                <div className="glass-card-static" style={{ overflowX: 'auto' }}>
                  {admins.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Shield size={36} style={{ marginBottom: '0.5rem' }} />
                      <p>No administrative accounts found.</p>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '1rem' }}>Administrator</th>
                          <th style={{ padding: '1rem' }}>Admin ID</th>
                          <th style={{ padding: '1rem' }}>Role Level</th>
                          <th style={{ padding: '1rem' }}>Assigned Institution</th>
                          <th style={{ padding: '1rem' }}>Status</th>
                          <th style={{ padding: '1rem' }}>Invitation</th>
                          <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {admins.map((adm) => {
                          const isInvited = adm.accountStatus === 'INVITED' || adm.status === 'invited';
                          const status = adm.accountStatus || (adm.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE');

                          return (
                            <tr key={adm._id} style={{ borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle' }}>
                              <td style={{ padding: '1rem' }}>
                                <div style={{ fontWeight: '600' }}>{adm.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{adm.email}</div>
                              </td>
                              <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                                {adm.adminId || adm.adminLoginId || '—'}
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <span className="badge badge-primary" style={{ textTransform: 'uppercase', fontSize: '0.7rem', background: adm.role === 'super_admin' ? '#ef4444' : undefined }}>
                                  {adm.role}
                                </span>
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {adm.institutionId?.name || 'Platform Wide (Global)'}
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <span
                                  className={`badge ${
                                    status === 'ACTIVE'
                                      ? 'badge-success'
                                      : status === 'INVITED'
                                      ? 'badge-warning'
                                      : status === 'SUSPENDED'
                                      ? 'badge-danger'
                                      : 'badge-secondary'
                                  }`}
                                  style={{ fontSize: '0.7rem' }}
                                >
                                  {status}
                                </span>
                              </td>
                              <td style={{ padding: '1rem' }}>
                                {isInvited ? (
                                  <span style={{ color: 'var(--accent-amber)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Clock size={13} /> Email Sent
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--accent-emerald)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <CheckCircle size={13} /> Activated
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '1rem' }}>
                                {adm._id !== currentUser._id && (
                                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    <button
                                      onClick={() => handleResendAdminInvite(adm._id, adm.email)}
                                      className="btn btn-outline"
                                      title="Resend 24-Hour Invitation / Setup Email"
                                      style={{ borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)', padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                    >
                                      Resend Invite
                                    </button>
                                    <button onClick={() => handleRevokeAdmin(adm._id)} className="btn btn-outline" style={{ borderColor: '#f59e0b', color: '#f59e0b', padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
                                      Revoke Privileges
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedAdminForLifecycle(adm);
                                        setAdminLifecycleModalType('permanent_delete');
                                      }}
                                      className="btn btn-outline"
                                      style={{ borderColor: '#ef4444', color: '#ef4444', padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                    >
                                      Delete Permanently
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ─── 4. GLOBAL USERS VIEW ───────────────────────────────────────── */}
            {activeTab === 'users' && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search by name, email, PRN, or MAVI ID..."
                      className="input-field"
                      style={{ marginBottom: 0, paddingLeft: '2.5rem' }}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                  <select className="input-field" style={{ width: '180px', marginBottom: 0 }} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                    <option value="">All Roles</option>
                    <option value="user">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="department_admin">Dept Admin</option>
                    <option value="institution_admin">Inst Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  <select className="input-field" style={{ width: '180px', marginBottom: 0 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="DEACTIVATED">Deactivated</option>
                    <option value="PENDING_VERIFICATION">Pending Verification</option>
                  </select>
                </div>

                <UserLifecycleTable
                  users={users}
                  institutions={institutions}
                  onRefresh={loadTabData}
                  loading={loading}
                  currentUserRole="super_admin"
                />

                {pagination.pages > 1 && (
                  <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Page {pagination.page} of {pagination.pages} ({pagination.total} records)</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Prev</button>
                      <button disabled={page >= pagination.pages} onClick={() => setPage(page + 1)} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Next</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── 5. VERIFICATION OVERSIGHT VIEW ──────────────────────────────── */}
            {activeTab === 'verification' && (
              <div className="animate-fade-in" style={{ display: 'grid', gap: '2rem' }}>
                <div className="glass-card-static" style={{ padding: '1.5rem' }}>
                  <h3 style={{ marginBottom: '1rem', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={20} /> Pending Role Escalation Requests ({roleRequests.length})
                  </h3>
                  {roleRequests.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No pending role requests.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.75rem' }}>Applicant</th>
                          <th style={{ padding: '0.75rem' }}>Requested Role</th>
                          <th style={{ padding: '0.75rem' }}>Institution</th>
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
                            <td style={{ padding: '0.75rem', fontSize: '0.8rem' }}>{req.institutionId?.name || 'Global Scope'}</td>
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
                    <Shield size={20} /> Pending PRN Identity Verifications ({prnRequests.length})
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

            {/* ─── 6. LICENSES & INSTITUTION SUBSCRIPTION OVERSIGHT ──────────── */}
            {(activeTab === 'licenses' || activeTab === 'billing') && (
              <div className="animate-fade-in">
                <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    Multi-College Institution SaaS Subscriptions & Plan Matrix
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Catalog pricing managed exclusively by Platform Owner
                  </span>
                </div>

                <div className="glass-card-static" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '1rem' }}>Institution</th>
                        <th style={{ padding: '1rem' }}>Tenant ID</th>
                        <th style={{ padding: '1rem' }}>Plan Tier & Version</th>
                        <th style={{ padding: '1rem' }}>Price Snapshot</th>
                        <th style={{ padding: '1rem' }}>Payment Status</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>Assign Catalog Plan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Array.isArray(licenses) ? licenses : []).map((lic) => (
                        <tr key={lic._id || lic.institutionId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: '600' }}>{lic.name || lic.institutionName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lic.code || 'INST'}</div>
                          </td>
                          <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{lic.tenantId || 'INST-SCOPED'}</td>
                          <td style={{ padding: '1rem' }}>
                            <span className="badge badge-primary">{lic.plan || 'ENTERPRISE'}</span>
                            <span className="badge badge-secondary" style={{ marginLeft: '0.4rem', fontSize: '0.7rem' }}>v{lic.planVersion || 1}</span>
                          </td>
                          <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--accent-emerald)' }}>
                            ₹{(lic.priceSnapshot?.amount || (lic.plan === 'BASIC' ? 49999 : lic.plan === 'PRO' ? 149999 : 299999)).toLocaleString()}/yr
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span className="badge badge-success" style={{ background: lic.paymentStatus === 'FAILED' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: lic.paymentStatus === 'FAILED' ? '#ef4444' : '#10b981' }}>
                              {lic.paymentStatus || lic.subscriptionStatus || 'SUCCESS'}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <select
                              value={lic.plan || 'PRO'}
                              onChange={(e) => handleAssignPlan(lic._id || lic.institutionId, e.target.value)}
                              disabled={assigningPlan}
                              className="input-field"
                              style={{ width: 'auto', display: 'inline-block', padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                            >
                              <option value="BASIC">Assign BASIC (v1)</option>
                              <option value="PRO">Assign PRO (v1)</option>
                              <option value="ENTERPRISE">Assign ENTERPRISE (v1)</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                      {(!Array.isArray(licenses) || licenses.length === 0) && (
                        <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No license records found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── 7. PLATFORM ANALYTICS VIEW ─────────────────────────────────── */}
            {activeTab === 'analytics' && (
              <div className="animate-fade-in glass-card-static" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={22} style={{ color: '#ef4444' }} /> Global Platform Growth & Analytics
                </h3>
                {stats && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--accent-purple)' }}>{stats.totalUsers || 0}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Registered Users</div>
                    </div>
                    <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>{stats.totalInstitutions || 0}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Onboarded Colleges</div>
                    </div>
                    <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--accent-emerald)' }}>88%</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Average Platform Readiness</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── 8. SECURITY CENTER VIEW ────────────────────────────────────── */}
            {activeTab === 'security' && (
              <div className="animate-fade-in glass-card-static" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldAlert size={22} /> Platform Security Center
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
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', display: 'block', fontFamily: 'monospace' }}>{evt.userId?.maviId || ''}</span>
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

            {/* ─── 9. AUDIT LOGS VIEW ─────────────────────────────────────────── */}
            {activeTab === 'audit-logs' && (
              <div className="animate-fade-in glass-card-static" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={22} style={{ color: 'var(--accent-purple)' }} /> Immutable System Audit Trails
                </h3>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 3fr 1fr', padding: '0.75rem 1rem', fontWeight: 'bold', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                    <div>Timestamp</div>
                    <div>Actor / MAVI ID</div>
                    <div>Action & Details</div>
                    <div>IP Address</div>
                  </div>
                  {securityEvents.map((log) => (
                    <div key={log._id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 3fr 1fr', padding: '0.75rem 1rem', fontSize: '0.8rem', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}>
                      <div style={{ color: 'var(--text-secondary)' }}>{new Date(log.createdAt).toLocaleString()}</div>
                      <div>
                        <span style={{ fontWeight: '600' }}>{log.userId?.name || 'System'}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>{log.userId?.email || ''}</span>
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

            {/* ─── 10. PLATFORM SETTINGS VIEW ─────────────────────────────────── */}
            {activeTab === 'settings' && (
              <div className="animate-fade-in glass-card-static" style={{ padding: '2rem', maxWidth: '680px' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sliders size={22} style={{ color: '#ef4444' }} /> Global Governance Settings
                </h3>
                <form onSubmit={handleSaveSettings} style={{ display: 'grid', gap: '1.25rem' }}>
                  <div className="input-group">
                    <label className="input-label">Platform Name</label>
                    <input type="text" className="input-field" value={settingsForm.platformName} onChange={(e) => setSettingsForm({ ...settingsForm, platformName: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Support Email Address</label>
                    <input type="email" className="input-field" value={settingsForm.supportEmail} onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                      <label className="input-label">Max Login Attempts</label>
                      <input type="number" className="input-field" value={settingsForm.maxLoginAttempts} onChange={(e) => setSettingsForm({ ...settingsForm, maxLoginAttempts: parseInt(e.target.value) })} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Session Timeout (Mins)</label>
                      <input type="number" className="input-field" value={settingsForm.sessionTimeoutMinutes} onChange={(e) => setSettingsForm({ ...settingsForm, sessionTimeoutMinutes: parseInt(e.target.value) })} />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ justifySelf: 'start', padding: '0.6rem 1.5rem', background: '#ef4444', borderColor: '#ef4444' }}>
                    Save Governance Configuration
                  </button>
                </form>
              </div>
            )}

            {/* ─── 11. SUPER ADMIN PROFILE VIEW ──────────────────────────────── */}
            {activeTab === 'profile' && (
              <>
                <div className="animate-fade-in glass-card-static" style={{ padding: '2rem', maxWidth: '640px' }}>
                  <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={22} style={{ color: '#ef4444' }} /> Super Administrator Credentials
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
                      <span style={{ color: 'var(--text-secondary)' }}>Super Admin ID:</span>
                      <span style={{ fontFamily: 'monospace', color: '#ef4444', fontWeight: 'bold' }}>{currentUser?.adminId || currentUser?.maviId || 'MAVI-SA-MASTER'}</span>
                    </div>
                    <div style={{ display: 'flex', justify: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>MAVI Identity ID:</span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--accent-emerald)' }}>{currentUser?.maviId}</span>
                    </div>
                    <div style={{ display: 'flex', justify: 'space-between', padding: '0.75rem 0' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Governance Authority:</span>
                      <span style={{ textTransform: 'capitalize', fontWeight: 'bold', color: '#ef4444' }}>Global Super Admin</span>
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
                  <label className="input-label">Initial Password (If creating directly)</label>
                  <PasswordInput
                    className="input-field"
                    placeholder="••••••••"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    autoComplete="new-password"
                  />
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <label className="input-label" style={{ margin: 0 }}>Target Institution *</label>
                      <button type="button" onClick={fetchInstitutionsDropdown} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>Refresh Colleges</button>
                    </div>
                    <select className="input-field" value={newAdmin.institutionId} onChange={(e) => setNewAdmin({ ...newAdmin, institutionId: e.target.value })} required>
                      <option value="">Select College / Institution...</option>
                      {institutions.map((inst) => (
                        <option key={inst._id} value={inst._id}>{inst.name} ({inst.tenantId || inst.code})</option>
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

        {/* ─── MODAL: Reject Request ──────────────────────────────────────── */}
        {rejectingUser && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <form onSubmit={handleRejectRequest} className="glass-card-static" style={{ width: '450px', padding: '2rem' }}>
              <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>Reject Verification: {rejectingUser.name}</h3>
              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Reason for Rejection</label>
                <textarea className="input-field" rows={3} placeholder="Provide feedback explaining why verification was rejected..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setRejectingUser(null)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }}>Reject</button>
              </div>
            </form>
          </div>
        )}
        {/* Admin Lifecycle Modal */}
        {adminLifecycleModalType && selectedAdminForLifecycle && (
          <UserLifecycleModal
            modalType={adminLifecycleModalType}
            user={selectedAdminForLifecycle}
            onClose={() => {
              setSelectedAdminForLifecycle(null);
              setAdminLifecycleModalType(null);
            }}
            onSubmit={handleAdminLifecycleSubmit}
            loading={adminActionLoading}
            institutions={institutions}
          />
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
