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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
      <div className="glass-card-static" style={{ width: '100%', maxWidth: '600px', background: '#121319', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', overflow: 'hidden', padding: 0 }}>
        
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-purple)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Shield size={14} /> Identity Governance & Role Appointment
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white', margin: '0.2rem 0 0 0' }}>
              Appoint Department Administrator
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '1.5rem' }}>
          {step === 'form' ? (
            <form onSubmit={handleProceedToConfirm} style={{ display: 'grid', gap: '1.25rem' }}>
              
              {/* Department Overview Banner */}
              <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Department</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>{department.name} ({department.code || 'DEPT'})</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>Institution Scoped</span>
                </div>
              </div>

              {/* Candidate Selection Dropdown */}
              <div className="input-group">
                <label className="input-label">Select Eligible Candidate (Faculty / Staff)</label>
                {loadingCandidates ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading eligible institutional staff...</div>
                ) : candidates.length === 0 ? (
                  <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem' }}>
                    No eligible active staff found in this institution for appointment.
                  </div>
                ) : (
                  <select
                    className="input-field"
                    value={selectedCandidateId}
                    onChange={(e) => handleSelectCandidate(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Candidate from Faculty --</option>
                    {candidates.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.email}) — MAVI ID: {c.maviId} — Role: {c.role}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedCandidate && (
                <div style={{ padding: '0.9rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Candidate:</span> <strong>{selectedCandidate.name}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>MAVI ID:</span> <span style={{ fontFamily: 'monospace', color: 'var(--accent-purple)' }}>{selectedCandidate.maviId}</span></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Current Role:</span> <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{selectedCandidate.role}</span></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> {selectedCandidate.email}</div>
                </div>
              )}

              {/* Designation & Reason */}
              <div className="input-group">
                <label className="input-label">Administrative Designation</label>
                <input
                  type="text"
                  className="input-field"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. HOD / Department Administrator"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Appointment Notes / Justification (Optional)</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Reason for appointment, tenure notes..."
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button type="button" onClick={onClose} className="btn btn-outline" style={{ padding: '0.6rem 1.25rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={!selectedCandidate} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Review & Appoint <ArrowRight size={16} />
                </button>
              </div>
            </form>
          ) : (
            /* PHASE 7 — APPOINTMENT CONFIRMATION STEP */
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px', border: '1px solid #f59e0b', color: '#fbbf24', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertCircle size={22} />
                <div>
                  <strong>Confirm Department Admin Appointment</strong>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                    This action will elevate the user to <strong>DEPARTMENT_ADMIN</strong> for {department.name}.
                  </div>
                </div>
              </div>

              <div className="glass-card-static" style={{ padding: '1.25rem', display: 'grid', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Candidate Name:</span>
                  <strong style={{ color: 'white' }}>{selectedCandidate?.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Permanent MAVI ID:</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--accent-purple)', fontWeight: 'bold' }}>{selectedCandidate?.maviId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Target Department:</span>
                  <strong style={{ color: 'var(--accent-cyan)' }}>{department.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Current Role:</span>
                  <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{selectedCandidate?.role}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>New Administrative Role:</span>
                  <span style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>DEPARTMENT_ADMIN</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button type="button" onClick={() => setStep('form')} className="btn btn-outline" style={{ padding: '0.6rem 1.25rem' }}>
                  Back
                </button>
                <button type="button" onClick={handleConfirmAppointment} disabled={appointing} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
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
