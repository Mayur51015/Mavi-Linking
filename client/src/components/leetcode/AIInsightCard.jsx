import React from 'react';
import { Sparkles, Activity, Target, Zap, Trophy } from 'lucide-react';

const AIInsightCard = ({ insight }) => {
  if (!insight) return null;

  return (
    <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
      <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(168, 85, 247, 0.2)', paddingBottom: '1rem' }}>
        <Sparkles size={20} color="#a855f7" />
        AI Analytics Insight
      </h3>
      
      <p style={{ lineHeight: '1.6', marginBottom: '2rem', color: 'var(--text-primary)' }}>
        {insight.summary}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}><Target size={14}/> Problem Solving</span>
            <span style={{ fontWeight: 'bold' }}>{insight.problemSolvingScore}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${insight.problemSolvingScore}%`, height: '100%', background: '#3b82f6', borderRadius: '3px' }} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}><Zap size={14}/> Competitive</span>
            <span style={{ fontWeight: 'bold' }}>{insight.competitiveProgrammingScore}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${insight.competitiveProgrammingScore}%`, height: '100%', background: '#a855f7', borderRadius: '3px' }} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}><Activity size={14}/> Consistency</span>
            <span style={{ fontWeight: 'bold' }}>{insight.consistencyScore}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${insight.consistencyScore}%`, height: '100%', background: '#10b981', borderRadius: '3px' }} />
          </div>
        </div>
        
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}><Trophy size={14}/> Contest Perf.</span>
            <span style={{ fontWeight: 'bold' }}>{insight.contestPerformanceScore}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${insight.contestPerformanceScore}%`, height: '100%', background: '#f59e0b', borderRadius: '3px' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightCard;
