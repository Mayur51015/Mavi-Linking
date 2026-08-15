import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, GraduationCap, Briefcase, Building2, Cpu, ShieldCheck, Sparkles } from 'lucide-react';

const HeroNodeCanvas = () => {
  const [activeNode, setActiveNode] = useState(null);

  const nodes = [
    { id: 'students', label: 'Students', icon: Users, color: '#8b5cf6', category: 'People Linking', pos: { x: 18, y: 22 } },
    { id: 'teachers', label: 'Teachers', icon: GraduationCap, color: '#10b981', category: 'People Linking', pos: { x: 50, y: 12 } },
    { id: 'recruiters', label: 'Recruiters', icon: Briefcase, color: '#06b6d4', category: 'Opportunity Linking', pos: { x: 82, y: 22 } },
    { id: 'departments', label: 'Departments', icon: Building2, color: '#3b82f6', category: 'Data Linking', pos: { x: 15, y: 75 } },
    { id: 'institution', label: 'Institution', icon: ShieldCheck, color: '#f59e0b', category: 'Data Linking', pos: { x: 50, y: 88 } },
    { id: 'ai', label: 'MAVI AI', icon: Cpu, color: '#ec4899', category: 'Intelligence Linking', pos: { x: 85, y: 75 } },
  ];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '840px',
        height: '420px',
        margin: '3rem auto 0 auto',
        borderRadius: '24px',
        background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15) 0%, var(--bg-card) 75%)',
        border: '1px solid var(--border-glow, rgba(139, 92, 246, 0.3))',
        boxShadow: 'var(--shadow-glow-strong)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* SVG Connected Lines */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {nodes.map((node) => (
          <g key={`edge-${node.id}`}>
            <line
              x1="50"
              y1="50"
              x2={node.pos.x}
              y2={node.pos.y}
              stroke={activeNode === node.id ? node.color : 'rgba(139, 92, 246, 0.3)'}
              strokeWidth={activeNode === node.id ? '0.8' : '0.4'}
              strokeDasharray="2 2"
            />
            {/* Animated Flow Dot */}
            <circle r="0.8" fill={node.color}>
              <animateMotion
                path={`M50,50 L${node.pos.x},${node.pos.y}`}
                dur={`${3 + Math.random() * 2}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}
      </svg>

      {/* Central Hub Node: MAVI LINKING */}
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(59, 130, 246, 0.95))',
          padding: '1.25rem 2rem',
          borderRadius: '50px',
          boxShadow: '0 0 35px rgba(139, 92, 246, 0.6)',
          border: '2px solid rgba(255, 255, 255, 0.4)',
          textAlign: 'center',
          cursor: 'pointer',
        }}
      >
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '800', color: '#e0e7ff' }}>
          Central Operating Hub
        </div>
        <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#ffffff', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={20} /> MAVI LINKING
        </div>
      </motion.div>

      {/* Connected Outer Nodes */}
      {nodes.map((node) => {
        const NodeIcon = node.icon;
        const isActive = activeNode === node.id;
        return (
          <motion.div
            key={node.id}
            onMouseEnter={() => setActiveNode(node.id)}
            onMouseLeave={() => setActiveNode(null)}
            whileHover={{ scale: 1.1 }}
            style={{
              position: 'absolute',
              top: `${node.pos.y}%`,
              left: `${node.pos.x}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 5,
              background: 'var(--bg-glass)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: `1px solid ${isActive ? node.color : 'var(--border-color)'}`,
              boxShadow: isActive ? `0 0 20px ${node.color}` : 'var(--shadow-card)',
              padding: '0.6rem 1rem',
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: `${node.color}25`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: node.color,
              }}
            >
              <NodeIcon size={16} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>{node.label}</span>
          </motion.div>
        );
      })}

      {/* Linking Mode Indicators at Bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '0.75rem',
          display: 'flex',
          gap: '1.25rem',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          background: 'var(--bg-tertiary)',
          padding: '0.35rem 1rem',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8b5cf6' }}></span> People Linking</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }}></span> Data Linking</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ec4899' }}></span> Intelligence Linking</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4' }}></span> Opportunity Linking</span>
      </div>
    </div>
  );
};

export default HeroNodeCanvas;
