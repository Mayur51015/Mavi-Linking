import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dna, Target, Users, Zap, TrendingUp, History, Shield } from 'lucide-react';

const DNACard = ({ dna }) => {
  const [showHistory, setShowHistory] = useState(false);

  if (!dna) return null;

  const scores = dna.scores || { collaboration: 50, innovation: 50, consistency: 50, learningAdaptability: 50 };
  const extended = dna.extendedScores || { engineeringMaturity: 0, problemSolvingDepth: 0, systemDesign: 0, codeQuality: 0, technicalDiversity: 0 };
  const evolution = dna.evolution || [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card relative overflow-hidden" 
      style={{ padding: '2rem', position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.03, pointerEvents: 'none' }}>
        <Dna size={180} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Dna size={24} className="text-gradient" />
          Developer DNA Profile
        </h3>
        {evolution.length > 0 && (
          <button 
            onClick={() => setShowHistory(!showHistory)} 
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
          >
            <History size={14} /> {showHistory ? 'Show Metrics' : 'View Timeline'}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!showHistory ? (
          <motion.div 
            key="metrics"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Personality Type</div>
              <div className="text-gradient" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{dna.personalityType}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>{dna.workingStyle} Worker</div>
              {dna.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem', lineHeight: '1.4' }}>{dna.description}</p>}
            </div>

            {/* Core Scores */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}><Users size={12} /> Collab</div>
                <div style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.375rem' }}>{scores.collaboration}%</div>
                <div style={{ height: '4px', background: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${scores.collaboration}%`, height: '100%', background: 'var(--accent-blue)' }} />
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}><Zap size={12} /> Innovate</div>
                <div style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.375rem' }}>{scores.innovation}%</div>
                <div style={{ height: '4px', background: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${scores.innovation}%`, height: '100%', background: 'var(--accent-purple)' }} />
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}><Target size={12} /> Focus</div>
                <div style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.375rem' }}>{scores.consistency}%</div>
                <div style={{ height: '4px', background: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${scores.consistency}%`, height: '100%', background: '#10b981' }} />
                </div>
              </div>
            </div>

            {/* Extended Scores */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Engineering Dimensions</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { label: 'Engineering Maturity', value: extended.engineeringMaturity, color: 'var(--accent-blue)' },
                  { label: 'System Design', value: extended.systemDesign, color: 'var(--accent-cyan)' },
                  { label: 'Problem Solving Depth', value: extended.problemSolvingDepth, color: 'var(--accent-purple)' },
                  { label: 'Code Quality', value: extended.codeQuality, color: '#10b981' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ fontWeight: '600' }}>{value}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: '6px' }}>
                      <div className="progress-bar-fill" style={{ width: `${value}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="timeline"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Evolution Timeline</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '2px solid rgba(255, 255, 255, 0.05)', paddingLeft: '1rem', marginLeft: '0.5rem' }}>
              {evolution.map((item, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '-21px',
                    top: '4px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: 'var(--accent-purple)',
                    border: '2px solid var(--bg-primary)'
                  }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                    <span style={{ textTransform: 'capitalize', fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>via {item.trigger || 'sync'}</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'white' }}>
                    {item.personalityType}
                  </div>
                </div>
              ))}
              
              {/* Current state in timeline */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '-22px',
                  top: '3px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  border: '2px solid var(--bg-primary)'
                }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>
                  <span>Current Status</span>
                  <span style={{ textTransform: 'capitalize', fontSize: '0.7rem', color: 'var(--accent-emerald)' }}>Active</span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'white' }}>
                  {dna.personalityType}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DNACard;
