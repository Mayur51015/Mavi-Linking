import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const SkillRadar = ({ insights }) => {
  if (!insights || !insights.confidenceScores) return null;

  const data = Object.keys(insights.confidenceScores).map(skill => ({
    subject: skill,
    A: insights.confidenceScores[skill],
    fullMark: 100,
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card" 
      style={{ padding: '2rem' }}
    >
      <h3 style={{ marginBottom: '1rem', color: 'white' }}>Skill Detection Engine</h3>
      
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {insights.techStack?.map(tech => (
          <span key={tech} style={{ 
            background: 'var(--bg-card)', 
            padding: '4px 12px', 
            borderRadius: '20px', 
            fontSize: '0.85rem',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {tech}
          </span>
        ))}
      </div>

      <div style={{ height: '300px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.2)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="Skills" dataKey="A" stroke="var(--accent-blue)" fill="var(--accent-blue)" fillOpacity={0.5} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      <div style={{ marginTop: '1rem' }}>
        <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--accent-purple)' }}>Specialization:</strong> {insights.specialization}</div>
      </div>
    </motion.div>
  );
};

export default SkillRadar;
