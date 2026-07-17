import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BadgeCheck } from 'lucide-react';
import RecruiterLayout from '../../layouts/RecruiterLayout';

const RecruiterCompare = () => {
  const [compareResult, setCompareResult] = useState(null);

  useEffect(() => {
    // Load from sessionStorage (set by search page)
    const stored = sessionStorage.getItem('compareResult');
    if (stored) {
      try {
        setCompareResult(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse compare data');
      }
    }
  }, []);

  return (
    <RecruiterLayout>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={28} /> Compare Candidates
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Side-by-side comparison of developer profiles.</p>
      </header>

      {compareResult && compareResult.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: 'grid', gridTemplateColumns: `repeat(${compareResult.length}, 1fr)`, gap: '1.5rem' }}
        >
          {compareResult.map(dev => (
            <div key={dev.id} className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div className="avatar-gradient" style={{ width: '64px', height: '64px', fontSize: '1.5rem', margin: '0 auto 0.75rem' }}>
                {dev.name?.charAt(0)}
              </div>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                {dev.name}
                {dev.isVerified && <BadgeCheck size={14} style={{ color: 'var(--accent-cyan)' }} />}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                {dev.university?.name || 'N/A'} • {dev.university?.department || 'N/A'}
              </div>

              {['development', 'problemSolving', 'knowledge', 'overall'].map(key => (
                <div key={key} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span style={{ fontWeight: '600' }}>{dev.scores?.[key] || 0}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{
                      width: `${((dev.scores?.[key] || 0) / 1000) * 100}%`,
                      background: key === 'overall' ? 'var(--gradient-primary)' : undefined,
                    }} />
                  </div>
                </div>
              ))}

              {/* DNA Summary */}
              {dev.dna && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '0.8rem', textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.375rem', color: 'var(--accent-purple)' }}>Developer DNA</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{dev.dna.archetype || 'No DNA data'}</div>
                </div>
              )}

              {/* Ranking */}
              {dev.ranking && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Global Rank: </span>
                  <span style={{ fontWeight: '700' }}>#{dev.ranking.globalRank || 'N/A'}</span>
                </div>
              )}

              {dev.username && (
                <a href={`/u/${dev.username}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: '1rem' }}>
                  View Profile
                </a>
              )}
            </div>
          ))}
        </motion.div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <Users size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p>No comparison data. Go to <strong>Search Talent</strong>, select 2-4 candidates, and click <strong>Compare Now</strong>.</p>
        </div>
      )}
    </RecruiterLayout>
  );
};

export default RecruiterCompare;
