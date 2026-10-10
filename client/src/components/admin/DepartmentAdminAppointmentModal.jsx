import React, { useState, useEffect } from 'react';
import { Shield, User, Building, BookOpen, AlertCircle, CheckCircle, X, UserPlus, ArrowRight } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';

const DepartmentAdminAppointmentModal = ({ department, onClose, onAppointmentSuccess }) => {
  const toast = useToast();
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [designation, setDesignation] = useState('Head of Department Admin');
  const [notes, setNotes] = useState('');

  // Confirmation Step State
  const [step, setStep] = useState('form'); // 'form' | 'confirm'
  const [appointing, setAppointing] = useState(false);

  useEffect(() => {
    if (department && department._id) {
      setLoadingCandidates(true);
      api.get(`/admin/departments/${department._id}/eligible-candidates`)
        .then((res) => {
          setCandidates(res.data?.data || []);
        })
        .catch((err) => {
          toast.error(getErrorMessage(err, 'Failed to load eligible candidates.'));
        })
        .finally(() => setLoadingCandidates(false));
    }
  }, [department]);

  const handleSelectCandidate = (candidateId) => {
    setSelectedCandidateId(candidateId);
    const found = candidates.find((c) => c._id === candidateId);
    setSelectedCandidate(found || null);
  };

  const handleProceedToConfirm = (e) => {
    e.preventDefault();
    if (!selectedCandidate) {
      toast.error('Please select an eligible candidate for appointment.');
      return;
    }
    setStep('confirm');
  };

  const handleConfirmAppointment = async () => {
    setAppointing(true);
    try {
      const res = await api.post(`/admin/departments/${department._id}/admins`, {
        candidateUserId: selectedCandidate._id,
        designation,
        notes,
      });

      toast.success(res.data?.message || `Appointed ${selectedCandidate.name} as Department Admin!`);
      if (onAppointmentSuccess) onAppointmentSuccess();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to appoint Department Admin.'));
      setStep('form');
    } finally {
      setAppointing(false);
    }
  };

  if (!department) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '600px', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', overflow: 'hidden', padding: 0 }}>
        
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--brand-blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Shield size={14} /> Identity Governance & Role Appointment
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0.25rem 0 0 0' }}>
              Appoint Department Administrator
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '1.5rem' }}>
          {step === 'form' ? (
            <form onSubmit={handleProceedToConfirm} style={{ display: 'grid', gap: '1.25rem' }}>
              
              {/* Department Overview Banner */}
              <div style={{ padding: '0.85rem 1rem', background: '#EFF6FF', borderRadius: '6px', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#1E40AF', textTransform: 'uppercase', fontWeight: 600 }}>Target Department</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1E40AF' }}>{department.name} ({department.code || 'DEPT'})</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#1E40AF', fontWeight: 500 }}>Institution Scoped</span>
                </div>
              </div>

              {/* Candidate Selection Dropdown */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Select Eligible Candidate (Faculty / Staff)</label>
                {loadingCandidates ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading eligible institutional staff...</div>
                ) : candidates.length === 0 ? (
                  <div style={{ padding: '0.75rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', color: '#DC2626', fontSize: '0.85rem' }}>
                    No eligible active staff found in this institution for appointment.
                  </div>
                ) : (
                  <select
                    className="input-field"
                    value={selectedCandidateId}
                    onChange={(e) => handleSelectCandidate(e.target.value)}
                    required
                    style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }}
                  >
                    <option value="">-- Choose Candidate from Faculty --</option>
                    {candidates.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.email}) — ETX ID: {c.etxId} — Role: {c.role}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedCandidate && (
                <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8125rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Candidate:</span> <strong style={{ color: 'var(--text-primary)' }}>{selectedCandidate.name}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>ETX ID:</span> <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 600 }}>{selectedCandidate.etxId}</span></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Current Role:</span> <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedCandidate.role}</span></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> <span style={{ color: 'var(--text-primary)' }}>{selectedCandidate.email}</span></div>
                </div>
              )}

              {/* Designation & Reason */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Administrative Designation</label>
                <input
                  type="text"
                  className="input-field"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. HOD / Department Administrator"
                  required
                  style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Appointment Notes / Justification (Optional)</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Reason for appointment, tenure notes..."
                  style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem', resize: 'vertical' }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={onClose} className="btn btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={!selectedCandidate} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  Review & Appoint <ArrowRight size={16} />
                </button>
              </div>
            </form>
          ) : (
            /* PHASE 7 — APPOINTMENT CONFIRMATION STEP */
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              <div style={{ padding: '0.85rem 1rem', background: '#FEF3C7', borderRadius: '6px', border: '1px solid #FDE68A', color: '#92400E', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Confirm Department Admin Appointment</strong>
                  <div style={{ fontSize: '0.8rem', color: '#B45309', marginTop: '0.15rem' }}>
                    This action will elevate the user to <strong>DEPARTMENT_ADMIN</strong> for {department.name}.
                  </div>
                </div>
              </div>

              <div style={{ padding: '1.25rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '6px', display: 'grid', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Candidate Name:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{selectedCandidate?.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Permanent ETX ID:</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 600 }}>{selectedCandidate?.etxId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Target Department:</span>
                  <strong style={{ color: 'var(--brand-blue)' }}>{department.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Current Role:</span>
                  <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedCandidate?.role}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>New Administrative Role:</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>DEPARTMENT_ADMIN</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={() => setStep('form')} className="btn btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                  Back
                </button>
                <button type="button" onClick={handleConfirmAppointment} disabled={appointing} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <CheckCircle size={16} /> {appointing ? 'Appointing Admin...' : 'Confirm Appointment'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartmentAdminAppointmentModal;
