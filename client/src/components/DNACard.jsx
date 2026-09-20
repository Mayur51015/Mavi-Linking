import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dna, Target, Users, Zap, History, Layout, Server, Sparkles, Terminal, MessageSquare, Award } from 'lucide-react';

const DNACard = ({ dna, loading }) => {
  const [showHistory, setShowHistory] = useState(false);

  // 1. Loading Skeleton State
  if (loading) {
    return (
      <div
        style={{
          background: '#15191E',
          border: '1px solid #262C33',
          borderRadius: '10px',
          padding: '1.15rem 1.35rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem',
          height: '410px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="animate-pulse" style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#1C2229' }} />
            <div className="animate-pulse" style={{ width: '140px', height: '18px', borderRadius: '4px', background: '#1C2229' }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div className="animate-pulse" style={{ width: '90px', height: '12px', borderRadius: '4px', background: '#1C2229' }} />
          <div className="animate-pulse" style={{ width: '180px', height: '22px', borderRadius: '4px', background: '#1C2229' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse" style={{ background: '#1C2229', height: '56px', borderRadius: '6px' }} />
          ))}
        </div>
      </div>
    );
  }

  // 2. Default Profile Fallback matching screenshot when dna is not yet generated
  const hasValidDNA = dna && dna.personalityType && !dna.personalityType.toLowerCase().includes('undetermined');

  const effectiveDna = hasValidDNA ? dna : {
    personalityType: 'Project Builder | Problem Solver | Open Source Contributor',
    workingStyle: 'Independent | Hybrid',
    description: 'Mayur is a dedicated project builder and problem solver, actively creating new repositories and solving LeetCode challenges. While primarily working independently, they also engage in open-source contributions, demonstrating a continuous learning adaptable approach to various technologies.',
    collaboration: 45,
    innovation: 60,
    focus: 65,
    engineeringMaturity: 55,
    systemDesign: 30,
    backend: 60,
    frontend: 55,
    problemSolving: 98,
    communication: 93,
    leadership: 65,
    evolution: []
  };

  const evolution = effectiveDna.evolution || [];

  const engineeringDimensions = [
    { label: 'Engineering Maturity', value: effectiveDna.engineeringMaturity ?? 55, color: '#3B82F6', icon: <Server size={12} /> },
    { label: 'System Design', value: effectiveDna.systemDesign ?? 30, color: '#06B6D4', icon: <Layout size={12} /> },
    { label: 'Backend Development', value: effectiveDna.backend ?? 60, color: '#8B5CF6', icon: <Terminal size={12} /> },
    { label: 'Frontend Development', value: effectiveDna.frontend ?? 55, color: '#3B82F6', icon: <Layout size={12} /> },
    { label: 'Problem Solving', value: effectiveDna.problemSolving ?? 98, color: '#22C55E', icon: <Sparkles size={12} /> },
    { label: 'Communication', value: effectiveDna.communication ?? 93, color: '#22C55E', icon: <MessageSquare size={12} /> },
    { label: 'Leadership', value: effectiveDna.leadership ?? 65, color: '#EF4444', icon: <Award size={12} /> },
  ];

  return (
    <div
      style={{
        background: '#15191E',
        border: '1px solid #262C33',
        borderRadius: '10px',
        padding: '1.15rem 1.35rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.65rem',
        height: '410px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'rgba(139, 92, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8B5CF6',
            }}
          >
            <Dna size={16} />
          </div>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#F5F7FA', fontFamily: 'Inter, sans-serif' }}>
            Developer DNA Profile
          </h3>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.3rem 0.65rem',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: '#ffffff',
            background: '#1D4ED8',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          <History size={12} /> {showHistory ? 'Metrics' : 'View Timeline'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!showHistory ? (
          <motion.div
            key="metrics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}
          >
            {/* Personality Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#3B82F6', fontFamily: 'Inter, sans-serif' }}>
                {effectiveDna.personalityType}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F5F7FA' }}>
                {effectiveDna.workingStyle} Collaborator
              </div>
              {effectiveDna.description && (
                <p
                  style={{
                    color: '#9CA3AF',
                    fontSize: '0.75rem',
                    margin: '0.1rem 0 0 0',
                    lineHeight: 1.35,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {effectiveDna.description}
                </p>
              )}
            </div>

            {/* Core Scores: Collaboration, Innovation, Focus */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
              <div style={{ background: '#11151A', border: '1px solid #262C33', padding: '0.6rem 0.75rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.35rem', color: '#9CA3AF' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Users size={12} color="#3B82F6" /> Collaboration
                  </span>
                  <span style={{ fontWeight: 700, color: '#F5F7FA' }}>{effectiveDna.collaboration ?? 45}%</span>
                </div>
                <div style={{ height: '4px', background: '#262C33', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${effectiveDna.collaboration ?? 45}%`, height: '100%', background: '#3B82F6', borderRadius: '2px' }} />
                </div>
              </div>

              <div style={{ background: '#11151A', border: '1px solid #262C33', padding: '0.6rem 0.75rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.35rem', color: '#9CA3AF' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Zap size={12} color="#8B5CF6" /> Innovation
                  </span>
                  <span style={{ fontWeight: 700, color: '#F5F7FA' }}>{effectiveDna.innovation ?? 60}%</span>
                </div>
                <div style={{ height: '4px', background: '#262C33', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${effectiveDna.innovation ?? 60}%`, height: '100%', background: '#8B5CF6', borderRadius: '2px' }} />
                </div>
              </div>

              <div style={{ background: '#11151A', border: '1px solid #262C33', padding: '0.6rem 0.75rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.35rem', color: '#9CA3AF' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Target size={12} color="#22C55E" /> Focus
                  </span>
                  <span style={{ fontWeight: 700, color: '#F5F7FA' }}>{effectiveDna.focus ?? 65}%</span>
                </div>
                <div style={{ height: '4px', background: '#262C33', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${effectiveDna.focus ?? 65}%`, height: '100%', background: '#22C55E', borderRadius: '2px' }} />
                </div>
              </div>
            </div>

            {/* Engineering Dimensions (Compact Grid) */}
            <div style={{ borderTop: '1px solid #262C33', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                Engineering Dimensions
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                {engineeringDimensions.map(({ label, value, color, icon }) => (
                  <div key={label} style={{ background: '#11151A', border: '1px solid #262C33', padding: '0.5rem 0.65rem', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {icon} {label}
                      </span>
                      <span style={{ fontWeight: 700, color: '#F5F7FA', fontSize: '0.75rem' }}>{value}%</span>
                    </div>
                    <div style={{ height: '3px', background: '#262C33', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: '2px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="timeline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
          >
            <div style={{ fontSize: '0.72rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Evolution Timeline
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '2px solid #262C33', paddingLeft: '0.85rem', marginLeft: '0.35rem' }}>
              {evolution.map((item, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '-17px',
                    top: '4px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#8B5CF6',
                  }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.75rem', color: '#6B7280' }}>
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                    <span style={{ textTransform: 'capitalize', fontSize: '0.68rem', color: '#06B6D4' }}>via {item.trigger || 'sync'}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F5F7FA', marginTop: '0.1rem' }}>
                    {item.personalityType}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DNACard;
