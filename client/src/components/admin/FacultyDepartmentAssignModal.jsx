import React, { useState, useEffect, useMemo } from 'react';
import { Building2, User, Search, Check, X, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';

const FacultyDepartmentAssignModal = ({
  facultyMember = null, // Optional pre-selected faculty member
  facultyList = [],      // List of all faculty members in institution
  departments = [],      // List of all departments in institution
  onClose,
  onSuccess,
}) => {
  const toast = useToast();

  const [selectedFacultyId, setSelectedFacultyId] = useState(
    facultyMember?._id || facultyMember?.id || ''
  );
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [facultySearch, setFacultySearch] = useState('');
  const [deptSearch, setDeptSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Find active faculty object
  const currentFaculty = useMemo(() => {
    if (facultyMember && (facultyMember._id === selectedFacultyId || facultyMember.id === selectedFacultyId)) {
      return facultyMember;
    }
    return facultyList.find((f) => (f._id || f.id) === selectedFacultyId) || null;
  }, [facultyMember, facultyList, selectedFacultyId]);

  // Current department name for selected faculty
  const currentDeptName = useMemo(() => {
    if (!currentFaculty) return 'None';
    if (currentFaculty.departmentId) {
      if (typeof currentFaculty.departmentId === 'object') {
        return currentFaculty.departmentId.name || currentFaculty.departmentId.code || 'Assigned';
      }
      const matched = departments.find((d) => (d._id || d.id) === currentFaculty.departmentId);
      if (matched) return matched.name;
    }
    if (currentFaculty.university?.department) {
      return currentFaculty.university.department;
    }
    return 'Unassigned';
  }, [currentFaculty, departments]);

  // Set initial selected department based on faculty's current assignment
  useEffect(() => {
    if (currentFaculty) {
      const currentDeptId =
        (typeof currentFaculty.departmentId === 'object'
          ? currentFaculty.departmentId?._id || currentFaculty.departmentId?.id
          : currentFaculty.departmentId) || '';

      if (currentDeptId) {
        setSelectedDeptId(currentDeptId);
      } else if (currentFaculty.university?.department) {
        const matched = departments.find(
          (d) => (d.name || '').toLowerCase() === currentFaculty.university.department.toLowerCase()
        );
        setSelectedDeptId(matched ? matched._id || matched.id : '');
      } else {
        setSelectedDeptId('');
      }
    }
  }, [currentFaculty, departments]);

  // Filtered faculty options for searchable select
  const filteredFaculty = useMemo(() => {
    if (!facultySearch.trim()) return facultyList;
    const q = facultySearch.toLowerCase();
    return facultyList.filter(
      (f) =>
        (f.name || '').toLowerCase().includes(q) ||
        (f.email || '').toLowerCase().includes(q) ||
        (f.etxId || '').toLowerCase().includes(q)
    );
  }, [facultyList, facultySearch]);

  // Filtered departments for searchable select
  const filteredDepartments = useMemo(() => {
    if (!deptSearch.trim()) return departments;
    const q = deptSearch.toLowerCase();
    return departments.filter(
      (d) =>
        (d.name || '').toLowerCase().includes(q) ||
        (d.code || '').toLowerCase().includes(q)
    );
  }, [departments, deptSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFacultyId) {
      setErrorMsg('Please select a faculty member to assign.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      // Direct call to department assignment endpoint
      const res = await api.put(`/admin/users/${selectedFacultyId}/department`, {
        departmentId: selectedDeptId || null,
      });

      const assignedDept = departments.find((d) => (d._id || d.id) === selectedDeptId);
      const successMessage =
        res.data?.message ||
        (assignedDept
          ? `Faculty member successfully assigned to ${assignedDept.name}.`
          : 'Faculty department assignment cleared.');

      toast.success(successMessage);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to assign faculty member to department.');
      setErrorMsg(msg);
      toast.error(msg);
      // Selection is preserved in state so admin can correct without restarting!
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
          maxWidth: '560px',
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
            background: 'var(--bg-subtle, #F8FAFC)',
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
              <Building2 size={14} /> Faculty Management & Department Governance
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0.25rem 0 0 0' }}>
              Assign Faculty to Department
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'grid', gap: '1.2rem' }}>
          {/* Error Banner */}
          {errorMsg && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                borderRadius: '6px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 500,
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Faculty Member Selection / Info */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
              Faculty Member *
            </label>
            {facultyMember ? (
              <div
                style={{
                  background: 'var(--bg-subtle, #F8FAFC)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                    {facultyMember.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {facultyMember.email} {facultyMember.etxId ? `• ${facultyMember.etxId}` : ''}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    background: '#EFF6FF',
                    color: '#1E40AF',
                    border: '1px solid #BFDBFE',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}
                >
                  {facultyMember.role || 'Teacher'}
                </span>
              </div>
            ) : (
              <div>
                {facultyList.length > 5 && (
                  <div style={{ position: 'relative', marginBottom: '0.4rem' }}>
                    <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Search faculty by name or email..."
                      value={facultySearch}
                      onChange={(e) => setFacultySearch(e.target.value)}
                      style={{ paddingLeft: '2.2rem', width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>
                )}
                <select
                  className="input-field"
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  required
                  style={{ width: '100%', fontSize: '0.875rem' }}
                >
                  <option value="">-- Select Faculty Member --</option>
                  {filteredFaculty.map((f) => (
                    <option key={f._id || f.id} value={f._id || f.id}>
                      {f.name} ({f.email}) {f.etxId ? `[${f.etxId}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 2. Current Department Display */}
          {currentFaculty && (
            <div
              style={{
                background: '#F0F9FF',
                border: '1px solid #BAE6FD',
                borderRadius: '6px',
                padding: '0.65rem 1rem',
                fontSize: '0.825rem',
                color: '#0369A1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Current Assigned Department:</span>
              <strong style={{ fontWeight: 700 }}>{currentDeptName}</strong>
            </div>
          )}

          {/* 3. Target Department Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
              Assigned Department *
            </label>
            {departments.length > 5 && (
              <div style={{ position: 'relative', marginBottom: '0.4rem' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search departments..."
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  style={{ paddingLeft: '2.2rem', width: '100%', fontSize: '0.85rem' }}
                />
              </div>
            )}
            <select
              className="input-field"
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              style={{ width: '100%', fontSize: '0.875rem' }}
            >
              <option value="">-- None / Unassigned (Clear Department Assignment) --</option>
              {filteredDepartments.map((d) => (
                <option key={d._id || d.id} value={d._id || d.id}>
                  {d.name} {d.code ? `(${d.code})` : ''} {d.status === 'inactive' ? '[Inactive]' : ''}
                </option>
              ))}
            </select>
            {departments.length === 0 && (
              <div style={{ fontSize: '0.78rem', color: '#DC2626', marginTop: '0.35rem' }}>
                No academic departments exist in this institution. Please create a department first.
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedFacultyId}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {submitting ? (
                <>
                  <RefreshCw size={15} className="spin" /> Saving Assignment...
                </>
              ) : (
                <>
                  <Check size={16} /> Save / Assign Department
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FacultyDepartmentAssignModal;
