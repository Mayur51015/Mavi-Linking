import React, { useState } from 'react';
import { Building, Plus, X, ArrowRight, BookOpen } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';

const CreateDepartmentModal = ({ onClose, onSuccess }) => {
  const toast = useToast();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Department / Branch name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/admin/departments', {
        name: name.trim(),
        code: code.trim().toUpperCase() || name.substring(0, 4).toUpperCase(),
        description: description.trim(),
      });

      toast.success(res.data?.message || `Created department '${name}' successfully!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create department.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '500px', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', overflow: 'hidden', padding: 0 }}>
        
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--brand-blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building size={14} /> Institution Governance
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0.25rem 0 0 0' }}>
              Add Department / Branch
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'grid', gap: '1.1rem' }}>
          
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Department / Branch Name *</label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Artificial Intelligence & Data Science"
              required
              style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }}
            />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Department Code (Optional)</label>
            <input
              type="text"
              className="input-field"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. AI-DS or CSE"
              style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }}
            />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Description (Optional)</label>
            <textarea
              className="input-field"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the academic department or specialisation..."
              style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem', resize: 'vertical' }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting || !name.trim()} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <Plus size={16} /> {submitting ? 'Creating Department...' : 'Create Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDepartmentModal;
