import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Crown, Building, UserCheck, Users, KeyRound, CreditCard,
  BarChart3, ShieldAlert, Sliders, FileText, Settings, RefreshCw,
  Plus, CheckCircle, AlertTriangle, Search, Filter, Lock, Shield, Check, X, ExternalLink
} from 'lucide-react';
import PlatformOwnerLayout from '../../layouts/PlatformOwnerLayout';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';
import VoluntaryChangePasswordForm from '../../components/VoluntaryChangePasswordForm';

const PlatformOwnerDashboard = ({ activeTab: propActiveTab }) => {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = propActiveTab || searchParams.get('tab') || 'overview';

  // Data State
  const [stats, setStats] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [systemConfig, setSystemConfig] = useState({
    platformName: 'MAVI Linking',
    maintenanceMode: false,
    allowSelfRegistration: true,
    requirePrnVerification: true,
    maxTenantLimit: 50,
    defaultSessionTimeoutMinutes: 60,
  });
  const [loading, setLoading] = useState(true);

  // Filters & Search State
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [adminSearch, setAdminSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [auditSearch, setAuditSearch] = useState('');

  // Modals state
  const [showCreateInstModal, setShowCreateInstModal] = useState(false);
  const [newInst, setNewInst] = useState({ name: '', shortName: '', officialDomain: '', plan: 'PRO', primaryContactName: '', primaryContactEmail: '' });
  const [showInviteAdminModal, setShowInviteAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    role: 'institution_admin',
    scope: 'INSTITUTION',
    institutionId: '',
    departmentId: '',
    permissions: ['STUDENT_VIEW', 'STUDENT_APPROVE', 'STUDENT_PROFILE_MANAGE'],
    designation: 'Administrator',
  });
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [inviteResult, setInviteResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [ownerPlans, setOwnerPlans] = useState([]);
  const [ownerBilling, setOwnerBilling] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({ name: '', code: 'PRO', priceAmount: 149999, maxStudents: 2500, maxTeachers: 200, maxDepartments: 15, description: '', status: 'ACTIVE' });

  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertingAdmin, setConvertingAdmin] = useState(null);
  const [convertForm, setConvertForm] = useState({ institutionId: '', departmentId: '', prn: '', reason: '' });
  const [convertDepartments, setConvertDepartments] = useState([]);

  useEffect(() => {
    if (convertForm.institutionId) {
      api.get(`/admin/departments?institutionId=${convertForm.institutionId}`)
        .then((res) => setConvertDepartments(res.data?.data?.departments || res.data?.data || []))
        .catch(() => setConvertDepartments([]));
    } else {
      setConvertDepartments([]);
    }
  }, [convertForm.institutionId]);

  const handleConvertToStudent = async (e) => {
    e.preventDefault();
    if (!convertingAdmin?._id) return;
    if (!convertForm.institutionId || !convertForm.departmentId || !convertForm.prn) {
      toast.error('Institution, Department, and PRN are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/owner/admins/${convertingAdmin._id}/convert-to-student`, convertForm);
      toast.success(res.data?.message || 'Account successfully converted to Student role.');
      setShowConvertModal(false);
      setConvertingAdmin(null);
      setConvertForm({ institutionId: '', departmentId: '', prn: '', reason: '' });
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to convert account to student.'));
    } finally {
      setSubmitting(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        statsRes,
        instRes,
        adminRes,
        usersRes,
        licRes,
        subRes,
        anaRes,
        secRes,
        configRes,
        auditRes,
        plansRes,
        billOverviewRes,
      ] = await Promise.all([
        api.get('/owner/overview').catch(() => api.get('/super-admin/stats').catch(() => ({ data: { data: {} } }))),
        api.get('/owner/tenants').catch(() => api.get('/super-admin/institutions').catch(() => ({ data: { data: { institutions: [] } } }))),
        api.get('/owner/admins').catch(() => api.get('/super-admin/admins').catch(() => ({ data: { data: { admins: [] } } }))),
        api.get('/owner/users').catch(() => ({ data: { data: { users: [] } } })),
        api.get('/owner/licensing').catch(() => api.get('/super-admin/licenses').catch(() => ({ data: { data: { licenses: [] } } }))),
        api.get('/owner/subscriptions').catch(() => ({ data: { data: { subscriptions: [] } } })),
        api.get('/owner/analytics').catch(() => api.get('/super-admin/analytics').catch(() => ({ data: { data: {} } }))),
        api.get('/owner/security-events').catch(() => api.get('/super-admin/security-events?limit=50').catch(() => ({ data: { data: { events: [] } } }))),
        api.get('/owner/configuration').catch(() => api.get('/super-admin/settings').catch(() => ({ data: { data: {} } }))),
        api.get('/owner/audit-logs').catch(() => ({ data: { data: { logs: [] } } })),
        api.get('/owner/plans').catch(() => ({ data: { data: [] } })),
        api.get('/owner/billing/overview').catch(() => ({ data: { data: {} } })),
      ]);

      const plansData = Array.isArray(plansRes.data?.data) ? plansRes.data.data : [];
      setOwnerPlans(plansData);

      const billData = billOverviewRes.data?.data || null;
      setOwnerBilling(billData);

      const statsData = statsRes.data?.data?.stats || statsRes.data?.data || {};
      setStats(statsData);

      const instList = Array.isArray(instRes.data?.data?.institutions) ? instRes.data.data.institutions : Array.isArray(instRes.data?.data) ? instRes.data.data : [];
      setInstitutions(instList);

      const adminList = Array.isArray(adminRes.data?.data?.admins) ? adminRes.data.data.admins : Array.isArray(adminRes.data?.data) ? adminRes.data.data : [];
      setAdmins(adminList);

      const userList = Array.isArray(usersRes.data?.data?.users) ? usersRes.data.data.users : Array.isArray(usersRes.data?.data) ? usersRes.data.data : [];
      setUsers(userList);

      const licList = Array.isArray(licRes.data?.data?.licenses) ? licRes.data.data.licenses : Array.isArray(licRes.data?.data) ? licRes.data.data : [];
      setLicenses(licList);

      const subList = Array.isArray(subRes.data?.data?.subscriptions) ? subRes.data.data.subscriptions : Array.isArray(subRes.data?.data) ? subRes.data.data : [];
      setSubscriptions(subList);

      const analyticsData = anaRes.data?.data?.analytics || anaRes.data?.data || {};
      setAnalytics(analyticsData);

      const secList = Array.isArray(secRes.data?.data?.events) ? secRes.data.data.events : Array.isArray(secRes.data?.data) ? secRes.data.data : [];
      setSecurityEvents(secList);

      const configData = configRes.data?.data?.configuration || configRes.data?.data?.settings || configRes.data?.data || {};
      if (configData && Object.keys(configData).length > 0) {
        setSystemConfig(prev => ({ ...prev, ...configData }));
      }

      const auditList = Array.isArray(auditRes.data?.data?.logs) ? auditRes.data.data.logs : Array.isArray(auditRes.data?.data) ? auditRes.data.data : [];
      setAuditLogs(auditList);

    } catch (err) {
      console.error('Platform Owner data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentTab]);

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // ── Actions ─────────────────────────────────────────────────────────────

  const handleCreateInstitution = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/owner/tenants', newInst);
      toast.success('Customer Tenant provisioned successfully.');
      setShowCreateInstModal(false);
      setNewInst({ name: '', shortName: '', officialDomain: '', plan: 'PRO', primaryContactName: '', primaryContactEmail: '' });
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to provision tenant institution.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleInviteAdmin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/owner/admins/invite', newAdmin);
      setInviteResult(res.data.data);
      if (res.data?.emailSent || res.data?.data?.emailSent) {
        toast.success('Administrator created successfully. Invitation email sent.');
      } else {
        toast.warning('Administrator created, but invitation email could not be sent. You can copy the link below.');
      }
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to invite administrator.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTenantStatus = async (instId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.put(`/owner/tenants/${instId}`, { status: nextStatus });
      toast.success(`Tenant ${nextStatus === 'active' ? 'activated' : 'suspended'} successfully.`);
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update tenant status.'));
    }
  };

  const handleSuspendAdmin = async (adminId) => {
    try {
      await api.patch(`/owner/admins/${adminId}/suspend`, { reason: 'Suspended by Platform Owner' });
      toast.success('Administrator account suspended.');
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to suspend admin account.'));
    }
  };

  const handleReactivateAdmin = async (adminId) => {
    try {
      await api.patch(`/owner/admins/${adminId}/reactivate`);
      toast.success('Administrator account reactivated.');
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to reactivate admin account.'));
    }
  };

  const handleResendInvite = async (adminId) => {
    try {
      const res = await api.post(`/owner/admins/${adminId}/resend-invite`);
      if (res.data?.emailSent || res.data?.data?.emailSent) {
        toast.success('Admin invitation resent and email dispatched successfully.');
      } else {
        toast.warning('Admin invitation updated, but email could not be sent.');
      }
      if (res.data?.data?.invitationLink) {
        navigator.clipboard.writeText(res.data.data.invitationLink);
        toast.info('Invitation link copied to clipboard.');
      }
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to resend admin invitation.'));
    }
  };

  const handleRevokeInvite = async (adminId) => {
    try {
      await api.patch(`/owner/admins/${adminId}/revoke-invite`);
      toast.success('Admin invitation revoked.');
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to revoke admin invitation.'));
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.put(`/owner/users/${userId}/status`, { status: nextStatus });
      toast.success(`User account ${nextStatus === 'active' ? 'activated' : 'suspended'}.`);
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update user status.'));
    }
  };

  const handleSaveSystemConfig = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put('/owner/configuration', systemConfig);
      toast.success('Global platform system configuration saved successfully.');
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update system configuration.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingPlan?._id) {
        // Edit existing plan (increments version if price/limits change)
        const res = await api.put(`/owner/plans/${editingPlan._id}`, {
          name: planForm.name,
          description: planForm.description,
          price: { amount: Number(planForm.priceAmount), currency: 'INR', interval: 'annual' },
          limits: { maxStudents: Number(planForm.maxStudents), maxTeachers: Number(planForm.maxTeachers), maxDepartments: Number(planForm.maxDepartments) },
          status: planForm.status,
        });
        toast.success(res.data?.message || 'Plan updated successfully.');
      } else {
        // Create new plan tier
        const res = await api.post('/owner/plans', {
          name: planForm.name,
          code: planForm.code,
          description: planForm.description,
          price: { amount: Number(planForm.priceAmount), currency: 'INR', interval: 'annual' },
          limits: { maxStudents: Number(planForm.maxStudents), maxTeachers: Number(planForm.maxTeachers), maxDepartments: Number(planForm.maxDepartments) },
          status: planForm.status,
        });
        toast.success(res.data?.message || 'Plan created successfully.');
      }
      setShowPlanModal(false);
      setEditingPlan(null);
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save SaaS plan.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetPlanStatus = async (planId, newStatus) => {
    try {
      const res = await api.patch(`/owner/plans/${planId}/status`, { status: newStatus });
      toast.success(res.data?.message || `Plan status set to ${newStatus}.`);
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update plan status.'));
    }
  };

  // Filtered lists
  const filteredInstitutions = institutions.filter(inst => {
    const matchSearch = !tenantSearch || 
      inst.name?.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      inst.tenantId?.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      inst.officialDomain?.toLowerCase().includes(tenantSearch.toLowerCase());
    const matchFilter = tenantFilter === 'all' || inst.status === tenantFilter;
    return matchSearch && matchFilter;
  });

  const filteredAdmins = admins.filter(admin => {
    return !adminSearch ||
      admin.name?.toLowerCase().includes(adminSearch.toLowerCase()) ||
      admin.email?.toLowerCase().includes(adminSearch.toLowerCase()) ||
      admin.adminId?.toLowerCase().includes(adminSearch.toLowerCase());
  });

  const filteredUsers = users.filter(u => {
    const matchSearch = !userSearch ||
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.maviId?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.prn?.toLowerCase().includes(userSearch.toLowerCase());
    const targetRole = userRoleFilter === 'student' ? 'user' : userRoleFilter;
    const matchRole = userRoleFilter === 'all' || u.role === targetRole;
    return matchSearch && matchRole;
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    return !auditSearch ||
      log.action?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.ipAddress?.toLowerCase().includes(auditSearch.toLowerCase());
  });

  return (
    <PlatformOwnerLayout activeTab={currentTab} setActiveTab={handleTabChange}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', color: 'white' }}>
        
        {/* Top Header Control Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Crown style={{ color: '#eab308' }} size={28} />
              Platform Owner Control Console
            </h2>
            <p style={{ color: '#a1a1aa', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
              Master multi-tenant SaaS governance, global tenant isolation, licensing & configuration.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={loadData} className="btn btn-outline" style={{ borderColor: 'rgba(234, 179, 8, 0.4)', color: '#fde047', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Sync Data
            </button>
            <button onClick={() => setShowCreateInstModal(true)} className="btn btn-primary" style={{ background: '#eab308', borderColor: '#eab308', color: '#09090b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} /> Provision Tenant
            </button>
            <button onClick={() => setShowInviteAdminModal(true)} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)', borderColor: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={18} /> Invite Institution Admin
            </button>
          </div>
        </div>

        {/* ── TAB 1: OVERVIEW ──────────────────────────────────────────────── */}
        {currentTab === 'overview' && (
          <div className="animate-fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div className="glass-card-static" style={{ padding: '1.5rem', borderLeft: '4px solid #eab308' }}>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Provisioned Tenants</div>
                <div style={{ fontSize: '2.25rem', fontWeight: '800', margin: '0.25rem 0', color: '#fef08a' }}>{stats?.totalInstitutions || institutions.length}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>Active College Organizations</div>
              </div>

              <div className="glass-card-static" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-purple)' }}>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Institution Administrators</div>
                <div style={{ fontSize: '2.25rem', fontWeight: '800', margin: '0.25rem 0', color: '#c084fc' }}>{stats?.totalAdmins || admins.length}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Scoped Administrative Accounts</div>
              </div>

              <div className="glass-card-static" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-cyan)' }}>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Platform Users</div>
                <div style={{ fontSize: '2.25rem', fontWeight: '800', margin: '0.25rem 0', color: '#67e8f9' }}>{stats?.totalUsers || users.length}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Students, Teachers & Recruiters</div>
              </div>

              <div className="glass-card-static" style={{ padding: '1.5rem', borderLeft: '4px solid #ef4444' }}>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Events</div>
                <div style={{ fontSize: '2.25rem', fontWeight: '800', margin: '0.25rem 0', color: '#f87171' }}>{stats?.totalSecurityEvents || securityEvents.length}</div>
                <div style={{ fontSize: '0.75rem', color: '#fca5a5' }}>Audit Log Records</div>
              </div>
            </div>

            {/* Active Tenants Overview */}
            <div className="glass-card-static" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#fde047', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={20} /> Active Multi-Tenant Organizations
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#a1a1aa' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Tenant ID</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Institution Name</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Domain</th>
                      <th style={{ padding: '0.75rem 1rem' }}>SaaS Plan</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {institutions.slice(0, 5).map((inst) => (
                      <tr key={inst._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#fde047', fontWeight: 'bold' }}>
                          {inst.tenantId || `INST-${inst._id.slice(-6).toUpperCase()}`}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{inst.name}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{inst.officialDomain || inst.domain || 'N/A'}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{inst.plan || 'PRO'}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: inst.status === 'suspended' ? '#ef4444' : 'var(--accent-emerald)', fontWeight: 'bold' }}>
                          {inst.status || 'active'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: TENANTS / INSTITUTIONS ───────────────────────────────── */}
        {currentTab === 'tenants' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '600px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
                  <input
                    type="text"
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Search by Tenant ID, Name, or Domain..."
                    value={tenantSearch}
                    onChange={(e) => setTenantSearch(e.target.value)}
                  />
                </div>
                <select className="input-field" style={{ width: '160px' }} value={tenantFilter} onChange={(e) => setTenantFilter(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <button onClick={() => setShowCreateInstModal(true)} className="btn btn-primary" style={{ background: '#eab308', borderColor: '#eab308', color: '#09090b', fontWeight: 'bold' }}>
                <Plus size={18} /> Provision Tenant
              </button>
            </div>

            <div className="glass-card-static" style={{ padding: '1.5rem' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#a1a1aa' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Tenant ID</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Institution Name</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Official Domain</th>
                      <th style={{ padding: '0.75rem 1rem' }}>SaaS Plan</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInstitutions.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#a1a1aa' }}>No customer tenant institutions found matching filter.</td></tr>
                    ) : (
                      filteredInstitutions.map((inst) => (
                        <tr key={inst._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#fde047', fontWeight: 'bold' }}>
                            {inst.tenantId}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{inst.name}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{inst.officialDomain || inst.domain || 'N/A'}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{inst.plan || 'PRO'}</span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span className={`badge ${inst.status === 'suspended' ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.7rem' }}>
                              {inst.status || 'active'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                            <button
                              onClick={() => handleToggleTenantStatus(inst._id, inst.status)}
                              className={`btn btn-sm ${inst.status === 'suspended' ? 'btn-success' : 'btn-outline'}`}
                              style={{ fontSize: '0.75rem' }}
                            >
                              {inst.status === 'suspended' ? 'Activate Tenant' : 'Suspend Tenant'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: ADMIN MANAGEMENT ──────────────────────────────────────── */}
        {currentTab === 'admins' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Search by Admin ID, Name, Email..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                />
              </div>

              <button onClick={() => setShowInviteAdminModal(true)} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)', borderColor: '#a78bfa' }}>
                <UserCheck size={18} /> Invite Institution Admin
              </button>
            </div>

            <div className="glass-card-static" style={{ padding: '1.5rem' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#a1a1aa' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Admin ID</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Administrator Name</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Role & Scope</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Assigned Tenant / Dept</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Account Status</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdmins.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#a1a1aa' }}>No institution administrators found.</td></tr>
                    ) : (
                      filteredAdmins.map((adm) => {
                        const status = adm.accountStatus || (adm.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE');
                        return (
                          <tr key={adm._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#c084fc', fontWeight: 'bold' }}>
                              {adm.adminId || adm.maviId}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>
                              <div>{adm.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>{adm.designation || 'Administrator'}</div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{adm.email}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                <span className="badge badge-primary" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>
                                  {adm.role?.replace(/_/g, ' ')}
                                </span>
                                <span className="badge" style={{ fontSize: '0.68rem', background: '#3f3f46', color: '#e4e4e7' }}>
                                  {adm.adminScope || 'INSTITUTION'}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              {adm.institutionId ? (
                                <div>
                                  <span style={{ color: '#fde047', fontWeight: '600' }}>{adm.institutionId.name}</span>
                                  {adm.departmentId && <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Dept: {adm.departmentId.name}</div>}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>Global Scoped</span>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
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
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                {status === 'INVITED' && (
                                  <>
                                    <button onClick={() => handleResendInvite(adm._id)} className="btn btn-sm btn-outline" style={{ fontSize: '0.72rem' }}>
                                      Resend Invite
                                    </button>
                                    <button onClick={() => handleRevokeInvite(adm._id)} className="btn btn-sm btn-danger" style={{ fontSize: '0.72rem', background: '#ef4444', borderColor: '#ef4444' }}>
                                      Revoke
                                    </button>
                                  </>
                                )}
                                {status === 'ACTIVE' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setConvertingAdmin(adm);
                                        setConvertForm({ institutionId: adm.institutionId?._id || '', departmentId: adm.departmentId?._id || '', prn: '', reason: '' });
                                        setShowConvertModal(true);
                                      }}
                                      className="btn btn-sm btn-outline"
                                      style={{ fontSize: '0.72rem', borderColor: '#f59e0b', color: '#f59e0b' }}
                                    >
                                      Convert to Student
                                    </button>
                                    <button onClick={() => handleSuspendAdmin(adm._id)} className="btn btn-sm btn-danger" style={{ fontSize: '0.72rem', background: '#ef4444', borderColor: '#ef4444' }}>
                                      Suspend
                                    </button>
                                  </>
                                )}
                                {status === 'SUSPENDED' && (
                                  <button onClick={() => handleReactivateAdmin(adm._id)} className="btn btn-sm btn-success" style={{ fontSize: '0.72rem' }}>
                                    Reactivate
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: PLATFORM USERS ───────────────────────────────────────── */}
        {currentTab === 'users' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Search by MAVI ID, PRN, Name, Email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>

              <select className="input-field" style={{ width: '180px' }} value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
                <option value="all">All Roles</option>
                <option value="student">Student / User</option>
                <option value="teacher">Teacher / Professor</option>
                <option value="recruiter">Recruiter</option>
                <option value="institution_admin">Institution Admin</option>
              </select>
            </div>

            <div className="glass-card-static" style={{ padding: '1.5rem' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#a1a1aa' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>MAVI ID / PRN</th>
                      <th style={{ padding: '0.75rem 1rem' }}>User Name</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Email Address</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Institution</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Account Status</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#a1a1aa' }}>No users found matching parameters.</td></tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#67e8f9', fontWeight: 'bold' }}>
                            {u.prn || u.maviId}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{u.name}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>{u.role}</span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{u.institutionId?.name || 'N/A'}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span className={`badge ${u.status === 'suspended' ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.7rem' }}>
                              {u.status || 'active'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                            <button
                              onClick={() => handleToggleUserStatus(u._id, u.status)}
                              className={`btn btn-sm ${u.status === 'suspended' ? 'btn-success' : 'btn-outline'}`}
                              style={{ fontSize: '0.75rem' }}
                            >
                              {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: LICENSING ────────────────────────────────────────────── */}
        {currentTab === 'licensing' && (
          <div className="animate-fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div className="glass-card-static" style={{ padding: '1.5rem', borderLeft: '4px solid #eab308' }}>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>TOTAL LICENSES</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#fef08a' }}>{licenses.length}</div>
              </div>
              <div className="glass-card-static" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-purple)' }}>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>ENTERPRISE LICENSES</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#c084fc' }}>{licenses.filter(l => l.plan === 'ENTERPRISE').length}</div>
              </div>
              <div className="glass-card-static" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-emerald)' }}>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>ACTIVE LICENSES</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#34d399' }}>{licenses.filter(l => l.licenseStatus === 'active').length}</div>
              </div>
            </div>

            <div className="glass-card-static" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#fde047', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={20} /> Tenant SaaS Licensing Contracts
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#a1a1aa' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Tenant ID</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Institution Name</th>
                      <th style={{ padding: '0.75rem 1rem' }}>SaaS Plan</th>
                      <th style={{ padding: '0.75rem 1rem' }}>User Cap Limit</th>
                      <th style={{ padding: '0.75rem 1rem' }}>License Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {licenses.map((lic) => (
                      <tr key={lic._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#fde047', fontWeight: 'bold' }}>{lic.tenantId}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{lic.institutionName}</td>
                        <td style={{ padding: '0.75rem 1rem' }}><span className="badge badge-primary">{lic.plan}</span></td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{lic.userLimit?.toLocaleString()} Users</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--accent-emerald)', fontWeight: 'bold' }}>{lic.licenseStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 6: SUBSCRIPTIONS & COMMERCIAL SAAS PRICING GOVERNANCE ───── */}
        {currentTab === 'subscriptions' && (
          <div className="animate-fade-in">
            {/* Global Billing Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div className="glass-card-static" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>TOTAL SAAS REVENUE</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#34d399' }}>₹{(ownerBilling?.metrics?.totalRevenue || 0).toLocaleString()}</div>
              </div>
              <div className="glass-card-static" style={{ padding: '1.5rem', borderLeft: '4px solid #eab308' }}>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>ACTIVE SUBSCRIPTIONS</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#fef08a' }}>{ownerBilling?.metrics?.activeSubscriptions || subscriptions.length}</div>
              </div>
              <div className="glass-card-static" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-purple)' }}>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>SUCCESSFUL TRANSACTIONS</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#c084fc' }}>{ownerBilling?.metrics?.successfulPaymentsCount || 0}</div>
              </div>
              <div className="glass-card-static" style={{ padding: '1.5rem', borderLeft: '4px solid #ef4444' }}>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>FAILED PAYMENTS</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f87171' }}>{ownerBilling?.metrics?.failedPaymentsCount || 0}</div>
              </div>
            </div>

            {/* Section 1: Commercial SaaS Plan Catalog (Sole Owner Pricing Authority) */}
            <div className="glass-card-static" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#fde047', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Crown size={20} /> SaaS Catalog Pricing Management (Owner Sole Authority)
                  </h3>
                  <p style={{ color: '#a1a1aa', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
                    Modifying prices creates a new plan version snapshot (v1, v2). Existing paid subscriptions retain historical pricing.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingPlan(null);
                    setPlanForm({ name: '', code: 'PRO', priceAmount: 149999, maxStudents: 2500, maxTeachers: 200, maxDepartments: 15, description: '', status: 'ACTIVE' });
                    setShowPlanModal(true);
                  }}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                >
                  <Plus size={16} /> Create SaaS Plan
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#a1a1aa' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Plan Name & Code</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Version</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Official Price</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Student Cap</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Faculty Cap</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownerPlans.length === 0 ? (
                      <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#a1a1aa' }}>No SaaS plans created yet. Click 'Create SaaS Plan' to add.</td></tr>
                    ) : (
                      ownerPlans.map((plan) => (
                        <tr key={plan._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ fontWeight: 'bold', color: 'white' }}>{plan.name}</div>
                            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#fde047' }}>{plan.code}</div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>v{plan.version}</span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#34d399' }}>
                            ₹{plan.price?.amount?.toLocaleString()} {plan.price?.currency}/yr
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                            {plan.limits?.maxStudents?.toLocaleString() || 500}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                            {plan.limits?.maxTeachers || 50}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span className={`badge ${plan.status === 'ACTIVE' ? 'badge-success' : plan.status === 'DRAFT' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.75rem' }}>
                              {plan.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                              <button
                                onClick={() => {
                                  setEditingPlan(plan);
                                  setPlanForm({
                                    name: plan.name,
                                    code: plan.code,
                                    priceAmount: plan.price?.amount || 149999,
                                    maxStudents: plan.limits?.maxStudents || 2500,
                                    maxTeachers: plan.limits?.maxTeachers || 200,
                                    maxDepartments: plan.limits?.maxDepartments || 15,
                                    description: plan.description || '',
                                    status: plan.status || 'ACTIVE',
                                  });
                                  setShowPlanModal(true);
                                }}
                                className="btn btn-sm btn-outline"
                                style={{ fontSize: '0.75rem' }}
                              >
                                Edit Price / Version
                              </button>
                              {plan.status === 'ACTIVE' ? (
                                <button onClick={() => handleSetPlanStatus(plan._id, 'INACTIVE')} className="btn btn-sm btn-outline" style={{ fontSize: '0.75rem', color: '#f59e0b' }}>
                                  Unpublish
                                </button>
                              ) : (
                                <button onClick={() => handleSetPlanStatus(plan._id, 'ACTIVE')} className="btn btn-sm btn-success" style={{ fontSize: '0.75rem' }}>
                                  Publish
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Multi-Tenant Institutional Subscriptions & Ledger */}
            <div className="glass-card-static" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#fde047', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={20} /> Multi-Tenant Institutional Subscriptions & Payment Ledger
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#a1a1aa' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Tenant ID</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Institution Name</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Plan Tier & Version</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Price Snapshot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ownerBilling?.subscriptions || subscriptions).map((sub, i) => (
                      <tr key={sub.id || sub._id || i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#fde047', fontWeight: 'bold' }}>{sub.tenantId || 'INST'}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{sub.institution || sub.institutionName || 'Institution'}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className="badge badge-primary">{sub.planCode || sub.plan || 'PRO'}</span>
                          <span className="badge badge-secondary" style={{ marginLeft: '0.4rem', fontSize: '0.7rem' }}>v{sub.planVersion || 1}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--accent-emerald)', fontWeight: 'bold' }}>{sub.status || sub.subscriptionStatus || 'ACTIVE'}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#fde047' }}>
                          ₹{(sub.priceSnapshot?.amount || sub.amount || 149999).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 7: GLOBAL ANALYTICS ─────────────────────────────────────── */}
        {currentTab === 'analytics' && (
          <div className="animate-fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div className="glass-card-static" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Total Platform Users</div>
                <div style={{ fontSize: '2.25rem', fontWeight: '800', color: '#67e8f9' }}>{analytics?.totalUsers || 0}</div>
              </div>
              <div className="glass-card-static" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Students</div>
                <div style={{ fontSize: '2.25rem', fontWeight: '800', color: '#c084fc' }}>{analytics?.studentsCount || 0}</div>
              </div>
              <div className="glass-card-static" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Teachers & Professors</div>
                <div style={{ fontSize: '2.25rem', fontWeight: '800', color: '#34d399' }}>{analytics?.teachersCount || 0}</div>
              </div>
              <div className="glass-card-static" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Recruiters</div>
                <div style={{ fontSize: '2.25rem', fontWeight: '800', color: '#fde047' }}>{analytics?.recruitersCount || 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 8: SECURITY CENTER ──────────────────────────────────────── */}
        {currentTab === 'security' && (
          <div className="animate-fade-in">
            <div className="glass-card-static" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} /> Security & Audit Feed
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#a1a1aa' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Timestamp</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Action</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Actor</th>
                      <th style={{ padding: '0.75rem 1rem' }}>IP Address</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityEvents.map((evt) => (
                      <tr key={evt._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{new Date(evt.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#fca5a5' }}>{evt.action}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{evt.userId?.name || evt.userId?.email || 'System'}</td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#a1a1aa' }}>{evt.ipAddress || '127.0.0.1'}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{evt.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 9: SYSTEM CONFIGURATION ─────────────────────────────────── */}
        {currentTab === 'system' && (
          <div className="animate-fade-in">
            <form onSubmit={handleSaveSystemConfig} className="glass-card-static" style={{ padding: '2rem', maxWidth: '720px' }}>
              <h3 style={{ marginBottom: '1.5rem', color: '#fde047', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={22} /> Platform Global System Configuration
              </h3>

              <div style={{ display: 'grid', gap: '1.25rem', marginBottom: '2rem' }}>
                <div className="input-group">
                  <label className="input-label">Platform Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={systemConfig.platformName}
                    onChange={(e) => setSystemConfig({ ...systemConfig, platformName: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Max Tenant Capacity Limit</label>
                    <input
                      type="number"
                      className="input-field"
                      value={systemConfig.maxTenantLimit}
                      onChange={(e) => setSystemConfig({ ...systemConfig, maxTenantLimit: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Session Timeout (Minutes)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={systemConfig.defaultSessionTimeoutMinutes}
                      onChange={(e) => setSystemConfig({ ...systemConfig, defaultSessionTimeoutMinutes: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={systemConfig.allowSelfRegistration}
                      onChange={(e) => setSystemConfig({ ...systemConfig, allowSelfRegistration: e.target.checked })}
                    />
                    <span>Allow Self Registration for Students/Teachers</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={systemConfig.requirePrnVerification}
                      onChange={(e) => setSystemConfig({ ...systemConfig, requirePrnVerification: e.target.checked })}
                    />
                    <span>Require Institutional PRN Verification for Student Login</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: '#f87171' }}>
                    <input
                      type="checkbox"
                      checked={systemConfig.maintenanceMode}
                      onChange={(e) => setSystemConfig({ ...systemConfig, maintenanceMode: e.target.checked })}
                    />
                    <span>Enable Global Platform Maintenance Mode</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ background: '#eab308', borderColor: '#eab308', color: '#09090b', fontWeight: 'bold', padding: '0.85rem 2rem' }} disabled={submitting}>
                {submitting ? 'Saving Configuration...' : 'Save Platform Configuration'}
              </button>
            </form>
          </div>
        )}

        {/* ── TAB 10: GLOBAL AUDIT LOGS ───────────────────────────────────── */}
        {currentTab === 'audit' && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: '1.5rem', maxWidth: '400px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Search audit logs by action or IP..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
              />
            </div>

            <div className="glass-card-static" style={{ padding: '1.5rem' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#a1a1aa' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Timestamp</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Action</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Actor</th>
                      <th style={{ padding: '0.75rem 1rem' }}>IP Address</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAuditLogs.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#a1a1aa' }}>No security audit logs found.</td></tr>
                    ) : (
                      filteredAuditLogs.map((log) => (
                        <tr key={log._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{new Date(log.createdAt).toLocaleString()}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#fde047' }}>{log.action}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>{log.userId?.name || log.userId?.email || 'Platform Owner'}</td>
                          <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#a1a1aa' }}>{log.ipAddress || '127.0.0.1'}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{log.details}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 11: OWNER SETTINGS ──────────────────────────────────────── */}
        {currentTab === 'settings' && (
          <div className="animate-fade-in" style={{ maxWidth: '640px' }}>
            <div className="glass-card-static" style={{ padding: '2rem', border: '1px solid rgba(234, 179, 8, 0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <Crown size={36} style={{ color: '#eab308' }} />
                <div>
                  <h3 style={{ margin: 0, color: 'white' }}>{user?.name || 'Platform Owner'}</h3>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#a1a1aa', fontSize: '0.85rem' }}>{user?.email}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '1rem', fontSize: '0.9rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a1a1aa' }}>Owner ID</span>
                  <span style={{ fontFamily: 'monospace', color: '#fde047', fontWeight: 'bold' }}>{user?.adminId || 'MAVI-OWNER-001'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a1a1aa' }}>Global Authority Scope</span>
                  <span style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>Full Platform Governance</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#a1a1aa' }}>Multi-Tenant Control</span>
                  <span className="badge badge-primary">Super-Tenant Unrestricted</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <VoluntaryChangePasswordForm />
            </div>
          </div>
        )}

        {/* ── MODALS ──────────────────────────────────────────────────────── */}

        {/* Provision Tenant Modal */}
        {showCreateInstModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <form onSubmit={handleCreateInstitution} className="glass-card-static" style={{ width: '480px', padding: '2rem', border: '1px solid #eab308' }}>
              <h3 style={{ marginBottom: '1.25rem', color: '#fde047' }}>Provision Customer Institution (Tenant)</h3>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Institution Name *</label>
                  <input type="text" className="input-field" placeholder="e.g. Zeal College of Engineering" value={newInst.name} onChange={(e) => setNewInst({ ...newInst, name: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Short Name</label>
                    <input type="text" className="input-field" placeholder="e.g. ZEAL" value={newInst.shortName} onChange={(e) => setNewInst({ ...newInst, shortName: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Domain</label>
                    <input type="text" className="input-field" placeholder="zeal.edu.in" value={newInst.officialDomain} onChange={(e) => setNewInst({ ...newInst, officialDomain: e.target.value })} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">SaaS License Plan</label>
                  <select className="input-field" value={newInst.plan} onChange={(e) => setNewInst({ ...newInst, plan: e.target.value })}>
                    <option value="BASIC">Basic (Standard Verification)</option>
                    <option value="PRO">Pro (Full Placement & Analytics)</option>
                    <option value="ENTERPRISE">Enterprise (Custom SLA & API)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowCreateInstModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#eab308', borderColor: '#eab308', color: '#09090b', fontWeight: 'bold' }} disabled={submitting}>
                  {submitting ? 'Provisioning...' : 'Provision Tenant'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Invite Admin Modal */}
        {showInviteAdminModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
            <form onSubmit={handleInviteAdmin} className="glass-card-static" style={{ width: '540px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', border: '1px solid var(--accent-purple)' }}>
              <h3 style={{ marginBottom: '1.25rem', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={22} /> Invite Platform Administrator
              </h3>

              {inviteResult ? (
                <div style={{ padding: '1.25rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-emerald)', borderRadius: '8px', color: 'var(--accent-emerald)', marginBottom: '1.5rem' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '1rem', margin: 0 }}>✓ Single-Use Administrative Invitation Token Generated!</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    An invitation email has been dispatched. You can also copy the secure single-use invitation link directly below:
                  </p>
                  <div style={{ background: '#09090b', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', wordBreak: 'break-all', fontFamily: 'monospace', margin: '0.75rem 0', border: '1px solid var(--border-subtle)', color: '#c084fc' }}>
                    {inviteResult.invitationLink}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(inviteResult.invitationLink);
                        toast.info('Invitation link copied to clipboard!');
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ background: '#a78bfa', borderColor: '#a78bfa' }}
                    >
                      Copy Invitation Link
                    </button>
                    <button type="button" onClick={() => { setInviteResult(null); setShowInviteAdminModal(false); }} className="btn btn-outline btn-sm">
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                      <label className="input-label">Full Name *</label>
                      <input type="text" className="input-field" value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} required />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Official Email *</label>
                      <input type="email" className="input-field" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                      <label className="input-label">Management Scope *</label>
                      <select
                        className="input-field"
                        value={newAdmin.scope}
                        onChange={(e) => setNewAdmin({ ...newAdmin, scope: e.target.value, institutionId: e.target.value === 'PLATFORM' ? '' : newAdmin.institutionId })}
                        required
                      >
                        <option value="INSTITUTION">INSTITUTION (Tenant-wide)</option>
                        <option value="DEPARTMENT">DEPARTMENT (Department-specific)</option>
                        <option value="PLATFORM">PLATFORM (Global Scope)</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Administrative Role *</label>
                      <select className="input-field" value={newAdmin.role} onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })} required>
                        <option value="institution_admin">Institution Admin</option>
                        <option value="department_admin">Department Admin</option>
                        <option value="placement_admin">Placement & TPO Admin</option>
                        <option value="academic_admin">Academic & Exam Admin</option>
                        <option value="student_affairs_admin">Student Affairs Admin</option>
                        <option value="finance_admin">Finance & Billing Admin</option>
                        <option value="training_admin">Training & Development Admin</option>
                      </select>
                    </div>
                  </div>

                  {newAdmin.scope !== 'PLATFORM' && (
                    <div className="input-group">
                      <label className="input-label">Target Institution *</label>
                      <select className="input-field" value={newAdmin.institutionId} onChange={(e) => setNewAdmin({ ...newAdmin, institutionId: e.target.value })} required>
                        <option value="">Select College / Institution...</option>
                        {institutions.map((inst) => (
                          <option key={inst._id} value={inst._id}>
                            {inst.name} ({inst.tenantId})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {newAdmin.scope === 'DEPARTMENT' && (
                    <div className="input-group">
                      <label className="input-label">Target Department *</label>
                      <select className="input-field" value={newAdmin.departmentId} onChange={(e) => setNewAdmin({ ...newAdmin, departmentId: e.target.value })} required>
                        <option value="">Select Department...</option>
                        {availableDepartments.map((dept) => (
                          <option key={dept._id} value={dept._id}>
                            {dept.name} ({dept.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="input-group">
                    <label className="input-label">Designation / Title</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Head of Placement, HOD CSE"
                      value={newAdmin.designation}
                      onChange={(e) => setNewAdmin({ ...newAdmin, designation: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {!inviteResult && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setShowInviteAdminModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#a78bfa', borderColor: '#a78bfa' }} disabled={submitting}>
                    {submitting ? 'Generating...' : 'Dispatch Invitation Email'}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* ── MODAL 3: CREATE / EDIT SAAS PLAN (Sole Owner Authority) ─────────── */}
        {showPlanModal && (
          <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <form onSubmit={handleSavePlan} className="glass-card animate-fade-in" style={{ maxWidth: '520px', width: '100%', padding: '2rem', border: '1px solid var(--accent-purple)' }}>
              <h3 style={{ margin: '0 0 0.5rem', color: '#fde047', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Crown size={22} /> {editingPlan ? `Edit SaaS Plan (v${editingPlan.version + 1} Preview)` : 'Create Commercial SaaS Plan'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                {editingPlan ? 'Modifying price or limits will increment the plan version snapshot. Existing subscriptions retain historical price.' : 'Define official plan tier and entitlements for the platform catalog.'}
              </p>

              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Plan Name *</label>
                  <input type="text" className="input-field" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="e.g. Professional Institutional Plan" required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Plan Code *</label>
                    <select className="input-field" value={planForm.code} onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })} disabled={Boolean(editingPlan)} required>
                      <option value="BASIC">BASIC</option>
                      <option value="PRO">PRO</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                      <option value="CUSTOM">CUSTOM</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Price (INR / Annual) *</label>
                    <input type="number" className="input-field" value={planForm.priceAmount} onChange={(e) => setPlanForm({ ...planForm, priceAmount: e.target.value })} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className="input-group">
                    <label className="input-label">Student Cap</label>
                    <input type="number" className="input-field" value={planForm.maxStudents} onChange={(e) => setPlanForm({ ...planForm, maxStudents: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Faculty Cap</label>
                    <input type="number" className="input-field" value={planForm.maxTeachers} onChange={(e) => setPlanForm({ ...planForm, maxTeachers: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Dept Cap</label>
                    <input type="number" className="input-field" value={planForm.maxDepartments} onChange={(e) => setPlanForm({ ...planForm, maxDepartments: e.target.value })} />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Description / Entitlements</label>
                  <textarea className="input-field" rows="2" value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} placeholder="Target institution tier and feature highlights..." />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowPlanModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? 'Saving...' : editingPlan ? 'Save & Increment Version' : 'Create & Publish Plan'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </PlatformOwnerLayout>
  );
};

export default PlatformOwnerDashboard;
