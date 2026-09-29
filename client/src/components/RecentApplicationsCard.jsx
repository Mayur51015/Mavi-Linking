import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  AlertCircle,
  RefreshCw,
  Building,
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle2,
  X,
  Send,
  Video,
  Award,
  ArrowRight
} from 'lucide-react';

const statusBadgeStyles = {
  'Applied': { bg: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', border: 'rgba(59, 130, 246, 0.3)' },
  'Under Review': { bg: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', border: 'rgba(245, 158, 11, 0.3)' },
  'Shortlisted': { bg: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: 'rgba(16, 185, 129, 0.3)' },
  'Interview Scheduled': { bg: 'rgba(139, 92, 246, 0.15)', color: '#A78BFA', border: 'rgba(139, 92, 246, 0.3)' },
  'Technical Round': { bg: 'rgba(99, 102, 241, 0.15)', color: '#818CF8', border: 'rgba(99, 102, 241, 0.3)' },
  'HR Round': { bg: 'rgba(6, 182, 212, 0.15)', color: '#22D3EE', border: 'rgba(6, 182, 212, 0.3)' },
  'Selected': { bg: 'rgba(20, 184, 166, 0.15)', color: '#2DD4BF', border: 'rgba(20, 184, 166, 0.3)' },
  'Offer Sent': { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ADE80', border: 'rgba(34, 197, 94, 0.3)' },
  'Offer Received': { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ADE80', border: 'rgba(34, 197, 94, 0.3)' },
  'Offer Accepted': { bg: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', border: 'rgba(34, 197, 94, 0.4)' },
  'Joined': { bg: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', border: 'rgba(34, 197, 94, 0.4)' },
  'Placed': { bg: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', border: 'rgba(34, 197, 94, 0.4)' },
  'Rejected': { bg: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: 'rgba(239, 68, 68, 0.3)' },
};

const RecentApplicationsCard = ({
  pipelines = [],
  loading = false,
  error = false,
  errorMessage = 'Unable to load applications.',
  onRetry = null,
}) => {
  const navigate = useNavigate();
  const [selectedApplication, setSelectedApplication] = useState(null);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: 'var(--brand-blue-light, rgba(59, 130, 246, 0.12))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-blue, #3B82F6)',
            }}
          >
            <FileText size={15} />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Recent Applications
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
              }}
            >
              Live tracking of your submitted campus applications & interview rounds
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard/availability')}
          style={{
            background: 'var(--bg-subtle, rgba(255, 255, 255, 0.04))',
            border: '1px solid var(--border-color)',
            color: 'var(--brand-blue, #3B82F6)',
            fontSize: '0.72rem',
            fontWeight: 600,
            borderRadius: '6px',
            padding: '0.3rem 0.65rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--brand-blue)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-subtle, rgba(255, 255, 255, 0.04))';
            e.currentTarget.style.color = 'var(--brand-blue, #3B82F6)';
          }}
        >
          View All <ChevronRight size={13} />
        </button>
      </div>

      {/* Content State */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: '0.5rem 0' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: '52px',
                background: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))',
                borderRadius: '8px',
                animation: 'pulse 1.5s infinite ease-in-out',
              }}
            />
          ))}
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>
            Loading applications...
          </p>
        </div>
      ) : error ? (
        <div
          style={{
            padding: '1.5rem 1rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#EF4444', fontSize: '0.8rem' }}>
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.3rem 0.75rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                borderRadius: '6px',
                background: 'var(--bg-subtle, rgba(255,255,255,0.05))',
                border: '1px solid var(--border-color)',
                color: 'var(--brand-blue, #3B82F6)',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={12} /> Retry
            </button>
          )}
        </div>
      ) : pipelines.length === 0 ? (
        <div
          style={{
            padding: '2rem 1rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: 'var(--text-muted)',
          }}
        >
          <FileText size={28} style={{ opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            You haven't applied to any opportunities yet.
          </p>
          <button
            onClick={() => navigate('/dashboard/jobs')}
            style={{
              marginTop: '0.5rem',
              padding: '0.35rem 0.85rem',
              fontSize: '0.72rem',
              fontWeight: 600,
              borderRadius: '6px',
              background: 'var(--brand-blue, #3B82F6)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Explore Opportunities
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {pipelines.slice(0, 4).map((p) => {
            const role = p.role || p.jobId?.title || 'Campus Opportunity';
            const company = p.companyName || p.companyId?.name || p.recruiterId?.companyName || 'Recruiter';
            const status = p.status || 'Applied';
            const badgeStyle = statusBadgeStyles[status] || statusBadgeStyles['Applied'];

            const dateText = p.createdAt
              ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
              : 'Recent';

            const lastUpdated = p.updatedAt
              ? new Date(p.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
              : dateText;

            return (
              <div
                key={p._id}
                style={{
                  background: 'var(--bg-subtle, rgba(255, 255, 255, 0.02))',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '0.65rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  transition: 'border-color 0.15s ease, background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--brand-blue, #3B82F6)';
                  e.currentTarget.style.background = 'var(--bg-card-hover, rgba(255,255,255,0.04))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'var(--bg-subtle, rgba(255, 255, 255, 0.02))';
                }}
              >
                {/* Left: Role, Company & Applied Date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                      flexShrink: 0,
                    }}
                  >
                    <Building size={16} />
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {role}
                      </span>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 600,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          background: badgeStyle.bg,
                          color: badgeStyle.color,
                          border: `1px solid ${badgeStyle.border}`,
                        }}
                      >
                        {status}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        marginTop: '0.2rem',
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span style={{ color: 'var(--text-secondary)' }}>{company}</span>
                      <span>•</span>
                      <span>Applied: {dateText}</span>
                      {lastUpdated !== dateText && (
                        <>
                          <span>•</span>
                          <span>Updated: {lastUpdated}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: View Timeline Action */}
                <button
                  onClick={() => setSelectedApplication(p)}
                  style={{
                    padding: '0.25rem 0.55rem',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    borderRadius: '5px',
                    background: 'var(--bg-subtle, rgba(255,255,255,0.05))',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--brand-blue, #3B82F6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Application Details & Timeline Modal */}
      {selectedApplication && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => setSelectedApplication(null)}
        >
          <div
            style={{
              background: 'var(--bg-card, #131722)',
              border: '1px solid var(--border-color, #2A2E39)',
              borderRadius: '12px',
              maxWidth: '520px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    background: (statusBadgeStyles[selectedApplication.status] || statusBadgeStyles['Applied']).bg,
                    color: (statusBadgeStyles[selectedApplication.status] || statusBadgeStyles['Applied']).color,
                    border: `1px solid ${(statusBadgeStyles[selectedApplication.status] || statusBadgeStyles['Applied']).border}`,
                    display: 'inline-block',
                    marginBottom: '0.35rem',
                  }}
                >
                  Status: {selectedApplication.status}
                </span>
                <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {selectedApplication.role}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {selectedApplication.companyName || selectedApplication.companyId?.name}
                </div>
              </div>

              <button
                onClick={() => setSelectedApplication(null)}
                style={{
                  background: 'var(--bg-subtle, rgba(255,255,255,0.05))',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Recruiter Message / Next Steps */}
            {selectedApplication.recruiterMessage && (
              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  fontSize: '0.78rem',
                }}
              >
                <div style={{ fontWeight: 600, color: '#60A5FA', marginBottom: '0.25rem' }}>
                  Message from Recruiter:
                </div>
                <div style={{ color: 'var(--text-primary)' }}>
                  {selectedApplication.recruiterMessage}
                </div>
              </div>
            )}

            {/* Interview Details if Present */}
            {selectedApplication.interviewDetails?.interviewDate && (
              <div
                style={{
                  background: 'rgba(139, 92, 246, 0.08)',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  fontSize: '0.78rem',
                }}
              >
                <div style={{ fontWeight: 600, color: '#A78BFA', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Video size={14} /> Scheduled Interview
                </div>
                <div style={{ color: 'var(--text-primary)' }}>
                  Date: {new Date(selectedApplication.interviewDetails.interviewDate).toLocaleString()}
                </div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Mode: {selectedApplication.interviewDetails.interviewMode || 'Online'}
                </div>
                {selectedApplication.interviewDetails.meetingLink && (
                  <a
                    href={selectedApplication.interviewDetails.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#60A5FA', textDecoration: 'underline', display: 'inline-block', marginTop: '0.35rem' }}
                  >
                    Join Meeting Link →
                  </a>
                )}
              </div>
            )}

            {/* Offer Details if Present */}
            {selectedApplication.offerDetails?.ctc && (
              <div
                style={{
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  fontSize: '0.78rem',
                }}
              >
                <div style={{ fontWeight: 600, color: '#34D399', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Award size={14} /> Job Offer Details
                </div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  Offered Package (CTC): {selectedApplication.offerDetails.ctc}
                </div>
                {selectedApplication.offerDetails.joiningDate && (
                  <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Joining Date: {new Date(selectedApplication.offerDetails.joiningDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}

            {/* Application Timeline */}
            <div style={{ margin: '1rem 0' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                Application Lifecycle Timeline
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {(selectedApplication.timeline && selectedApplication.timeline.length > 0
                  ? selectedApplication.timeline
                  : [{ status: selectedApplication.status, updatedAt: selectedApplication.createdAt, note: 'Application submitted' }]
                ).map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: 'var(--brand-blue, #3B82F6)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        marginTop: '2px',
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </div>
                    <div style={{ flex: 1, fontSize: '0.75rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {step.status}
                      </div>
                      {step.note && (
                        <div style={{ color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                          {step.note}
                        </div>
                      )}
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginTop: '0.15rem' }}>
                        {step.updatedAt ? new Date(step.updatedAt).toLocaleString() : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Close Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
              <button
                type="button"
                onClick={() => setSelectedApplication(null)}
                style={{
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  background: 'var(--brand-blue, #3B82F6)',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentApplicationsCard;
