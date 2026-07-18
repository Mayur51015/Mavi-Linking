import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dna, Target, Users, Zap, History, Layout, Server, Sparkles, Terminal } from 'lucide-react';

const DNACard = ({ dna, loading }) => {
  const [showHistory, setShowHistory] = useState(false);

  // 1. Loading Skeleton State
  if (loading) {
    return (
      <div 
        className="glass-card" 
        style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '400px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="animate-pulse" style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div className="animate-pulse" style={{ width: '150px', height: '20px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }} />
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="animate-pulse" style={{ width: '100px', height: '12px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }} />
          <div className="animate-pulse" style={{ width: '200px', height: '28px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }} />
          <div className="animate-pulse" style={{ width: '100%', height: '14px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', marginTop: '0.5rem' }} />
          <div className="animate-pulse" style={{ width: '85%', height: '14px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', height: '70px', borderRadius: '8px' }} />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
          <div className="animate-pulse" style={{ width: '120px', height: '14px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[1, 2, 4, 5].map(i => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div className="animate-pulse" style={{ width: '100px', height: '12px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }} />
                <div className="animate-pulse" style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. Empty State
  if (!dna) {
    return (
      <div 
        className="glass-card" 
        style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', textAlign: 'center', gap: '1rem', color: 'var(--text-muted)' }}
      >
        <Dna size={50} style={{ opacity: 0.4, color: 'var(--accent-purple)', animation: 'pulse 3s infinite' }} />
        <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem' }}>No Developer DNA Profile Yet</h3>
        <p style={{ maxWidth: '320px', fontSize: '0.85rem', lineHeight: '1.5' }}>
          We generate a detailed cognitive engineering DNA snapshot based on your profile completeness, linked platforms, projects, and achievements.
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
          Add your first project or update your profile bio to compile your DNA!
        </p>
      </div>
    );
  }

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
        <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'Outfit' }}>
          <Dna size={24} className="text-gradient" />
          Developer DNA Profile
        </h3>
        {evolution.length > 0 && (
          <button 
            onClick={() => setShowHistory(!showHistory)} 
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--accent-cyan)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '6px', cursor: 'pointer' }}
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
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Personality Type</div>
              <div className="text-gradient" style={{ fontSize: '1.65rem', fontWeight: 'bold', fontFamily: 'Outfit' }}>{dna.personalityType}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.15rem' }}>{dna.workingStyle || 'Independent'} Collaborator</div>
              {dna.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginTop: '0.5rem', lineHeight: '1.4' }}>{dna.description}</p>}
            </div>

            {/* Core Scores */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.725rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}><Users size={12} color="var(--accent-blue)" /> Collab</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.375rem' }}>{dna.collaboration}%</div>
                <div style={{ height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${dna.collaboration}%`, height: '100%', background: 'var(--accent-blue)' }} />
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.725rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}><Zap size={12} color="var(--accent-purple)" /> Innovate</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.375rem' }}>{dna.innovation}%</div>
                <div style={{ height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${dna.innovation}%`, height: '100%', background: 'var(--accent-purple)' }} />
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.725rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}><Target size={12} color="var(--accent-emerald)" /> Focus</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.375rem' }}>{dna.focus}%</div>
                <div style={{ height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${dna.focus}%`, height: '100%', background: 'var(--accent-emerald)' }} />
                </div>
              </div>
            </div>

            {/* Extended Scores Grid */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Engineering Dimensions</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {[
                  { label: 'Engineering Maturity', value: dna.engineeringMaturity, color: 'var(--accent-blue)', icon: <Server size={12} /> },
                  { label: 'System Design', value: dna.systemDesign, color: 'var(--accent-cyan)', icon: <Layout size={12} /> },
                  { label: 'Backend Development', value: dna.backend, color: 'var(--accent-purple)', icon: <Terminal size={12} /> },
                  { label: 'Frontend Development', value: dna.frontend, color: 'var(--accent-purple)', icon: <Layout size={12} /> },
                  { label: 'Problem Solving Depth', value: dna.problemSolving, color: 'var(--accent-amber)', icon: <Sparkles size={12} /> },
                  { label: 'Leadership', value: dna.leadership, color: 'var(--accent-red)', icon: <Target size={12} /> },
                  { label: 'Communication', value: dna.communication, color: '#10b981', icon: <Users size={12} /> },
                ].map(({ label, value, color, icon }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {icon} {label}
                      </span>
                      <span style={{ fontWeight: '600', color: 'white' }}>{value}%</span>
                    </div>
                    <div style={{ height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${value}%`, height: '100%', background: color }} />
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
                  background: 'var(--accent-purple)',
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
