import React from 'react';
import { ExternalLink, CheckCircle, Code2, AlertCircle } from 'lucide-react';
import EmptyState from '../ui/EmptyState';

const RecentSubmissions = ({ submissions }) => {
  if (!submissions || submissions.length === 0) {
    return (
      <EmptyState
        icon={<Code2 size={28} color="var(--accent-amber)" />}
        iconColor="var(--accent-amber)"
        title="No recent submissions"
        description="Solve problems on LeetCode and sync your profile to see your recent submissions here."
        size="sm"
      />
    );
  }

  return (
    <div className="glass-card">
      <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Code2 size={20} color="var(--accent-cyan)" />
        Recent Submissions
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {submissions.map((sub, idx) => {
          const isAccepted = (sub.statusDisplay || 'Accepted').toLowerCase() === 'accepted';
          const subDate = sub.timestamp ? new Date(sub.timestamp * 1000) : new Date();

          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {isAccepted ? (
                  <CheckCircle size={16} color="var(--accent-emerald)" />
                ) : (
                  <AlertCircle size={16} color="var(--accent-amber)" />
                )}
                <div>
                  <div style={{ fontWeight: '600', color: 'white', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>{sub.title}</span>
                    {sub.url && (
                      <a href={sub.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center' }}>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  {sub.lang && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {sub.lang}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge ${isAccepted ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.7rem' }}>
                  {sub.statusDisplay || 'Accepted'}
                </span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {subDate.toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentSubmissions;
