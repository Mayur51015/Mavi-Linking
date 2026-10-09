import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import SyncLeetCodeButton from './SyncLeetCodeButton';
import LeetCodeStatsCard from './LeetCodeStatsCard';
import ProblemBreakdownChart from './ProblemBreakdownChart';
import AIInsightCard from './AIInsightCard';
import RecentSubmissions from './RecentSubmissions';
import BadgeList from './BadgeList';
import { SkeletonCard } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import { Code2, RefreshCw } from 'lucide-react';

const LeetCodeSection = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const syncBtnRef = useRef(null);

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

  if (loading) return (
    <div style={{ marginTop: '2rem' }} aria-busy="true" aria-label="Loading LeetCode statistics">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <SkeletonCard lines={4} height="220px" />
        <SkeletonCard lines={4} height="220px" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '1.5rem' }}>
        <SkeletonCard lines={3} height="200px" />
        <SkeletonCard lines={3} height="200px" />
      </div>
    </div>
  );

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', fontFamily: 'Inter, sans-serif', margin: 0 }}>
            Coding & LeetCode Intelligence
          </h2>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8125rem', color: '#6B7280' }}>
            Verified problem-solving analytics, submissions, and competition achievements.
          </p>
        </div>
        {/* Hidden ref target so the EmptyState CTA can click the real sync button */}
        <div ref={syncBtnRef}>
          <SyncLeetCodeButton username={data?.username} onSyncSuccess={handleSyncSuccess} />
        </div>
      </div>

      {data ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '1.25rem' }}>
            <LeetCodeStatsCard data={data} />
            <ProblemBreakdownChart data={data} />
          </div>

          {data.aiInsight && (
            <AIInsightCard insight={data.aiInsight} />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '1.25rem' }}>
            <RecentSubmissions submissions={data.recentSubmissions} />
            <BadgeList badges={data.badges} />
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Code2 size={32} color="#2563EB" />}
          iconColor="#2563EB"
          title="Connect your LeetCode account"
          description="Sync your LeetCode profile to unlock AI-powered insights, problem breakdowns, submission history, and competitive analytics."
          action={{
            label: 'Sync LeetCode',
            icon: <RefreshCw size={15} />,
            onClick: () => syncBtnRef.current?.querySelector('button')?.click(),
          }}
          size="lg"
        />
      )}
    </div>
  );
};

export default LeetCodeSection;
