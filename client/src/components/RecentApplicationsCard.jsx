import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, AlertCircle, RefreshCw } from 'lucide-react';
import PlacementBadge from './PlacementBadge';

const defaultApplications = [
  { _id: 'app-1', role: 'Frontend Intern', companyName: 'TCS', status: 'Applied', date: '10 Nov 2026' },
  { _id: 'app-2', role: 'Software Engineer', companyName: 'Infosys', status: 'Shortlisted', date: '08 Nov 2026' },
  { _id: 'app-3', role: 'Full Stack Intern', companyName: 'Zoho', status: 'Interview Scheduled', date: '05 Nov 2026' },
];

const RecentApplicationsCard = ({
  pipelines = [],
  loading = false,
  error = false,
  onRetry,
}) => {
  const navigate = useNavigate();

  const displayList = pipelines.length > 0 ? pipelines : defaultApplications;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '0.9rem 0.85rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '280px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Card Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              background: 'var(--brand-blue-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-blue)',
            }}
          >
            <FileText size={14} />
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Recent Applications
          </h3>
        </div>

        <button
          onClick={() => navigate('/dashboard/jobs')}
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            fontSize: '0.72rem',
            fontWeight: 500,
            borderRadius: '5px',
            padding: '0.2rem 0.5rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.borderColor = 'var(--brand-blue)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          View All
        </button>
      </div>

      {/* Card Body */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem 0' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '40px', background: 'var(--bg-subtle)', borderRadius: '6px', animation: 'pulse 1.5s infinite ease-in-out' }} />
          ))}
        </div>
      ) : error ? (
        <div
          style={{
            padding: '1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-red)', fontSize: '0.8125rem' }}>
            <AlertCircle size={15} />
            <span>Unable to load applications</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.3rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '6px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                color: 'var(--brand-blue)',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={12} /> Retry
            </button>
          )}
        </div>
      ) : (
        <div style={{ overflowX: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                <th style={{ padding: '0.4rem 0.2rem', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '0.4rem 0.2rem', fontWeight: 600 }}>Company</th>
                <th style={{ padding: '0.4rem 0.2rem', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '0.4rem 0.2rem', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '0.4rem 0.2rem', fontWeight: 600, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayList.slice(0, 3).map((p) => {
                const dateText = p.date || (p.createdAt
                  ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                  : 'Recent');

                const statusLabel = p.status === 'Interview Scheduled' ? 'Interview' : (p.status || 'Applied');

                return (
                  <tr
                    key={p._id || p.id}
                    style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '0.45rem 0.2rem', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.74rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '105px' }}>
                      {p.role || 'Frontend Intern'}
                    </td>
                    <td style={{ padding: '0.45rem 0.2rem', color: 'var(--text-secondary)', fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '65px' }}>
                      {p.companyName || p.company?.name || 'TCS'}
                    </td>
                    <td style={{ padding: '0.45rem 0.2rem', whiteSpace: 'nowrap' }}>
                      <span
                        className={`badge ${
                          statusLabel === 'Shortlisted'
                            ? 'badge-emerald'
                            : statusLabel === 'Interview'
                              ? 'badge-purple'
                              : 'badge-blue'
                        }`}
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 600,
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                        }}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td style={{ padding: '0.45rem 0.2rem', color: 'var(--text-muted)', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                      {dateText}
                    </td>
                    <td style={{ padding: '0.45rem 0.2rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => navigate('/dashboard/jobs')}
                        style={{
                          padding: '0.15rem 0.45rem',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          borderRadius: '4px',
                          background: 'var(--brand-blue)',
                          color: '#FFFFFF',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--brand-blue-hover, #2563EB)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--brand-blue)')}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentApplicationsCard;
