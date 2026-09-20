import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, AlertCircle, RefreshCw } from 'lucide-react';

const defaultOpportunities = [
  { _id: 'opp-1', title: 'Frontend Intern', type: 'Internship', match: 88, deadline: '20 Nov 2026' },
  { _id: 'opp-2', title: 'Backend Developer', type: 'Job', match: 82, deadline: '25 Nov 2026' },
  { _id: 'opp-3', title: 'Full Stack Intern', type: 'Internship', match: 79, deadline: '30 Nov 2026' },
];

const RecentOpportunitiesTable = ({
  jobs = [],
  loading = false,
  error = false,
  onRetry = null,
  userSkills = [],
}) => {
  const navigate = useNavigate();

  const getMatchPercent = (jobSkills, fallback) => {
    if (!jobSkills || !jobSkills.length || !userSkills || !userSkills.length) return fallback;
    const userSet = new Set(
      userSkills.map(s => (typeof s === 'string' ? s : s?.name || '').toLowerCase().trim())
    );
    const matched = jobSkills.filter(s => userSet.has(s.toLowerCase().trim()));
    return Math.round((matched.length / jobSkills.length) * 100);
  };

  const displayList = jobs.length > 0 ? jobs : defaultOpportunities;

  return (
    <div
      style={{
        background: '#15191E',
        border: '1px solid #262C33',
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
      {/* Header */}
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
              background: '#172554',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3B82F6',
            }}
          >
            <Briefcase size={14} />
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#F5F7FA',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Recent Opportunities
          </h3>
        </div>

        <button
          onClick={() => navigate('/dashboard/jobs')}
          style={{
            background: '#1C2229',
            border: '1px solid #262C33',
            color: '#9CA3AF',
            fontSize: '0.72rem',
            fontWeight: 500,
            borderRadius: '5px',
            padding: '0.2rem 0.5rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#F5F7FA';
            e.currentTarget.style.borderColor = '#3B82F6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#9CA3AF';
            e.currentTarget.style.borderColor = '#262C33';
          }}
        >
          View All
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem 0' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '40px', background: '#1C2229', borderRadius: '6px', animation: 'pulse 1.5s infinite ease-in-out' }} />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#EF4444', fontSize: '0.8125rem' }}>
            <AlertCircle size={15} />
            <span>Unable to load opportunities</span>
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
                background: '#1C2229',
                border: '1px solid #262C33',
                color: '#60A5FA',
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
                  borderBottom: '1px solid #262C33',
                  color: '#9CA3AF',
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                <th style={{ padding: '0.4rem 0.2rem', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '0.4rem 0.2rem', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '0.4rem 0.2rem', fontWeight: 600 }}>Match</th>
                <th style={{ padding: '0.4rem 0.2rem', fontWeight: 600 }}>Deadline</th>
                <th style={{ padding: '0.4rem 0.2rem', fontWeight: 600, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayList.slice(0, 3).map((opp, idx) => {
                const deadline = opp.deadline || (opp.createdAt
                  ? new Date(new Date(opp.createdAt).getTime() + 14 * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                  : '20 Nov');

                const oppType = opp.type || (opp.experience?.toLowerCase().includes('intern') || opp.title?.toLowerCase().includes('intern')
                  ? 'Internship'
                  : 'Job');

                const fallbackMatches = [88, 82, 79];
                const matchVal = opp.match || getMatchPercent(opp.skills, fallbackMatches[idx % fallbackMatches.length]);

                return (
                  <tr
                    key={opp._id || opp.id}
                    style={{ borderBottom: '1px solid #1C2229', transition: 'background 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#1C2229')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '0.45rem 0.2rem', color: '#F5F7FA', fontWeight: 600, fontSize: '0.74rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '105px' }}>
                      {opp.title}
                    </td>
                    <td style={{ padding: '0.45rem 0.2rem', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 500,
                          color: '#9CA3AF',
                        }}
                      >
                        {oppType}
                      </span>
                    </td>
                    <td style={{ padding: '0.45rem 0.2rem', whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#22C55E', fontWeight: 700, fontSize: '0.75rem' }}>
                        {matchVal}%
                      </span>
                    </td>
                    <td style={{ padding: '0.45rem 0.2rem', color: '#6B7280', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                      {deadline}
                    </td>
                    <td style={{ padding: '0.45rem 0.2rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => navigate('/dashboard/jobs')}
                        style={{
                          padding: '0.15rem 0.45rem',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          borderRadius: '4px',
                          background: '#1D4ED8',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#3B82F6')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#1D4ED8')}
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

export default RecentOpportunitiesTable;
