import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { Award, CheckCircle, FileText, GitMerge, Code2, Briefcase, Trophy } from 'lucide-react';

const GithubIcon = ({ size = 32, color = "currentColor" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

const iconMap = {
  'CheckCircle': <CheckCircle size={32} color="var(--accent-blue)" />,
  'FileText': <FileText size={32} color="var(--accent-purple)" />,
  'GitMerge': <GitMerge size={32} color="var(--text-primary)" />,
  'Code2': <Code2 size={32} color="var(--accent-amber)" />,
  'Briefcase': <Briefcase size={32} color="var(--accent-cyan)" />,
  'Trophy': <Trophy size={32} color="var(--accent-red)" />,
  'Github': <GithubIcon size={32} color="var(--text-primary)" />,
  'GitHub': <GithubIcon size={32} color="var(--text-primary)" />,
  'Award': <Award size={32} color="var(--accent-emerald)" />,
};

const BadgeShowcase = ({ userId }) => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await api.get(`/career/badges/${userId}`);
        setBadges(res.data.data);
      } catch (error) {
        console.error('Failed to load badges:', error);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchBadges();
  }, [userId]);

  if (loading) {
    return (
      <div className="glass-card" style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }}></div>
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
        <Award size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <p>No badges unlocked yet.</p>
        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Complete your profile, add projects, and link accounts to earn badges.</p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Award size={24} color="var(--accent-amber)" />
        Badges Unlocked
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
        {badges.map((badge, i) => (
          <motion.div
            key={badge._id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.25rem 0.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.1)', borderColor: 'var(--accent-blue)' }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--bg-dark)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '0.75rem',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              {iconMap[badge.icon] || <Award size={32} color="var(--accent-blue)" />}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
              {badge.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default BadgeShowcase;
