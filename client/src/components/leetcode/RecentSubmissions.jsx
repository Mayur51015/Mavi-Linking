import React, { useState } from 'react';
import { ExternalLink, CheckCircle, Code2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import EmptyState from '../ui/EmptyState';

const formatQuestionTitle = (sub) => {
  if (sub?.title && String(sub.title).trim()) {
    return String(sub.title).trim();
  }
  if (sub?.titleSlug && String(sub.titleSlug).trim()) {
    return String(sub.titleSlug)
      .trim()
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return 'Coding Problem';
};

const getQuestionUrl = (sub) => {
  if (sub?.url && String(sub.url).trim()) {
    return String(sub.url).trim();
  }
  if (sub?.titleSlug && String(sub.titleSlug).trim()) {
    return `https://leetcode.com/problems/${String(sub.titleSlug).trim()}/`;
  }
  return null;
};

const formatSubmissionDate = (timestamp) => {
  if (!timestamp) return 'Recent';
  const ts = Number(timestamp);
  if (isNaN(ts)) return 'Recent';
  const date = new Date(ts < 10000000000 ? ts * 1000 : ts);
  if (isNaN(date.getTime())) return 'Recent';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const RecentSubmissions = ({ submissions, loading = false }) => {
  const [visibleCount, setVisibleCount] = useState(5);

  if (loading) {
    return (
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          padding: '1.25rem 1.4rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Code2 size={18} color="#2563EB" />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111111' }}>
            Coding Activity & Submissions
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                height: '48px',
                background: '#F8F9FA',
                borderRadius: '6px',
                animation: 'pulse 1.5s infinite',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!submissions || submissions.length === 0) {
    return (
      <EmptyState
        icon={<Code2 size={28} color="#2563EB" />}
        iconColor="#2563EB"
        title="No recent coding submissions"
        description="Solve problems on LeetCode and sync your profile to see your verified coding activity and question history here."
        size="sm"
      />
    );
  }

  const total = submissions.length;
  const visibleSubmissions = submissions.slice(0, visibleCount);
  const isExpanded = visibleCount >= total;

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '1.25rem 1.4rem',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB',
              flexShrink: 0,
            }}
          >
            <Code2 size={16} />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 700,
                color: '#111111',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Coding Activity & Submissions
            </h3>
          </div>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#4B5563',
            background: '#F3F4F6',
            padding: '0.2rem 0.55rem',
            borderRadius: '9999px',
            border: '1px solid #E5E7EB',
          }}
        >
          {total} {total === 1 ? 'Submission' : 'Submissions'}
        </span>
      </div>

      {/* Table / List Container */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        {/* Table Header (Hidden on extra small screens via CSS/flex) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(200px, 3fr) minmax(90px, 1.2fr) minmax(100px, 1.3fr) minmax(100px, 1.4fr) minmax(70px, 1fr)',
            gap: '0.75rem',
            padding: '0.45rem 0.5rem',
            background: '#F8F9FA',
            borderBottom: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#4B5563',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            alignItems: 'center',
          }}
        >
          <div>Question / Activity</div>
          <div>Language</div>
          <div style={{ textAlign: 'center' }}>Status</div>
          <div style={{ textAlign: 'right' }}>Date</div>
          <div style={{ textAlign: 'right' }}>Action</div>
        </div>

        {/* Rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {visibleSubmissions.map((sub, idx) => {
            const isAccepted = String(sub.statusDisplay || 'Accepted').toLowerCase() === 'accepted';
            const title = formatQuestionTitle(sub);
            const questionUrl = getQuestionUrl(sub);
            const formattedDate = formatSubmissionDate(sub.timestamp);
            const isLast = idx === visibleSubmissions.length - 1;

            return (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(200px, 3fr) minmax(90px, 1.2fr) minmax(100px, 1.3fr) minmax(100px, 1.4fr) minmax(70px, 1fr)',
                  gap: '0.75rem',
                  padding: '0.75rem 0.5rem',
                  borderBottom: isLast ? 'none' : '1px solid #E5E7EB',
                  alignItems: 'center',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8F9FA')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {/* 1. Question / Activity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                  <div style={{ flexShrink: 0 }}>
                    {isAccepted ? (
                      <CheckCircle size={16} color="#059669" />
                    ) : (
                      <AlertCircle size={16} color="#DC2626" />
                    )}
                  </div>
                  <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden' }}>
                    <span
                      title={title}
                      style={{
                        fontWeight: 600,
                        color: '#111111',
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'inline-block',
                      }}
                    >
                      {title}
                    </span>
                    {questionUrl && (
                      <a
                        href={questionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Open "${title}" on LeetCode`}
                        aria-label={`Open "${title}" on LeetCode`}
                        style={{
                          color: '#2563EB',
                          display: 'inline-flex',
                          alignItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>

                {/* 2. Language */}
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono, monospace)',
                      background: '#F3F4F6',
                      color: '#4B5563',
                      border: '1px solid #E5E7EB',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {sub.lang || 'Code'}
                  </span>
                </div>

                {/* 3. Status */}
                <div style={{ textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: isAccepted ? '#ECFDF5' : '#FEF2F2',
                      color: isAccepted ? '#059669' : '#DC2626',
                      border: isAccepted ? '1px solid #A7F3D0' : '1px solid #FECACA',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {sub.statusDisplay || (isAccepted ? 'Accepted' : 'Submitted')}
                  </span>
                </div>

                {/* 4. Date */}
                <div
                  style={{
                    textAlign: 'right',
                    fontSize: '0.8125rem',
                    color: '#6B7280',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formattedDate}
                </div>

                {/* 5. Action */}
                <div style={{ textAlign: 'right' }}>
                  {questionUrl ? (
                    <a
                      href={questionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Solve or view "${title}" on LeetCode`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#2563EB',
                        background: '#EFF6FF',
                        border: '1px solid #DBEAFE',
                        textDecoration: 'none',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#DBEAFE')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#EFF6FF')}
                    >
                      <span>View</span>
                      <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination / Show More Control */}
      {total > 5 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '0.85rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #E5E7EB',
          }}
        >
          <button
            type="button"
            onClick={() => setVisibleCount(isExpanded ? 5 : total)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.9rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#2563EB',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#2563EB';
              e.currentTarget.style.backgroundColor = '#EFF6FF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
          >
            {isExpanded ? (
              <>
                <ChevronUp size={14} />
                <span>Show Less</span>
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                <span>Show More ({total - visibleCount} more)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentSubmissions;
