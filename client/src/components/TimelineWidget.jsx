import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { Calendar, Briefcase, FileText, Code2, GitMerge, CheckCircle, Award } from 'lucide-react';

const iconMap = {
  'PROJECT': <Briefcase size={20} color="var(--accent-cyan)" />,
  'DOCUMENT': <FileText size={20} color="var(--accent-purple)" />,
  'GITHUB': <GitMerge size={20} color="var(--text-primary)" />,
  'LEETCODE': <Code2 size={20} color="var(--accent-amber)" />,
  'BADGE': <Award size={20} color="var(--accent-amber)" />,
  'ACCOUNT': <CheckCircle size={20} color="var(--accent-blue)" />,
  'CERTIFICATE': <FileText size={20} color="var(--accent-emerald)" />,
  'ACHIEVEMENT': <Award size={20} color="var(--accent-red)" />,
};

const TimelineWidget = ({ userId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await api.get(`/career/timeline/${userId}`);
        setEvents(res.data.data);
      } catch (error) {
        console.error('Failed to load timeline:', error);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchTimeline();
  }, [userId]);

  if (loading) {
    return (
      <div className="glass-card" style={{ height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }}></div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="glass-card" style={{ height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
        <Calendar size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <p>No timeline events yet.</p>
        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Upload documents or add projects to start building your career timeline.</p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ height: '500px', overflowY: 'auto' }}>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Calendar size={24} color="var(--accent-blue)" />
        Career Timeline
      </h3>
      
      <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
        {/* Vertical connecting line */}
        <div style={{
          position: 'absolute',
          top: '0',
          bottom: '0',
          left: '7px',
          width: '2px',
          background: 'linear-gradient(to bottom, var(--accent-blue), var(--accent-purple), transparent)',
          opacity: 0.3
        }}></div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {events.map((event, index) => (
            <motion.div 
              key={event._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              style={{ position: 'relative' }}
            >
              {/* Node dot */}
              <div style={{
                position: 'absolute',
                left: '-1.5rem',
                top: '0.25rem',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'var(--bg-card)',
                border: '2px solid var(--accent-blue)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 2
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-blue)' }}></div>
              </div>

              <div style={{ 
                background: 'rgba(255, 255, 255, 0.03)', 
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1rem',
                marginLeft: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ 
                    padding: '0.5rem', 
                    background: 'var(--bg-dark)', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    {iconMap[event.type] || <CheckCircle size={20} color="var(--text-muted)" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                      <h4 style={{ fontWeight: '600', fontSize: '1rem' }}>{event.title}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(event.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    {event.description && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimelineWidget;
