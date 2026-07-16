import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import SyncLeetCodeButton from './SyncLeetCodeButton';
import LeetCodeStatsCard from './LeetCodeStatsCard';
import ProblemBreakdownChart from './ProblemBreakdownChart';
import AIInsightCard from './AIInsightCard';
import RecentSubmissions from './RecentSubmissions';
import BadgeList from './BadgeList';

const LeetCodeSection = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyLeetCode();
  }, []);

  const fetchMyLeetCode = async () => {
    try {
      const res = await api.get('/leetcode/me');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      // 404 means not synced yet
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSuccess = (newData) => {
    setData(newData);
  };

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Loading LeetCode Intelligence...</div>;

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem' }}>LeetCode Intelligence</h2>
        <SyncLeetCodeButton username={data?.username} onSyncSuccess={handleSyncSuccess} />
      </div>

      {data ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <LeetCodeStatsCard data={data} />
            <ProblemBreakdownChart data={data} />
          </div>
          
          {data.aiInsight && (
            <AIInsightCard insight={data.aiInsight} />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <RecentSubmissions submissions={data.recentSubmissions} />
            <BadgeList badges={data.badges} />
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/LeetCode_logo_black.png" alt="LeetCode" style={{ width: '48px', height: '48px', filter: 'brightness(0) invert(1)', opacity: 0.5, marginBottom: '1rem' }} />
          <h3>Connect your LeetCode account</h3>
          <p>Sync your LeetCode profile to unlock AI insights, problem breakdowns, and competitive analytics.</p>
        </div>
      )}
    </div>
  );
};

export default LeetCodeSection;
