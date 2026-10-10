import React from 'react';
import { Sparkles, Activity, Target, Zap, Trophy } from 'lucide-react';

const AIInsightCard = ({ insight }) => {
  if (!insight) return null;

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '1.25rem 1.4rem',
        boxShadow: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
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
          <Sparkles size={16} />
        </div>
        <h3
          style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 700,
            color: '#111111',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          AI Analytics Insight
        </h3>
      </div>

      <p
        style={{
          fontSize: '0.875rem',
          lineHeight: '1.6',
          marginBottom: '1.25rem',
          color: '#4B5563',
        }}
      >
        {insight.summary}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8125rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4B5563', fontWeight: 500 }}>
              <Target size={14} color="#2563EB" /> Problem Solving
            </span>
            <span style={{ fontWeight: 700, color: '#111111' }}>{insight.problemSolvingScore}%</span>
          </div>
          <div style={{ height: '6px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${insight.problemSolvingScore}%`, height: '100%', background: '#2563EB', borderRadius: '3px' }} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8125rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4B5563', fontWeight: 500 }}>
              <Zap size={14} color="#7C3AED" /> Competitive
            </span>
            <span style={{ fontWeight: 700, color: '#111111' }}>{insight.competitiveProgrammingScore}%</span>
          </div>
          <div style={{ height: '6px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${insight.competitiveProgrammingScore}%`, height: '100%', background: '#7C3AED', borderRadius: '3px' }} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8125rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4B5563', fontWeight: 500 }}>
              <Activity size={14} color="#16A34A" /> Consistency
            </span>
            <span style={{ fontWeight: 700, color: '#111111' }}>{insight.consistencyScore}%</span>
          </div>
          <div style={{ height: '6px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${insight.consistencyScore}%`, height: '100%', background: '#16A34A', borderRadius: '3px' }} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8125rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4B5563', fontWeight: 500 }}>
              <Trophy size={14} color="#D97706" /> Contest Perf.
            </span>
            <span style={{ fontWeight: 700, color: '#111111' }}>{insight.contestPerformanceScore}%</span>
          </div>
          <div style={{ height: '6px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${insight.contestPerformanceScore}%`, height: '100%', background: '#D97706', borderRadius: '3px' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightCard;
