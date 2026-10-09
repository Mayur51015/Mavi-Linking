import React, { useState, useEffect } from 'react';
import { Shield, Building, UserPlus, X, Mail, Phone, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';

const DepartmentAdminCreateModal = ({ defaultDepartment, onClose, onSuccess }) => {
  const toast = useToast();
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('Department Administrator');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [institutionName, setInstitutionName] = useState('Zeal College of Engineering & Research');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Load departments for institution scope
    setLoadingDepts(true);
    api.get('/admin/departments')
      .then((res) => {
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setDepartments(list);
        if (defaultDepartment && defaultDepartment._id) {
          setSelectedDepartmentId(defaultDepartment._id);
        } else if (list.length > 0) {
          setSelectedDepartmentId(list[0]._id || list[0].id);
        }
      })
      .catch((err) => {
        toast.error(getErrorMessage(err, 'Failed to load institution departments.'));
      })
      .finally(() => setLoadingDepts(false));
  }, [defaultDepartment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !selectedDepartmentId) {
      toast.error('Name, email, and department selection are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/admin/department-admins', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        employeeId: employeeId.trim(),
        identifierValue: employeeId.trim(),
        designation: designation.trim(),
        departmentId: selectedDepartmentId,
        role: 'department_admin',
      });

      toast.success(res.data?.message || `Provisioned Department Admin account for ${name}! Invitation email sent.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to provision Department Admin account.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '580px', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', overflow: 'hidden', padding: 0 }}>
        
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--brand-blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Shield size={14} /> Account Provisioning & Governance
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0.25rem 0 0 0' }}>
              Create Department Admin
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'grid', gap: '1.1rem' }}>
          
          {/* Locked Institution Scope Badge */}
          <div style={{ padding: '0.75rem 1rem', background: '#EFF6FF', borderRadius: '6px', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Building size={18} style={{ color: 'var(--brand-blue)' }} />
              <div>
                <div style={{ fontSize: '0.7rem', color: '#1E40AF', textTransform: 'uppercase', fontWeight: 600 }}>Institution Authority</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1E40AF' }}>{institutionName}</div>
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#1E40AF', fontWeight: 500 }}>Locked Scope 🔒</span>
          </div>

          {/* Full Name & Email */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Full Name *</label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Rajesh Sharma"
                required
                style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Email Address *</label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rajesh.sharma@institution.edu"
                required
                style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          {/* Phone & Employee ID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Phone Number (Optional)</label>
              <input
                type="text"
                className="input-field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Employee / Admin ID</label>
              <input
                type="text"
                className="input-field"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="EMP-CSE-001"
                style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          {/* Department Selection & Designation */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Assigned Department *</label>
              {loadingDepts ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading departments...</div>
              ) : (
                <select
                  className="input-field"
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                  required
                  style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }}
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d._id || d.id} value={d._id || d.id}>
                      {d.name} ({d.code || 'DEPT'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Administrative Designation</label>
              <input
                type="text"
                className="input-field"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Head of Department / Admin"
                required
                style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          {/* Password Notice */}
          <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={15} style={{ color: 'var(--brand-blue)', flexShrink: 0 }} />
            <span>
              <strong>Zero Password Setup:</strong> An invitation email with a secure link will be sent to the administrator to set their password.
            </span>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting || !selectedDepartmentId} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <UserPlus size={16} /> {submitting ? 'Provisioning Account...' : 'Create Department Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartmentAdminCreateModal;
