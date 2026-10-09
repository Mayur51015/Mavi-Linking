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
import UserLifecycleTable from '../../components/admin/UserLifecycleTable';
import UserLifecycleModal from '../../components/admin/UserLifecycleModal';

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
    platformName: 'EduTalentX',
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
  const [inviteDeliveryResult, setInviteDeliveryResult] = useState(null);
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

  // Administrator Lifecycle State
  const [selectedAdminForLifecycle, setSelectedAdminForLifecycle] = useState(null);
  const [adminLifecycleModalType, setAdminLifecycleModalType] = useState(null);
  const [adminActionLoading, setAdminActionLoading] = useState(false);

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
      const emailWasSent = res.data?.emailSent ?? res.data?.data?.emailSent ?? true;
      setInviteDeliveryResult({
        email: newAdmin.email,
        name: newAdmin.name,
        emailSent: emailWasSent,
      });
      if (emailWasSent) {
        toast.success(`Administrator created. Invitation email sent to ${newAdmin.email}.`);
      } else {
        toast.warning(`Administrator created, but invitation email could not be sent to ${newAdmin.email}.`);
      }
      setNewAdmin({
        name: '',
        email: '',
        role: 'institution_admin',
        scope: 'INSTITUTION',
        institutionId: '',
        departmentId: '',
        permissions: ['STUDENT_VIEW', 'STUDENT_APPROVE', 'STUDENT_PROFILE_MANAGE'],
        designation: 'Administrator',
      });
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

  const handleAdminLifecycleSubmit = async (formData) => {
    if (!selectedAdminForLifecycle || !adminLifecycleModalType) return;
    setAdminActionLoading(true);
    try {
      if (adminLifecycleModalType === 'permanent_delete') {
        await api.delete(`/admin/users/${selectedAdminForLifecycle._id}/permanent`, { data: formData });
        toast.success(`Admin account ${selectedAdminForLifecycle.email} permanently deleted.`);
      } else if (adminLifecycleModalType === 'suspend') {
        await api.post(`/admin/users/${selectedAdminForLifecycle._id}/suspend`, formData);
        toast.success(`Admin account ${selectedAdminForLifecycle.email} suspended.`);
      } else if (adminLifecycleModalType === 'deactivate') {
        await api.post(`/admin/users/${selectedAdminForLifecycle._id}/deactivate`, formData);
        toast.success(`Admin account ${selectedAdminForLifecycle.email} deactivated.`);
      } else if (adminLifecycleModalType === 'reactivate') {
        await api.post(`/admin/users/${selectedAdminForLifecycle._id}/reactivate`, formData);
        toast.success(`Admin account ${selectedAdminForLifecycle.email} reactivated.`);
      } else if (adminLifecycleModalType === 'edit') {
        await api.put(`/admin/users/${selectedAdminForLifecycle._id}`, formData);
        toast.success(`Admin profile for ${selectedAdminForLifecycle.email} updated.`);
      }
      setSelectedAdminForLifecycle(null);
      setAdminLifecycleModalType(null);
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Admin lifecycle action failed.'));
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleResendInvite = async (adminId) => {
    try {
      const res = await api.post(`/owner/admins/${adminId}/resend-invite`);
      if (res.data?.emailSent || res.data?.data?.emailSent) {
        toast.success('New 24-hour administrator invitation email dispatched successfully.');
      } else {
        toast.warning('Admin invitation updated, but email could not be sent.');
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
      u.etxId?.toLowerCase().includes(userSearch.toLowerCase()) ||
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
      <div style={{ maxWidth: '1280px', margin: '0 auto', color: '#111111', padding: '1.5rem' }}>
        
        {/* Top Header Control Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#111111' }}>
                <Crown style={{ color: '#2563EB' }} size={26} />
                Platform Owner Control Console
              </h2>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE' }}>
                Sole Commercial Authority
              </span>
            </div>
            <p style={{ color: '#4B5563', margin: '0.35rem 0 0 0', fontSize: '0.875rem' }}>
              Master multi-tenant SaaS governance, global tenant isolation, licensing & configuration.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            <button onClick={loadData} className="btn btn-outline" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync Data
            </button>
            <button onClick={() => setShowCreateInstModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
              <Plus size={16} /> Provision Tenant
            </button>
            <button onClick={() => setShowInviteAdminModal(true)} className="btn btn-outline" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
              <UserCheck size={16} /> Invite Institution Admin
            </button>
          </div>
        </div>

        {/* ── TAB 1: OVERVIEW ──────────────────────────────────────────────── */}
        {currentTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500, marginBottom: '0.25rem' }}>Provisioned Tenants</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0', color: '#111111' }}>{stats?.totalInstitutions || institutions.length}</div>
                <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 500 }}>Active College Organizations</div>
              </div>

              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500, marginBottom: '0.25rem' }}>Institution Administrators</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0', color: '#111111' }}>{stats?.totalAdmins || admins.length}</div>
                <div style={{ fontSize: '0.75rem', color: '#4B5563' }}>Scoped Administrative Accounts</div>
              </div>

              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500, marginBottom: '0.25rem' }}>Total Platform Users</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0', color: '#111111' }}>{stats?.totalUsers || users.length}</div>
                <div style={{ fontSize: '0.75rem', color: '#4B5563' }}>Students, Teachers & Recruiters</div>
              </div>

              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500, marginBottom: '0.25rem' }}>Security Events</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0', color: '#111111' }}>{stats?.totalSecurityEvents || securityEvents.length}</div>
                <div style={{ fontSize: '0.75rem', color: '#4B5563' }}>Audit Log Records</div>
              </div>
            </div>

            {/* Active Tenants Overview */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem', marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#111111', fontSize: '1.0625rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={18} style={{ color: '#2563EB' }} /> Active Multi-Tenant Organizations
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontSize: '0.8125rem' }}>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Tenant ID</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Institution Name</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Domain</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>SaaS Plan</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {institutions.slice(0, 5).map((inst) => (
                      <tr key={inst._id} style={{ borderBottom: '1px solid #E5E7EB', color: '#111111' }}>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#111111', fontWeight: 600 }}>
                          {inst.tenantId || `INST-${inst._id.slice(-6).toUpperCase()}`}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{inst.name}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#4B5563' }}>{inst.officialDomain || inst.domain || 'N/A'}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ display: 'inline-block', padding: '0.15rem 0.45rem', fontSize: '0.7rem', fontWeight: 600, borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE' }}>{inst.plan || 'PRO'}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ display: 'inline-block', padding: '0.15rem 0.45rem', fontSize: '0.7rem', fontWeight: 600, borderRadius: '4px', background: inst.status === 'suspended' ? '#FEF2F2' : '#ECFDF5', color: inst.status === 'suspended' ? '#991B1B' : '#065F46', border: `1px solid ${inst.status === 'suspended' ? '#FCA5A5' : '#A7F3D0'}`, textTransform: 'capitalize' }}>
                            {inst.status || 'active'}
                          </span>
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
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '600px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                  <input
                    type="text"
                    className="input-field"
                    style={{ paddingLeft: '2.5rem', marginBottom: 0, background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }}
                    placeholder="Search by Tenant ID, Name, or Domain..."
                    value={tenantSearch}
                    onChange={(e) => setTenantSearch(e.target.value)}
                  />
                </div>
                <select className="input-field" style={{ width: '160px', marginBottom: 0, background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={tenantFilter} onChange={(e) => setTenantFilter(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <button onClick={() => setShowCreateInstModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
                <Plus size={16} /> Provision Tenant
              </button>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontSize: '0.8125rem' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Tenant ID</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Institution Name</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Official Domain</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>SaaS Plan</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstitutions.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>No customer tenant institutions found matching filter.</td></tr>
                  ) : (
                    filteredInstitutions.map((inst) => (
                      <tr key={inst._id} style={{ borderBottom: '1px solid #E5E7EB', color: '#111111' }}>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#111111', fontWeight: 600 }}>
                          {inst.tenantId}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{inst.name}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#4B5563' }}>{inst.officialDomain || inst.domain || 'N/A'}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ display: 'inline-block', padding: '0.15rem 0.45rem', fontSize: '0.7rem', fontWeight: 600, borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE' }}>{inst.plan || 'PRO'}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ display: 'inline-block', padding: '0.15rem 0.45rem', fontSize: '0.7rem', fontWeight: 600, borderRadius: '4px', background: inst.status === 'suspended' ? '#FEF2F2' : '#ECFDF5', color: inst.status === 'suspended' ? '#991B1B' : '#065F46', border: `1px solid ${inst.status === 'suspended' ? '#FCA5A5' : '#A7F3D0'}`, textTransform: 'capitalize' }}>
                            {inst.status || 'active'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <button
                            onClick={() => handleToggleTenantStatus(inst._id, inst.status)}
                            className="btn btn-sm btn-outline"
                            style={{ fontSize: '0.75rem', background: '#FFFFFF', borderColor: '#E5E7EB', color: inst.status === 'suspended' ? '#059669' : '#DC2626' }}
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
        )}

        {/* ── TAB 3: ADMIN MANAGEMENT ──────────────────────────────────────── */}
        {currentTab === 'admins' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem', marginBottom: 0, background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }}
                  placeholder="Search by Admin ID, Name, Email..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                />
              </div>

              <button onClick={() => setShowInviteAdminModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
                <UserCheck size={16} /> Invite Institution Admin
              </button>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontSize: '0.8125rem' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Admin ID</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Administrator Name</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Email</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Role & Scope</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Assigned Tenant / Dept</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Account Status</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmins.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>No institution administrators found.</td></tr>
                  ) : (
                    filteredAdmins.map((adm) => {
                      const status = adm.accountStatus || (adm.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE');
                      return (
                        <tr key={adm._id} style={{ borderBottom: '1px solid #E5E7EB', color: '#111111' }}>
                          <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#111111', fontWeight: 600 }}>
                            {adm.adminId || adm.etxId}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                            <div>{adm.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{adm.designation || 'Administrator'}</div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#4B5563' }}>{adm.email}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                              <span style={{ display: 'inline-block', padding: '0.15rem 0.45rem', fontSize: '0.68rem', fontWeight: 600, borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE', textTransform: 'uppercase' }}>
                                {adm.role?.replace(/_/g, ' ')}
                              </span>
                              <span style={{ display: 'inline-block', padding: '0.15rem 0.45rem', fontSize: '0.68rem', fontWeight: 500, borderRadius: '4px', background: '#F3F4F6', color: '#4B5563', border: '1px solid #E5E7EB' }}>
                                {adm.adminScope || 'INSTITUTION'}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            {adm.institutionId ? (
                              <div>
                                <span style={{ color: '#111111', fontWeight: 600 }}>{adm.institutionId.name}</span>
                                {adm.departmentId && <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Dept: {adm.departmentId.name}</div>}
                              </div>
                            ) : (
                              <span style={{ color: '#9CA3AF' }}>Global Scoped</span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
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
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => handleResendInvite(adm._id)}
                                className="btn btn-sm btn-outline"
                                title="Resend 24-Hour Invitation / Setup Email"
                                style={{ fontSize: '0.75rem', background: '#FFFFFF', borderColor: '#E5E7EB', color: '#2563EB' }}
                              >
                                Resend Invite
                              </button>
                              {status === 'INVITED' && (
                                <button onClick={() => handleRevokeInvite(adm._id)} className="btn btn-sm btn-outline" style={{ fontSize: '0.75rem', background: '#FFFFFF', borderColor: '#E5E7EB', color: '#DC2626' }}>
                                  Revoke
                                </button>
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
                                    style={{ fontSize: '0.75rem', background: '#FFFFFF', borderColor: '#E5E7EB', color: '#D97706' }}
                                  >
                                    Convert to Student
                                  </button>
                                  <button onClick={() => handleSuspendAdmin(adm._id)} className="btn btn-sm btn-outline" style={{ fontSize: '0.75rem', background: '#FFFFFF', borderColor: '#E5E7EB', color: '#DC2626' }}>
                                    Suspend
                                  </button>
                                </>
                              )}
                              {status === 'SUSPENDED' && (
                                <button onClick={() => handleReactivateAdmin(adm._id)} className="btn btn-sm btn-outline" style={{ fontSize: '0.75rem', background: '#FFFFFF', borderColor: '#E5E7EB', color: '#059669' }}>
                                  Reactivate
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedAdminForLifecycle(adm);
                                  setAdminLifecycleModalType('permanent_delete');
                                }}
                                className="btn btn-sm btn-outline"
                                style={{ fontSize: '0.75rem', background: '#FFFFFF', borderColor: '#E5E7EB', color: '#DC2626' }}
                              >
                                Delete
                              </button>
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
        )}

        {/* ── TAB 4: PLATFORM USERS ───────────────────────────────────────── */}
        {currentTab === 'users' && (
          <div>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem', marginBottom: 0, background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }}
                  placeholder="Search by ETX ID, PRN, Name, Email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>

              <select className="input-field" style={{ width: '180px', marginBottom: 0, background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
                <option value="all">All Roles</option>
                <option value="student">Student / User</option>
                <option value="teacher">Teacher / Professor</option>
                <option value="recruiter">Recruiter</option>
                <option value="institution_admin">Institution Admin</option>
              </select>
            </div>

            <UserLifecycleTable
              users={filteredUsers}
              institutions={institutions}
              onRefresh={loadData}
              loading={loading}
              currentUserRole="platform_owner"
            />
          </div>
        )}

        {/* ── TAB 5: LICENSING ────────────────────────────────────────────── */}
        {currentTab === 'licensing' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500, marginBottom: '0.25rem' }}>TOTAL LICENSES</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111111' }}>{licenses.length}</div>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500, marginBottom: '0.25rem' }}>ENTERPRISE LICENSES</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111111' }}>{licenses.filter(l => l.plan === 'ENTERPRISE').length}</div>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500, marginBottom: '0.25rem' }}>ACTIVE LICENSES</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#059669' }}>{licenses.filter(l => l.licenseStatus === 'active').length}</div>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#111111', fontSize: '1.0625rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={18} style={{ color: '#2563EB' }} /> Tenant SaaS Licensing Contracts
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontSize: '0.8125rem' }}>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Tenant ID</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Institution Name</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>SaaS Plan</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>User Cap Limit</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>License Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {licenses.map((lic) => (
                      <tr key={lic._id} style={{ borderBottom: '1px solid #E5E7EB', color: '#111111' }}>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#111111', fontWeight: 600 }}>{lic.tenantId}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{lic.institutionName}</td>
                        <td style={{ padding: '0.75rem 1rem' }}><span style={{ display: 'inline-block', padding: '0.15rem 0.45rem', fontSize: '0.7rem', fontWeight: 600, borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE' }}>{lic.plan}</span></td>
                        <td style={{ padding: '0.75rem 1rem', color: '#4B5563' }}>{lic.userLimit?.toLocaleString()} Users</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#059669', fontWeight: 600, textTransform: 'capitalize' }}>{lic.licenseStatus}</td>
                      </tr>
                    ))}
                    {licenses.length === 0 && (
                      <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>No licensing records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 6: SUBSCRIPTIONS & COMMERCIAL SAAS PRICING GOVERNANCE ───── */}
        {currentTab === 'subscriptions' && (
          <div>
            {/* Global Billing Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500, marginBottom: '0.25rem' }}>TOTAL SAAS REVENUE</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111111' }}>₹{(ownerBilling?.metrics?.totalRevenue || 0).toLocaleString()}</div>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500, marginBottom: '0.25rem' }}>ACTIVE SUBSCRIPTIONS</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111111' }}>{ownerBilling?.metrics?.activeSubscriptions || subscriptions.length}</div>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500, marginBottom: '0.25rem' }}>SUCCESSFUL TRANSACTIONS</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#059669' }}>{ownerBilling?.metrics?.successfulPaymentsCount || 0}</div>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500, marginBottom: '0.25rem' }}>FAILED PAYMENTS</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#DC2626' }}>{ownerBilling?.metrics?.failedPaymentsCount || 0}</div>
              </div>
            </div>

            {/* Section 1: Commercial SaaS Plan Catalog (Sole Owner Pricing Authority) */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#111111', fontSize: '1.0625rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Crown size={18} style={{ color: '#2563EB' }} /> SaaS Catalog Pricing Management (Owner Sole Authority)
                  </h3>
                  <p style={{ color: '#4B5563', fontSize: '0.8125rem', margin: '0.25rem 0 0' }}>
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
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}
                >
                  <Plus size={16} /> Create SaaS Plan
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontSize: '0.8125rem' }}>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Plan Name & Code</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Version</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Official Price</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Student Cap</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Faculty Cap</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownerPlans.length === 0 ? (
                      <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>No SaaS plans created yet. Click 'Create SaaS Plan' to add.</td></tr>
                    ) : (
                      ownerPlans.map((plan) => (
                        <tr key={plan._id} style={{ borderBottom: '1px solid #E5E7EB', color: '#111111' }}>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ fontWeight: 600, color: '#111111' }}>{plan.name}</div>
                            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#6B7280' }}>{plan.code}</div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#4B5563' }}>v{plan.version}</span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#111111' }}>
                            ₹{plan.price?.amount?.toLocaleString()} {plan.price?.currency}/yr
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#4B5563' }}>
                            {plan.limits?.maxStudents?.toLocaleString() || 500}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#4B5563' }}>
                            {plan.limits?.maxTeachers || 50}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ display: 'inline-block', padding: '0.15rem 0.45rem', fontSize: '0.7rem', fontWeight: 600, borderRadius: '4px', background: plan.status === 'ACTIVE' ? '#ECFDF5' : plan.status === 'DRAFT' ? '#FFFBEB' : '#FEF2F2', color: plan.status === 'ACTIVE' ? '#065F46' : plan.status === 'DRAFT' ? '#92400E' : '#991B1B', border: `1px solid ${plan.status === 'ACTIVE' ? '#A7F3D0' : plan.status === 'DRAFT' ? '#FDE68A' : '#FCA5A5'}` }}>
                              {plan.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
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
                                style={{ fontSize: '0.75rem', background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }}
                              >
                                Edit Price / Version
                              </button>
                              {plan.status === 'ACTIVE' ? (
                                <button onClick={() => handleSetPlanStatus(plan._id, 'INACTIVE')} className="btn btn-sm btn-outline" style={{ fontSize: '0.75rem', background: '#FFFFFF', borderColor: '#E5E7EB', color: '#D97706' }}>
                                  Unpublish
                                </button>
                              ) : (
                                <button onClick={() => handleSetPlanStatus(plan._id, 'ACTIVE')} className="btn btn-sm btn-outline" style={{ fontSize: '0.75rem', background: '#FFFFFF', borderColor: '#E5E7EB', color: '#059669' }}>
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
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#111111', fontSize: '1.0625rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={18} style={{ color: '#2563EB' }} /> Multi-Tenant Institutional Subscriptions & Payment Ledger
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontSize: '0.8125rem' }}>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Tenant ID</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Institution Name</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Plan Tier & Version</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Price Snapshot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ownerBilling?.subscriptions || subscriptions).map((sub, i) => (
                      <tr key={sub.id || sub._id || i} style={{ borderBottom: '1px solid #E5E7EB', color: '#111111' }}>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#111111', fontWeight: 600 }}>{sub.tenantId || 'INST'}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{sub.institution || sub.institutionName || 'Institution'}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ display: 'inline-block', padding: '0.15rem 0.45rem', fontSize: '0.7rem', fontWeight: 600, borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE' }}>{sub.planCode || sub.plan || 'PRO'}</span>
                          <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', color: '#6B7280' }}>v{sub.planVersion || 1}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ display: 'inline-block', padding: '0.15rem 0.45rem', fontSize: '0.7rem', fontWeight: 600, borderRadius: '4px', background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>
                            {sub.status || sub.subscriptionStatus || 'ACTIVE'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#111111' }}>
                          ₹{(sub.priceSnapshot?.amount || sub.amount || 149999).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {(ownerBilling?.subscriptions || subscriptions).length === 0 && (
                      <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>No institutional subscriptions found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 7: GLOBAL ANALYTICS ─────────────────────────────────────── */}
        {currentTab === 'analytics' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500, marginBottom: '0.25rem' }}>Total Platform Users</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111111' }}>{analytics?.totalUsers || 0}</div>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500, marginBottom: '0.25rem' }}>Students</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111111' }}>{analytics?.studentsCount || 0}</div>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500, marginBottom: '0.25rem' }}>Teachers & Professors</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111111' }}>{analytics?.teachersCount || 0}</div>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500, marginBottom: '0.25rem' }}>Recruiters</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111111' }}>{analytics?.recruitersCount || 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 8: SECURITY CENTER ──────────────────────────────────────── */}
        {currentTab === 'security' && (
          <div>
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#111111', fontSize: '1.0625rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={18} style={{ color: '#2563EB' }} /> Security & Audit Feed
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontSize: '0.8125rem' }}>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Timestamp</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Action</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Actor</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>IP Address</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityEvents.map((evt) => (
                      <tr key={evt._id} style={{ borderBottom: '1px solid #E5E7EB', color: '#111111' }}>
                        <td style={{ padding: '0.75rem 1rem', color: '#4B5563', fontSize: '0.8125rem' }}>{new Date(evt.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#DC2626' }}>{evt.action}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{evt.userId?.name || evt.userId?.email || 'System'}</td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#6B7280', fontSize: '0.8125rem' }}>{evt.ipAddress || '127.0.0.1'}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#4B5563' }}>{evt.details}</td>
                      </tr>
                    ))}
                    {securityEvents.length === 0 && (
                      <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>No security events logged.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 9: SYSTEM CONFIGURATION ─────────────────────────────────── */}
        {currentTab === 'system' && (
          <div>
            <form onSubmit={handleSaveSystemConfig} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.5rem', maxWidth: '720px' }}>
              <h3 style={{ marginBottom: '1.5rem', color: '#111111', fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={20} style={{ color: '#2563EB' }} /> Platform Global System Configuration
              </h3>

              <div style={{ display: 'grid', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Platform Name</label>
                  <input
                    type="text"
                    className="input-field"
                    style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }}
                    value={systemConfig.platformName}
                    onChange={(e) => setSystemConfig({ ...systemConfig, platformName: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Max Tenant Capacity Limit</label>
                    <input
                      type="number"
                      className="input-field"
                      style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }}
                      value={systemConfig.maxTenantLimit}
                      onChange={(e) => setSystemConfig({ ...systemConfig, maxTenantLimit: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Session Timeout (Minutes)</label>
                    <input
                      type="number"
                      className="input-field"
                      style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }}
                      value={systemConfig.defaultSessionTimeoutMinutes}
                      onChange={(e) => setSystemConfig({ ...systemConfig, defaultSessionTimeoutMinutes: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.875rem', color: '#111111' }}>
                    <input
                      type="checkbox"
                      checked={systemConfig.allowSelfRegistration}
                      onChange={(e) => setSystemConfig({ ...systemConfig, allowSelfRegistration: e.target.checked })}
                    />
                    <span>Allow Self Registration for Students/Teachers</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.875rem', color: '#111111' }}>
                    <input
                      type="checkbox"
                      checked={systemConfig.requirePrnVerification}
                      onChange={(e) => setSystemConfig({ ...systemConfig, requirePrnVerification: e.target.checked })}
                    />
                    <span>Require Institutional PRN Verification for Student Login</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.875rem', color: '#DC2626' }}>
                    <input
                      type="checkbox"
                      checked={systemConfig.maintenanceMode}
                      onChange={(e) => setSystemConfig({ ...systemConfig, maintenanceMode: e.target.checked })}
                    />
                    <span>Enable Global Platform Maintenance Mode</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '0.625rem 1.5rem', fontSize: '0.875rem' }} disabled={submitting}>
                {submitting ? 'Saving Configuration...' : 'Save Platform Configuration'}
              </button>
            </form>
          </div>
        )}

        {/* ── TAB 10: GLOBAL AUDIT LOGS ───────────────────────────────────── */}
        {currentTab === 'audit' && (
          <div>
            <div style={{ marginBottom: '1.25rem', maxWidth: '400px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: '2.5rem', marginBottom: 0, background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }}
                placeholder="Search audit logs by action or IP..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
              />
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontSize: '0.8125rem' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Timestamp</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Action</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Actor</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>IP Address</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditLogs.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>No security audit logs found.</td></tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log._id} style={{ borderBottom: '1px solid #E5E7EB', color: '#111111' }}>
                        <td style={{ padding: '0.75rem 1rem', color: '#4B5563', fontSize: '0.8125rem' }}>{new Date(log.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#111111' }}>{log.action}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{log.userId?.name || log.userId?.email || 'Platform Owner'}</td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#6B7280', fontSize: '0.8125rem' }}>{log.ipAddress || '127.0.0.1'}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#4B5563' }}>{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 11: OWNER SETTINGS ──────────────────────────────────────── */}
        {currentTab === 'settings' && (
          <div style={{ maxWidth: '640px' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                  <Crown size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#111111', fontSize: '1.125rem', fontWeight: 600 }}>{user?.name || 'Platform Owner'}</h3>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#6B7280', fontSize: '0.875rem' }}>{user?.email}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.875rem', borderTop: '1px solid #E5E7EB', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#4B5563' }}>Owner ID</span>
                  <span style={{ fontFamily: 'monospace', color: '#111111', fontWeight: 600 }}>{user?.adminId || 'ETX-OWNER-001'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#4B5563' }}>Global Authority Scope</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>Full Platform Governance</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#4B5563' }}>Multi-Tenant Control</span>
                  <span style={{ display: 'inline-block', padding: '0.15rem 0.45rem', fontSize: '0.7rem', fontWeight: 600, borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #DBEAFE' }}>Super-Tenant Unrestricted</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <VoluntaryChangePasswordForm />
            </div>
          </div>
        )}

        {/* ── MODALS ──────────────────────────────────────────────────────── */}

        {/* Provision Tenant Modal */}
        {showCreateInstModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
            <form onSubmit={handleCreateInstitution} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '480px', padding: '1.5rem', color: '#111111' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', color: '#111111', fontSize: '1.125rem', fontWeight: 600 }}>Provision Customer Institution (Tenant)</h3>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Institution Name *</label>
                  <input type="text" className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} placeholder="e.g. Zeal College of Engineering" value={newInst.name} onChange={(e) => setNewInst({ ...newInst, name: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Short Name</label>
                    <input type="text" className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} placeholder="e.g. ZEAL" value={newInst.shortName} onChange={(e) => setNewInst({ ...newInst, shortName: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Domain</label>
                    <input type="text" className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} placeholder="zeal.edu.in" value={newInst.officialDomain} onChange={(e) => setNewInst({ ...newInst, officialDomain: e.target.value })} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>SaaS License Plan</label>
                  <select className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={newInst.plan} onChange={(e) => setNewInst({ ...newInst, plan: e.target.value })}>
                    <option value="BASIC">Basic (Standard Verification)</option>
                    <option value="PRO">Pro (Full Placement & Analytics)</option>
                    <option value="ENTERPRISE">Enterprise (Custom SLA & API)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreateInstModal(false)} className="btn btn-outline" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111', fontSize: '0.875rem' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.875rem' }} disabled={submitting}>
                  {submitting ? 'Provisioning...' : 'Provision Tenant'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Invite Admin Modal */}
        {showInviteAdminModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
            <form onSubmit={handleInviteAdmin} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', color: '#111111' }}>
              {!inviteDeliveryResult && (
                <h3 style={{ margin: '0 0 1.25rem 0', color: '#111111', fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserCheck size={20} style={{ color: '#2563EB' }} /> Invite Platform Administrator
                </h3>
              )}

              {inviteDeliveryResult ? (
                <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                  {inviteDeliveryResult.emailSent ? (
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <CheckCircle size={28} />
                    </div>
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <AlertTriangle size={28} />
                    </div>
                  )}

                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: inviteDeliveryResult.emailSent ? '#065F46' : '#991B1B' }}>
                    {inviteDeliveryResult.emailSent ? 'Administrator Invitation Sent' : 'Administrator Created — Email Failed'}
                  </h3>

                  <p style={{ color: '#4B5563', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                    The administrator account for <strong style={{ color: '#111111' }}>{inviteDeliveryResult.name || 'the administrator'}</strong> has been created successfully.
                  </p>

                  <div style={{ background: '#F8F9FA', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #E5E7EB', margin: '0.75rem 0 1.25rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.2rem' }}>
                      {inviteDeliveryResult.emailSent ? 'An invitation email has been sent to:' : 'Failed to deliver invitation email to:'}
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111111', wordBreak: 'break-all' }}>
                      {inviteDeliveryResult.email}
                    </div>
                  </div>

                  <p style={{ color: '#4B5563', fontSize: '0.8125rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                    {inviteDeliveryResult.emailSent
                      ? 'The recipient can complete account setup and configure their credentials using the secure link in their email.'
                      : 'The administrator record was saved, but the email delivery encountered an error. You can resend the invitation at any time from Admin Management.'}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setInviteDeliveryResult(null);
                      setShowInviteAdminModal(false);
                    }}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.625rem', fontSize: '0.875rem' }}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                      <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Full Name *</label>
                      <input type="text" className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} required />
                    </div>
                    <div className="input-group">
                      <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Official Email *</label>
                      <input type="email" className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                      <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Management Scope *</label>
                      <select
                        className="input-field"
                        style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }}
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
                      <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Administrative Role *</label>
                      <select className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={newAdmin.role} onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })} required>
                        <option value="institution_admin">Institution Admin</option>
                        <option value="super_admin">Platform Super Admin</option>
                        <option value="admin">Platform Operations Admin</option>
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
                      <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Target Institution *</label>
                      <select className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={newAdmin.institutionId} onChange={(e) => setNewAdmin({ ...newAdmin, institutionId: e.target.value })} required>
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
                      <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Target Department *</label>
                      <select className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={newAdmin.departmentId} onChange={(e) => setNewAdmin({ ...newAdmin, departmentId: e.target.value })} required>
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
                    <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Designation / Title</label>
                    <input
                      type="text"
                      className="input-field"
                      style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }}
                      placeholder="e.g. Head of Placement, HOD CSE"
                      value={newAdmin.designation}
                      onChange={(e) => setNewAdmin({ ...newAdmin, designation: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {!inviteDeliveryResult && (
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowInviteAdminModal(false)} className="btn btn-outline" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111', fontSize: '0.875rem' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ fontSize: '0.875rem' }} disabled={submitting}>
                    {submitting ? 'Dispatching...' : 'Dispatch Invitation Email'}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* ── MODAL 3: CREATE / EDIT SAAS PLAN (Sole Owner Authority) ─────────── */}
        {showPlanModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <form onSubmit={handleSavePlan} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', maxWidth: '520px', width: '100%', padding: '1.5rem', color: '#111111' }}>
              <h3 style={{ margin: '0 0 0.5rem', color: '#111111', fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Crown size={20} style={{ color: '#2563EB' }} /> {editingPlan ? `Edit SaaS Plan (v${editingPlan.version + 1} Preview)` : 'Create Commercial SaaS Plan'}
              </h3>
              <p style={{ color: '#4B5563', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
                {editingPlan ? 'Modifying price or limits will increment the plan version snapshot. Existing subscriptions retain historical price.' : 'Define official plan tier and entitlements for the platform catalog.'}
              </p>

              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Plan Name *</label>
                  <input type="text" className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="e.g. Professional Institutional Plan" required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Plan Code *</label>
                    <select className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={planForm.code} onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })} disabled={Boolean(editingPlan)} required>
                      <option value="BASIC">BASIC</option>
                      <option value="PRO">PRO</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                      <option value="CUSTOM">CUSTOM</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Price (INR / Annual) *</label>
                    <input type="number" className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={planForm.priceAmount} onChange={(e) => setPlanForm({ ...planForm, priceAmount: e.target.value })} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className="input-group">
                    <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Student Cap</label>
                    <input type="number" className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={planForm.maxStudents} onChange={(e) => setPlanForm({ ...planForm, maxStudents: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Faculty Cap</label>
                    <input type="number" className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={planForm.maxTeachers} onChange={(e) => setPlanForm({ ...planForm, maxTeachers: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Dept Cap</label>
                    <input type="number" className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} value={planForm.maxDepartments} onChange={(e) => setPlanForm({ ...planForm, maxDepartments: e.target.value })} />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Description / Entitlements</label>
                  <textarea className="input-field" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }} rows="2" value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} placeholder="Target institution tier and feature highlights..." />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowPlanModal(false)} className="btn btn-outline" style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111', fontSize: '0.875rem' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.875rem' }} disabled={submitting}>
                  {submitting ? 'Saving...' : editingPlan ? 'Save & Increment Version' : 'Create & Publish Plan'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── MODAL 4: CONVERT ADMIN TO STUDENT ───────────────────────────── */}
        {showConvertModal && convertingAdmin && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <form onSubmit={handleConvertToStudent} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', maxWidth: '480px', width: '100%', padding: '1.5rem', color: '#111111' }}>
              <h3 style={{ margin: '0 0 0.5rem', color: '#111111', fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} style={{ color: '#D97706' }} /> Convert Admin to Student Role
              </h3>
              <p style={{ color: '#4B5563', fontSize: '0.8125rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Demoting <strong>{convertingAdmin.name}</strong> ({convertingAdmin.email}) will revoke all administrative privileges and convert the account into a verified student profile.
              </p>

              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Institution *</label>
                  <select
                    className="input-field"
                    style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }}
                    value={convertForm.institutionId}
                    onChange={(e) => setConvertForm({ ...convertForm, institutionId: e.target.value, departmentId: '' })}
                    required
                  >
                    <option value="">Select College / Institution...</option>
                    {institutions.map((inst) => (
                      <option key={inst._id} value={inst._id}>{inst.name} ({inst.tenantId || inst.code})</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Department *</label>
                  <select
                    className="input-field"
                    style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }}
                    value={convertForm.departmentId}
                    onChange={(e) => setConvertForm({ ...convertForm, departmentId: e.target.value })}
                    required
                  >
                    <option value="">Select Department...</option>
                    {convertDepartments.map((dept) => (
                      <option key={dept._id} value={dept._id}>{dept.name} ({dept.code})</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Permanent Registration Number (PRN) *</label>
                  <input
                    type="text"
                    className="input-field"
                    style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }}
                    placeholder="e.g. 72023456B"
                    value={convertForm.prn}
                    onChange={(e) => setConvertForm({ ...convertForm, prn: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ color: '#111111', fontWeight: 500, fontSize: '0.875rem' }}>Audit Reason</label>
                  <input
                    type="text"
                    className="input-field"
                    style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111' }}
                    placeholder="Reason for role conversion"
                    value={convertForm.reason}
                    onChange={(e) => setConvertForm({ ...convertForm, reason: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowConvertModal(false);
                    setConvertingAdmin(null);
                  }}
                  className="btn btn-outline"
                  style={{ background: '#FFFFFF', borderColor: '#E5E7EB', color: '#111111', fontSize: '0.875rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#D97706', borderColor: '#D97706', fontSize: '0.875rem' }}
                  disabled={submitting}
                >
                  {submitting ? 'Converting...' : 'Confirm Role Conversion'}
                </button>
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
    </PlatformOwnerLayout>
  );
};

export default PlatformOwnerDashboard;
