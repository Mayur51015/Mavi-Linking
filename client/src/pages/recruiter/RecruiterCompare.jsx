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
      <header style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={22} style={{ color: 'var(--brand-blue)' }} /> Compare Candidates
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Side-by-side comparative evaluation of candidate developer profiles.</p>
      </header>

      {compareResult && compareResult.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, gap: '1.25rem' }}
        >
          {compareResult.map(dev => (
            <div key={dev.id} style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.08)', color: 'var(--brand-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '1.25rem', margin: '0 auto 0.75rem' }}>
                {dev.name?.charAt(0)}
              </div>
              <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                {dev.name}
                {dev.isVerified && <BadgeCheck size={14} style={{ color: 'var(--brand-blue)' }} />}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                {dev.university?.name || 'N/A'} • {dev.university?.department || 'N/A'}
              </div>

              {['development', 'problemSolving', 'knowledge', 'overall'].map(key => (
                <div key={key} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{dev.scores?.[key] || 0}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <div style={{
                      width: `${Math.min(100, ((dev.scores?.[key] || 0) / 1000) * 100)}%`,
                      height: '100%',
                      background: 'var(--brand-blue)',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              ))}

              {/* DNA Summary */}
              {dev.dna && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.75rem', textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Developer Archetype</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{dev.dna.archetype || 'No evaluation data recorded'}</div>
                </div>
              )}

              {/* Ranking */}
              {dev.ranking && (
                <div style={{ marginTop: '0.625rem', padding: '0.625rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cohort Rank: </span>
                  <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>#{dev.ranking.globalRank || 'N/A'}</span>
                </div>
              )}

              {dev.username && (
                <a href={`/u/${dev.username}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ width: '100%', marginTop: '1rem', fontSize: '0.8125rem', padding: '0.45rem' }}>
                  View Full Profile
                </a>
              )}
            </div>
          ))}
        </motion.div>
      ) : (
        <div style={{ background: '#FFFFFF', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          <Users size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem auto' }} />
          <p>No candidates currently selected. Go to <strong>Search Talent</strong>, choose 2–4 candidates, and click <strong>Compare Now</strong>.</p>
        </div>
      )}
    </RecruiterLayout>
  );
};

export default RecruiterCompare;
