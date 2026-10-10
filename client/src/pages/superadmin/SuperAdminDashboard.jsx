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
  Clock,
} from 'lucide-react';
import SuperAdminLayout from '../../layouts/SuperAdminLayout';
import api from '../../api/axios';
import VoluntaryChangePasswordForm from '../../components/VoluntaryChangePasswordForm';
import PasswordInput from '../../components/ui/PasswordInput';
import UserLifecycleTable from '../../components/admin/UserLifecycleTable';
import UserLifecycleModal from '../../components/admin/UserLifecycleModal';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';

const SuperAdminDashboard = ({ activeTab: propActiveTab }) => {
  const { user: currentUser } = useContext(AuthContext);
  const toast = useToast();
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
    platformName: 'EduTalentX',
    requireEmailVerification: true,
    allowPublicRegistrations: true,
    defaultUserPlan: 'FREE',
    supportEmail: 'support@edutalentx.com',
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
      if (rejectingUser.prn || rejectingUser.etxId) {
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
      <div style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto', color: '#111111' }}>
        {/* Top Governance Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0, color: '#111111' }}>
                <ShieldAlert style={{ color: '#2563EB' }} size={28} />
                Platform Super Admin Console
              </h1>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE' }}>
                Master Governance
              </span>
            </div>
            <p style={{ color: '#4B5563', marginTop: '0.35rem', fontSize: '0.875rem' }}>
              Global platform oversight, multi-tenant college governance, admin provisioning, and system security monitoring.
            </p>
          </div>

          <button onClick={loadTabData} className="btn btn-outline" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.875rem', background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }}>
            <RefreshCw size={14} /> Refresh Platform Data
          </button>
        </header>

        {/* Global Error Banner */}
        {errorMessage && (
          <div style={{ padding: '0.875rem 1rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={18} style={{ color: '#DC2626' }} />
            <div style={{ flex: 1, fontSize: '0.875rem', color: '#991B1B' }}>{errorMessage}</div>
            <button onClick={loadTabData} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: '#DC2626', color: '#DC2626', background: '#FFFFFF' }}>
              Retry
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#6B7280' }}>
            <div className="animate-spin" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#2563EB', margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '0.875rem', color: '#4B5563' }}>Loading {activeTab.replace('-', ' ')} data...</p>
          </div>
        ) : (
          <>
            {/* ─── 1. PLATFORM OVERVIEW VIEW ────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div>
                {stats && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                      { label: 'Total Users', value: stats.totalUsers || 0, icon: <Users size={18} /> },
                      { label: 'Institutions', value: stats.totalInstitutions || 0, icon: <Building size={18} /> },
                      { label: 'Administrators', value: stats.totalAdmins || 0, icon: <Shield size={18} /> },
                      { label: 'Students', value: stats.students || 0, icon: <GraduationCap size={18} /> },
                      { label: 'Pending Verifications', value: stats.pendingVerifications || 0, icon: <CheckCircle size={18} /> },
                      { label: 'Suspended Accounts', value: stats.suspended || 0, icon: <UserX size={18} /> },
                    ].map((item) => (
                      <div key={item.label} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.625rem', borderRadius: '6px', background: '#F8F9FA', color: '#4B5563', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {item.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500, marginBottom: '0.2rem' }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: '1.625rem', fontWeight: 700, color: '#111111' }}>{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Action Navigation Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  {[
                    { title: 'Institutions Registry', desc: 'Provision and manage multi-tenant colleges, universities, and domains.', path: '/super-admin/institutions', icon: <Building size={20} /> },
                    { title: 'Admin Provisioning', desc: 'Invite or manage Super Admins and Institution Administrators.', path: '/super-admin/institution-admins', icon: <UserPlus size={20} /> },
                    { title: 'Global User Directory', desc: 'Search, filter, suspend, or moderate platform-wide accounts.', path: '/super-admin/users', icon: <Users size={20} /> },
                    { title: 'Verification Oversight', desc: `${roleRequests.length + prnRequests.length} pending identity requests requiring governance review.`, path: '/super-admin/verification', icon: <ShieldCheck size={20} /> },
                  ].map((card) => (
                    <div
                      key={card.title}
                      onClick={() => navigate(card.path)}
                      style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem', cursor: 'pointer', transition: 'border-color 0.15s ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#93C5FD'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ color: '#2563EB', display: 'flex', alignItems: 'center' }}>{card.icon}</div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#111111' }}>{card.title}</h3>
                      </div>
                      <p style={{ color: '#4B5563', fontSize: '0.85rem', margin: 0, lineHeight: 1.45 }}>{card.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── 2. INSTITUTIONS VIEW ────────────────────────────────────────── */}
            {activeTab === 'institutions' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, color: '#111111' }}>
                    Registered Institutions & Colleges ({Array.isArray(institutions) ? institutions.length : 0})
                  </h3>
                  <button onClick={() => setShowCreateInstModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
                    <Plus size={16} /> Provision Institution
                  </button>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', overflowX: 'auto' }}>
                  {!Array.isArray(institutions) || institutions.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
                      <Building size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                      <p style={{ margin: 0, fontSize: '0.875rem' }}>No institutions registered yet.</p>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontSize: '0.8125rem' }}>
                          <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>College / University</th>
                          <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Tenant ID / Code</th>
                          <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Domain & Location</th>
                          <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Admins Assigned</th>
                          <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Array.isArray(institutions) ? institutions : []).map((inst) => (
                          <tr key={inst._id} style={{ borderBottom: '1px solid #E5E7EB', verticalAlign: 'middle', color: '#111111' }}>
                            <td style={{ padding: '0.875rem 1rem' }}>
                              <div style={{ fontWeight: 600, color: '#111111' }}>{inst.name}</div>
                              <span style={{ display: 'inline-block', marginTop: '0.2rem', padding: '0.15rem 0.45rem', fontSize: '0.7rem', fontWeight: 500, borderRadius: '4px', background: '#F3F4F6', color: '#4B5563', border: '1px solid #E5E7EB' }}>
                                {inst.type || 'College'}
                              </span>
                            </td>
                            <td style={{ padding: '0.875rem 1rem' }}>
                              <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#111111' }}>{inst.tenantId || '—'}</div>
                              <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6B7280' }}>{inst.code || '—'}</div>
                            </td>
                            <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: '#4B5563' }}>
                              <div>{inst.domain || inst.officialDomain || 'No Domain'}</div>
                              <div style={{ color: '#6B7280' }}>{[inst.city, inst.state].filter(Boolean).join(', ') || 'India'}</div>
                            </td>
                            <td style={{ padding: '0.875rem 1rem' }}>
                              {Array.isArray(inst.admins) && inst.admins.length > 0 ? (
                                inst.admins.map((adm) => (
                                  <div key={adm._id} style={{ fontSize: '0.75rem', fontWeight: 500, color: '#111111' }}>
                                    {adm.name} <span style={{ color: '#6B7280' }}>({adm.email})</span>
                                  </div>
                                ))
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>None Assigned</span>
                              )}
                            </td>
                            <td style={{ padding: '0.875rem 1rem' }}>
                              <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: 500, borderRadius: '4px', background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', textTransform: 'capitalize' }}>
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
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, color: '#111111' }}>
                    Administrator Roster & Privileges ({admins.length})
                  </h3>
                  <button onClick={() => { fetchInstitutionsDropdown(); setShowCreateAdminModal(true); }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
                    <UserPlus size={16} /> Provision / Invite Admin
                  </button>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', overflowX: 'auto' }}>
                  {admins.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
                      <Shield size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                      <p style={{ margin: 0, fontSize: '0.875rem' }}>No administrative accounts found.</p>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontSize: '0.8125rem' }}>
                          <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Administrator</th>
                          <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Admin ID</th>
                          <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Role Level</th>
                          <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Assigned Institution</th>
                          <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Status</th>
                          <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Invitation</th>
                          <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {admins.map((adm) => {
                          const isInvited = adm.accountStatus === 'INVITED' || adm.status === 'invited';
                          const status = adm.accountStatus || (adm.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE');

                          return (
                            <tr key={adm._id} style={{ borderBottom: '1px solid #E5E7EB', verticalAlign: 'middle', color: '#111111' }}>
                              <td style={{ padding: '0.875rem 1rem' }}>
                                <div style={{ fontWeight: 600, color: '#111111' }}>{adm.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{adm.email}</div>
                              </td>
                              <td style={{ padding: '0.875rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#111111', fontWeight: 600 }}>
                                {adm.adminId || adm.adminLoginId || '—'}
                              </td>
                              <td style={{ padding: '0.875rem 1rem' }}>
                                <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', fontSize: '0.7rem', fontWeight: 600, borderRadius: '4px', background: adm.role === 'super_admin' ? '#FEF2F2' : '#EFF6FF', color: adm.role === 'super_admin' ? '#B91C1C' : '#1D4ED8', border: `1px solid ${adm.role === 'super_admin' ? '#FCA5A5' : '#BFDBFE'}`, textTransform: 'uppercase' }}>
                                  {adm.role}
                                </span>
                              </td>
                              <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: '#4B5563' }}>
                                {adm.institutionId?.name || 'Platform Wide (Global)'}
                              </td>
                              <td style={{ padding: '0.875rem 1rem' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '0.2rem 0.5rem',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    borderRadius: '4px',
                                    background: status === 'ACTIVE' ? '#ECFDF5' : status === 'INVITED' ? '#FFFBEB' : status === 'SUSPENDED' ? '#FEF2F2' : '#F3F4F6',
                                    color: status === 'ACTIVE' ? '#065F46' : status === 'INVITED' ? '#92400E' : status === 'SUSPENDED' ? '#991B1B' : '#4B5563',
                                    border: `1px solid ${status === 'ACTIVE' ? '#A7F3D0' : status === 'INVITED' ? '#FDE68A' : status === 'SUSPENDED' ? '#FCA5A5' : '#E5E7EB'}`,
                                  }}
                                >
                                  {status}
                                </span>
                              </td>
                              <td style={{ padding: '0.875rem 1rem' }}>
                                {isInvited ? (
                                  <span style={{ color: '#D97706', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 500 }}>
                                    <Clock size={13} /> Email Sent
                                  </span>
                                ) : (
                                  <span style={{ color: '#059669', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 500 }}>
                                    <CheckCircle size={13} /> Activated
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '0.875rem 1rem' }}>
                                {adm._id !== currentUser._id && (
                                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    <button
                                      onClick={() => handleResendAdminInvite(adm._id, adm.email)}
                                      className="btn btn-outline"
                                      title="Resend 24-Hour Invitation / Setup Email"
                                      style={{ borderColor: '#E5E7EB', color: '#2563EB', background: '#FFFFFF', padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                    >
                                      Resend Invite
                                    </button>
                                    <button onClick={() => handleRevokeAdmin(adm._id)} className="btn btn-outline" style={{ borderColor: '#E5E7EB', color: '#D97706', background: '#FFFFFF', padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
                                      Revoke Privileges
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedAdminForLifecycle(adm);
                                        setAdminLifecycleModalType('permanent_delete');
                                      }}
                                      className="btn btn-outline"
                                      style={{ borderColor: '#E5E7EB', color: '#DC2626', background: '#FFFFFF', padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
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
              <div>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search by name, email, PRN, or ETX ID..."
                      className="input-field"
                      style={{ marginBottom: 0, paddingLeft: '2.5rem', background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                  </div>
                  <select className="input-field" style={{ width: '180px', marginBottom: 0, background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                    <option value="">All Roles</option>
                    <option value="user">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="department_admin">Dept Admin</option>
                    <option value="institution_admin">Inst Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  <select className="input-field" style={{ width: '180px', marginBottom: 0, background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
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
                  <div style={{ padding: '0.875rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', background: '#FFFFFF', borderRadius: '0 0 8px 8px' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>Page {pagination.page} of {pagination.pages} ({pagination.total} records)</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: '#FFFFFF', borderColor: '#E5E7EB' }}>Prev</button>
                      <button disabled={page >= pagination.pages} onClick={() => setPage(page + 1)} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: '#FFFFFF', borderColor: '#E5E7EB' }}>Next</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── 5. VERIFICATION OVERSIGHT VIEW ──────────────────────────────── */}
            {activeTab === 'verification' && (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem' }}>
                  <h3 style={{ marginBottom: '1rem', color: '#111111', fontSize: '1.0625rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} style={{ color: '#2563EB' }} /> Pending Role Escalation Requests ({roleRequests.length})
                  </h3>
                  {roleRequests.length === 0 ? (
                    <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0 }}>No pending role requests.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontSize: '0.8125rem' }}>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Applicant</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Requested Role</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Institution</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roleRequests.map((req) => (
                            <tr key={req._id} style={{ borderBottom: '1px solid #E5E7EB', verticalAlign: 'middle', color: '#111111' }}>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div style={{ fontWeight: 600, color: '#111111' }}>{req.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{req.email}</div>
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: 500, borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE' }}>
                                  {req.requestedRole}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: '#4B5563' }}>{req.institutionId?.name || 'Global Scope'}</td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button onClick={() => handleApproveRole(req._id)} className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>Approve</button>
                                  <button onClick={() => setRejectingUser(req)} className="btn btn-outline" style={{ borderColor: '#E5E7EB', color: '#DC2626', background: '#FFFFFF', padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>Reject</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem' }}>
                  <h3 style={{ marginBottom: '1rem', color: '#111111', fontSize: '1.0625rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={18} style={{ color: '#2563EB' }} /> Pending PRN Identity Verifications ({prnRequests.length})
                  </h3>
                  {prnRequests.length === 0 ? (
                    <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0 }}>No pending PRN identity verifications.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontSize: '0.8125rem' }}>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Student / ETX ID</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>PRN / Faculty ID</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prnRequests.map((req) => (
                            <tr key={req._id} style={{ borderBottom: '1px solid #E5E7EB', verticalAlign: 'middle', color: '#111111' }}>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div style={{ fontWeight: 600, color: '#111111' }}>{req.name}</div>
                                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#4B5563' }}>{req.etxId}</div>
                              </td>
                              <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 600, color: '#111111' }}>{req.prn || req.facultyId || 'Not Provided'}</td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button onClick={() => handleApprovePrn(req._id)} className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>Verify PRN</button>
                                  <button onClick={() => setRejectingUser(req)} className="btn btn-outline" style={{ borderColor: '#E5E7EB', color: '#DC2626', background: '#FFFFFF', padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>Reject</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── 6. LICENSES & INSTITUTION SUBSCRIPTION OVERSIGHT ──────────── */}
            {(activeTab === 'licenses' || activeTab === 'billing') && (
              <div>
                <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#111111' }}>
                    Multi-College Institution SaaS Subscriptions & Plan Matrix
                  </h3>
                  <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>
                    Catalog pricing managed exclusively by Platform Owner
                  </span>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontSize: '0.8125rem' }}>
                        <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Institution</th>
                        <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Tenant ID</th>
                        <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Plan Tier & Version</th>
                        <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Price Snapshot</th>
                        <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Payment Status</th>
                        <th style={{ padding: '0.875rem 1rem', fontWeight: 600, textAlign: 'right' }}>Assign Catalog Plan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Array.isArray(licenses) ? licenses : []).map((lic) => (
                        <tr key={lic._id || lic.institutionId} style={{ borderBottom: '1px solid #E5E7EB', verticalAlign: 'middle', color: '#111111' }}>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <div style={{ fontWeight: 600, color: '#111111' }}>{lic.name || lic.institutionName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{lic.code || 'INST'}</div>
                          </td>
                          <td style={{ padding: '0.875rem 1rem', fontFamily: 'monospace', fontWeight: 600, color: '#111111' }}>{lic.tenantId || 'INST-SCOPED'}</td>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE' }}>
                              {lic.plan || 'ENTERPRISE'}
                            </span>
                            <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', color: '#6B7280' }}>v{lic.planVersion || 1}</span>
                          </td>
                          <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#111111' }}>
                            ₹{(lic.priceSnapshot?.amount || (lic.plan === 'BASIC' ? 49999 : lic.plan === 'PRO' ? 149999 : 299999)).toLocaleString()}/yr
                          </td>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '4px', background: lic.paymentStatus === 'FAILED' ? '#FEF2F2' : '#ECFDF5', color: lic.paymentStatus === 'FAILED' ? '#991B1B' : '#065F46', border: `1px solid ${lic.paymentStatus === 'FAILED' ? '#FCA5A5' : '#A7F3D0'}` }}>
                              {lic.paymentStatus || lic.subscriptionStatus || 'SUCCESS'}
                            </span>
                          </td>
                          <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                            <select
                              value={lic.plan || 'PRO'}
                              onChange={(e) => handleAssignPlan(lic._id || lic.institutionId, e.target.value)}
                              disabled={assigningPlan}
                              className="input-field"
                              style={{ width: 'auto', display: 'inline-block', padding: '0.35rem 0.6rem', fontSize: '0.8rem', background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }}
                            >
                              <option value="BASIC">Assign BASIC (v1)</option>
                              <option value="PRO">Assign PRO (v1)</option>
                              <option value="ENTERPRISE">Assign ENTERPRISE (v1)</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                      {(!Array.isArray(licenses) || licenses.length === 0) && (
                        <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>No license records found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── 7. PLATFORM ANALYTICS VIEW ─────────────────────────────────── */}
            {activeTab === 'analytics' && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: 600, color: '#111111' }}>
                  <BarChart3 size={20} style={{ color: '#2563EB' }} /> Global Platform Growth & Analytics
                </h3>
                {stats && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                    <div style={{ background: '#F8F9FA', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111111', marginBottom: '0.25rem' }}>{stats.totalUsers || 0}</div>
                      <div style={{ color: '#4B5563', fontSize: '0.875rem' }}>Total Registered Users</div>
                    </div>
                    <div style={{ background: '#F8F9FA', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111111', marginBottom: '0.25rem' }}>{stats.totalInstitutions || 0}</div>
                      <div style={{ color: '#4B5563', fontSize: '0.875rem' }}>Onboarded Colleges</div>
                    </div>
                    <div style={{ background: '#F8F9FA', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111111', marginBottom: '0.25rem' }}>88%</div>
                      <div style={{ color: '#4B5563', fontSize: '0.875rem' }}>Average Platform Readiness</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── 8. SECURITY CENTER VIEW ────────────────────────────────────── */}
            {activeTab === 'security' && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem' }}>
                <h3 style={{ marginBottom: '1.25rem', color: '#111111', fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldAlert size={20} style={{ color: '#2563EB' }} /> Platform Security Center
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontSize: '0.8125rem' }}>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Timestamp</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Actor / ETX ID</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Event Details</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {securityEvents.map((evt) => (
                        <tr key={evt._id} style={{ borderBottom: '1px solid #E5E7EB', verticalAlign: 'middle', color: '#111111' }}>
                          <td style={{ padding: '0.75rem 1rem', color: '#4B5563', fontSize: '0.8125rem' }}>{new Date(evt.createdAt).toLocaleString()}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ fontWeight: 600, color: '#111111' }}>{evt.userId?.name || 'System'}</div>
                            <span style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block', fontFamily: 'monospace' }}>{evt.userId?.etxId || ''}</span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ color: '#DC2626', fontWeight: 600, marginRight: '0.5rem' }}>{evt.action}</span>
                            <span style={{ color: '#4B5563' }}>{evt.details}</span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#6B7280', fontSize: '0.8125rem' }}>{evt.ipAddress || '127.0.0.1'}</td>
                        </tr>
                      ))}
                      {securityEvents.length === 0 && (
                        <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>No security events logged.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── 9. AUDIT LOGS VIEW ─────────────────────────────────────────── */}
            {activeTab === 'audit-logs' && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem' }}>
                <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: 600, color: '#111111' }}>
                  <FileText size={20} style={{ color: '#2563EB' }} /> Immutable System Audit Trails
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontSize: '0.8125rem' }}>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Timestamp</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Actor / ETX ID</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Action & Details</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {securityEvents.map((log) => (
                        <tr key={log._id} style={{ borderBottom: '1px solid #E5E7EB', verticalAlign: 'middle', color: '#111111' }}>
                          <td style={{ padding: '0.75rem 1rem', color: '#4B5563', fontSize: '0.8125rem' }}>{new Date(log.createdAt).toLocaleString()}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ fontWeight: 600, color: '#111111' }}>{log.userId?.name || 'System'}</div>
                            <span style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block' }}>{log.userId?.email || ''}</span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ color: '#111111', fontWeight: 600, marginRight: '0.5rem' }}>{log.action}</span>
                            <span style={{ color: '#4B5563' }}>{log.details}</span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#6B7280', fontSize: '0.8125rem' }}>{log.ipAddress || '127.0.0.1'}</td>
                        </tr>
                      ))}
                      {securityEvents.length === 0 && (
                        <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>No audit trails recorded.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── 10. PLATFORM SETTINGS VIEW ─────────────────────────────────── */}
            {activeTab === 'settings' && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.5rem', maxWidth: '680px' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: 600, color: '#111111' }}>
                  <Sliders size={20} style={{ color: '#2563EB' }} /> Global Governance Settings
                </h3>
                <form onSubmit={handleSaveSettings} style={{ display: 'grid', gap: '1.25rem' }}>
                  <div className="input-group">
                    <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Platform Name</label>
                    <input type="text" className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={settingsForm.platformName} onChange={(e) => setSettingsForm({ ...settingsForm, platformName: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Support Email Address</label>
                    <input type="email" className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={settingsForm.supportEmail} onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                      <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Max Login Attempts</label>
                      <input type="number" className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={settingsForm.maxLoginAttempts} onChange={(e) => setSettingsForm({ ...settingsForm, maxLoginAttempts: parseInt(e.target.value) })} />
                    </div>
                    <div className="input-group">
                      <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Session Timeout (Mins)</label>
                      <input type="number" className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={settingsForm.sessionTimeoutMinutes} onChange={(e) => setSettingsForm({ ...settingsForm, sessionTimeoutMinutes: parseInt(e.target.value) })} />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ justifySelf: 'start', padding: '0.6rem 1.5rem', fontSize: '0.875rem' }}>
                    Save Governance Configuration
                  </button>
                </form>
              </div>
            )}

            {/* ─── 11. SUPER ADMIN PROFILE VIEW ──────────────────────────────── */}
            {activeTab === 'profile' && (
              <>
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.5rem', maxWidth: '640px' }}>
                  <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: 600, color: '#111111' }}>
                    <User size={20} style={{ color: '#2563EB' }} /> Super Administrator Credentials
                  </h3>
                  <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid #E5E7EB' }}>
                      <span style={{ color: '#4B5563' }}>Full Name:</span>
                      <span style={{ fontWeight: 600, color: '#111111' }}>{currentUser?.name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid #E5E7EB' }}>
                      <span style={{ color: '#4B5563' }}>Official Email:</span>
                      <span style={{ fontWeight: 600, color: '#111111' }}>{currentUser?.email}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid #E5E7EB' }}>
                      <span style={{ color: '#4B5563' }}>Super Admin ID:</span>
                      <span style={{ fontFamily: 'monospace', color: '#111111', fontWeight: 600 }}>{currentUser?.adminId || currentUser?.etxId || 'ETX-SA-MASTER'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid #E5E7EB' }}>
                      <span style={{ color: '#4B5563' }}>ETX Identity ID:</span>
                      <span style={{ fontFamily: 'monospace', color: '#111111', fontWeight: 600 }}>{currentUser?.etxId}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0' }}>
                      <span style={{ color: '#4B5563' }}>Governance Authority:</span>
                      <span style={{ fontWeight: 600, color: '#2563EB' }}>Global Super Admin</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', maxWidth: '640px' }}>
                  <VoluntaryChangePasswordForm />
                </div>
              </>
            )}
          </>
        )}

        {/* ─── MODAL: Provision / Invite Admin ────────────────────────────── */}
        {showCreateAdminModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
            <form onSubmit={handleCreateAdmin} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '460px', padding: '1.5rem', color: '#111111' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', color: '#111111', fontSize: '1.125rem', fontWeight: 600 }}>Provision Administrator Access</h3>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Full Name *</label>
                  <input type="text" className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Email Address *</label>
                  <input type="email" className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Initial Password (If creating directly)</label>
                  <PasswordInput
                    className="input-field"
                    style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }}
                    placeholder="••••••••"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    autoComplete="new-password"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Admin Role Level *</label>
                  <select className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={newAdmin.role} onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}>
                    <option value="admin">Operational Admin</option>
                    <option value="institution_admin">Institution Admin</option>
                    <option value="super_admin">Super Admin (Global Authority)</option>
                  </select>
                </div>
                {newAdmin.role === 'institution_admin' && (
                  <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <label className="input-label" style={{ margin: 0, color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Target Institution *</label>
                      <button type="button" onClick={fetchInstitutionsDropdown} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>Refresh Colleges</button>
                    </div>
                    <select className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={newAdmin.institutionId} onChange={(e) => setNewAdmin({ ...newAdmin, institutionId: e.target.value })} required>
                      <option value="">Select College / Institution...</option>
                      {institutions.map((inst) => (
                        <option key={inst._id} value={inst._id}>{inst.name} ({inst.tenantId || inst.code})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreateAdminModal(false)} className="btn btn-outline" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111', fontSize: '0.875rem' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.875rem' }}>Grant Privileges</button>
              </div>
            </form>
          </div>
        )}

        {/* ─── MODAL: Create Institution ──────────────────────────────────── */}
        {showCreateInstModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
            <form onSubmit={handleCreateInstitution} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '480px', padding: '1.5rem', color: '#111111' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', color: '#111111', fontSize: '1.125rem', fontWeight: 600 }}>Register New College / Institution</h3>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Institution Name *</label>
                  <input type="text" className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} placeholder="e.g. Stanford University" value={newInst.name} onChange={(e) => setNewInst({ ...newInst, name: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Code</label>
                    <input type="text" className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} placeholder="e.g. STF-ENG" value={newInst.code} onChange={(e) => setNewInst({ ...newInst, code: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Domain</label>
                    <input type="text" className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} placeholder="e.g. stanford.edu" value={newInst.domain} onChange={(e) => setNewInst({ ...newInst, domain: e.target.value })} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreateInstModal(false)} className="btn btn-outline" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111', fontSize: '0.875rem' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.875rem' }}>Create Institution</button>
              </div>
            </form>
          </div>
        )}

        {/* ─── MODAL: Account Suspension ──────────────────────────────────── */}
        {suspendingUser && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
            <form onSubmit={handleToggleUserStatus} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '450px', padding: '1.5rem', color: '#111111' }}>
              <h3 style={{ color: '#111111', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: 600 }}>
                <AlertTriangle size={20} style={{ color: suspendingUser.status === 'suspended' ? '#059669' : '#D97706' }} />
                {suspendingUser.status === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
              </h3>
              <p style={{ color: '#4B5563', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                User: <strong style={{ color: '#111111' }}>{suspendingUser.name}</strong> ({suspendingUser.email}) <br />
                ETX ID: <span style={{ fontFamily: 'monospace', color: '#111111', fontWeight: 600 }}>{suspendingUser.etxId || `ETX-${suspendingUser._id.slice(-8).toUpperCase()}`}</span>
              </p>
              {suspendingUser.status !== 'suspended' && (
                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Reason for Suspension</label>
                  <textarea className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} rows={3} placeholder="Provide explanation for security/policy log..." value={suspensionReason} onChange={(e) => setSuspensionReason(e.target.value)} required />
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setSuspendingUser(null)} className="btn btn-outline" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111', fontSize: '0.875rem' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: suspendingUser.status === 'suspended' ? '#059669' : '#DC2626', borderColor: suspendingUser.status === 'suspended' ? '#059669' : '#DC2626', fontSize: '0.875rem' }}>
                  Confirm {suspendingUser.status === 'suspended' ? 'Reactivation' : 'Suspension'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── MODAL: Reject Request ──────────────────────────────────────── */}
        {rejectingUser && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
            <form onSubmit={handleRejectRequest} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '450px', padding: '1.5rem', color: '#111111' }}>
              <h3 style={{ color: '#DC2626', margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600 }}>Reject Verification: {rejectingUser.name}</h3>
              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Reason for Rejection</label>
                <textarea className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} rows={3} placeholder="Provide feedback explaining why verification was rejected..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setRejectingUser(null)} className="btn btn-outline" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111', fontSize: '0.875rem' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#DC2626', borderColor: '#DC2626', fontSize: '0.875rem' }}>Reject</button>
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
