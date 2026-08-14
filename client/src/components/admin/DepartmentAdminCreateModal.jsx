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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
      <div className="glass-card-static" style={{ width: '100%', maxWidth: '580px', background: '#121319', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', overflow: 'hidden', padding: 0 }}>
        
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-purple)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Shield size={14} /> Account Provisioning & Governance
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white', margin: '0.2rem 0 0 0' }}>
              Create Department Admin
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'grid', gap: '1.1rem' }}>
          
          {/* Locked Institution Scope Badge */}
          <div style={{ padding: '0.85rem 1rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Building size={18} style={{ color: 'var(--accent-purple)' }} />
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', uppercase: 'uppercase' }}>Institution Authority</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'white' }}>{institutionName}</div>
              </div>
            </div>
            <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Locked Scope 🔒</span>
          </div>

          {/* Full Name & Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Full Name *</label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Rajesh Sharma"
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Email Address *</label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rajesh.sharma@institution.edu"
                required
              />
            </div>
          </div>

          {/* Phone & Employee ID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Phone Number (Optional)</label>
              <input
                type="text"
                className="input-field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Employee / Admin ID</label>
              <input
                type="text"
                className="input-field"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="EMP-CSE-001"
              />
            </div>
          </div>

          {/* Department Selection & Designation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Assigned Department *</label>
              {loadingDepts ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading departments...</div>
              ) : (
                <select
                  className="input-field"
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                  required
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

            <div className="input-group">
              <label className="input-label">Administrative Designation</label>
              <input
                type="text"
                className="input-field"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Head of Department / Admin"
                required
              />
            </div>
          </div>

          {/* Password Notice */}
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={14} style={{ color: 'var(--accent-amber)' }} />
            <span>
              <strong>Zero Password Setup:</strong> An email with a secure, single-use activation link will be sent to the Department Admin to set their password.
            </span>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ padding: '0.6rem 1.25rem' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting || !selectedDepartmentId} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={16} /> {submitting ? 'Provisioning Account...' : 'Create Department Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartmentAdminCreateModal;
