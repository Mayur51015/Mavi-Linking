import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

const ActivityFeed = () => {
  const { user, socket } = useContext(AuthContext);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Fetch historical
    api.get('/ai/activities').then(res => setActivities(res.data.data)).catch(console.error);
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    const handleNewActivity = (activity) => {
      setActivities(prev => [activity, ...prev].slice(0, 50));
    };

    socket.on('new_activity', handleNewActivity);

    return () => {
      socket.off('new_activity', handleNewActivity);
    };
  }, [socket]);

  return (
    <div className="glass-card" style={{ padding: '2rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ marginBottom: '1.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Activity size={24} color="#10b981" />
        Real-time Activity Feed
      </h3>
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem' }}>
        <AnimatePresence>
          {activities.length === 0 ? (
             <div style={{ color: 'var(--text-secondary)' }}>No activities yet. Start coding!</div>
          ) : (
            activities.map((act) => (
              <motion.div 
                key={act._id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                style={{ 
                  padding: '1rem', 
                  background: 'rgba(255,255,255,0.02)', 
                  marginBottom: '0.75rem', 
                  borderRadius: '8px',
                  borderLeft: '3px solid var(--accent-blue)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <strong style={{ color: 'white' }}>{act.title}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(act.date).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{act.description}</div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ActivityFeed;
