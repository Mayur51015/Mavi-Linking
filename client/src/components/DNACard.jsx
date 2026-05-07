import React from 'react';
import { motion } from 'framer-motion';
import { Dna, Target, Users, Zap } from 'lucide-react';

const DNACard = ({ dna }) => {
  if (!dna) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card relative overflow-hidden" 
      style={{ padding: '2rem', position: 'relative' }}
    >
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05 }}>
        <Dna size={150} />
      </div>

      <h3 style={{ marginBottom: '1.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Dna size={24} className="text-gradient" />
        Developer DNA Profile
      </h3>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Personality Type</div>
        <div className="text-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>{dna.personalityType}</div>
        <div style={{ fontSize: '1rem', color: 'var(--text-primary)', marginTop: '0.5rem' }}>{dna.workingStyle} Worker</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Users size={16} /> Collaboration</div>
          <div style={{ height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${dna.scores.collaboration}%`, height: '100%', background: 'var(--accent-blue)' }} />
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Zap size={16} /> Innovation</div>
          <div style={{ height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${dna.scores.innovation}%`, height: '100%', background: 'var(--accent-purple)' }} />
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Target size={16} /> Consistency</div>
          <div style={{ height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${dna.scores.consistency}%`, height: '100%', background: '#10b981' }} />
          </div>
        </div>
      </div>

    </motion.div>
  );
};

export default DNACard;
