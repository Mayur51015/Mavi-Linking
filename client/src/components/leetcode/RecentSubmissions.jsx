import React from 'react';
import { ExternalLink, CheckCircle } from 'lucide-react';

const RecentSubmissions = ({ submissions }) => {
  if (!submissions || submissions.length === 0) return null;

  return (
    <div className="glass-card">
      <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Recent Submissions</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {submissions.map((sub, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle size={16} color="var(--accent-green)" />
              <span style={{ fontWeight: '500' }}>{sub.title}</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {new Date(sub.timestamp * 1000).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentSubmissions;
