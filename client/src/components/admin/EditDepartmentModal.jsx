import React, { useState } from 'react';
import { Building, Edit2, X, Check } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';

const EditDepartmentModal = ({ department, onClose, onSuccess, existingDepartments = [] }) => {
  const toast = useToast();
  const [name, setName] = useState(department?.name || '');
  const [code, setCode] = useState(department?.code || '');
  const [description, setDescription] = useState(department?.description || '');
  const [status, setStatus] = useState(department?.status || 'active');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!department) return null;

  const handleNameChange = (val) => {
    setName(val);
    const trimmed = val.trim().toLowerCase();
    const currentId = department._id || department.id;
    if (
      trimmed &&
      existingDepartments.some(
        (d) => (d._id || d.id) !== currentId && (d.name || '').trim().toLowerCase() === trimmed
      )
    ) {
      setErrorMsg(`Another department with name '${val.trim()}' already exists.`);
    } else {
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Department name is required.');
      return;
    }

    const trimmed = name.trim().toLowerCase();
    const currentId = department._id || department.id;
    if (
      existingDepartments.some(
        (d) => (d._id || d.id) !== currentId && (d.name || '').trim().toLowerCase() === trimmed
      )
    ) {
      const msg = `Another department with name '${name.trim()}' already exists.`;
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const deptId = department._id || department.id;
      const res = await api.put(`/admin/departments/${deptId}`, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        status,
      });

      toast.success(res.data?.message || `Updated department '${name}' successfully!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to update department.');
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          padding: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--brand-blue, #2563EB)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Building size={14} /> Department Governance
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0.25rem 0 0 0' }}>
              Edit Department Details
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'grid', gap: '1.1rem' }}>
          {errorMsg && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              {errorMsg}
            </div>
          )}

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
              Department Name *
            </label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              style={{
                background: '#FFFFFF',
                border: errorMsg ? '1px solid #EF4444' : '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                borderRadius: '6px',
                fontSize: '0.875rem',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
                Department Code
              </label>
              <input
                type="text"
                className="input-field"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CSE"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
                Status
              </label>
              <select
                className="input-field"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
              Description (Optional)
            </label>
            <textarea
              className="input-field"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Department description..."
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                borderRadius: '6px',
                fontSize: '0.875rem',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Check size={16} /> {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDepartmentModal;
