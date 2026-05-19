import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { Globe, GitBranch, Code2 } from 'lucide-react';
import UserLayout from '../layouts/UserLayout';
import DNACard from '../components/DNACard';
import SkillRadar from '../components/SkillRadar';
import ActivityFeed from '../components/ActivityFeed';
import GrowthChart from '../components/GrowthChart';
import LeaderboardWidget from '../components/LeaderboardWidget';
import ReportGenerator from '../components/ReportGenerator';
import LeetCodeSection from '../components/leetcode/LeetCodeSection';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [scores, setScores] = useState(null);
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // AI State
  const [aiData, setAiData] = useState({ insight: null, dna: null, analytics: [] });
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/scores/me');
        setScores(res.data.data.scores);
        setRank(res.data.data.rank);
        
        // Fetch AI Data concurrently
        const [insightRes, dnaRes, analyticsRes] = await Promise.all([
          api.get('/ai/insights'),
          api.get('/ai/dna'),
          api.get('/ai/analytics')
        ]);
        
        setAiData({
          insight: insightRes.data.data,
          dna: dnaRes.data.data,
          analytics: analyticsRes.data.data || []
        });
        
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleGenerateAIInsights = async () => {
    setGeneratingAI(true);
    try {
      const res = await api.post('/ai/insights/generate');
      setAiData({
        insight: res.data.data.insight,
        dna: res.data.data.dna,
        analytics: aiData.analytics // Optional update
      });
    } catch (err) {
      console.error(err);
      alert('Failed to generate insights. ' + (err.response?.data?.message || ''));
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <UserLayout>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome, {user?.name}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Here's your aggregated developer intelligence overview.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="glass-card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'var(--gradient-primary)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {user?.name?.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: '600' }}>Global Rank</div>
                <div className="text-gradient" style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                  {rank ? `#${rank}` : 'Unranked'}
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleGenerateAIInsights} 
              disabled={generatingAI} 
              className="btn btn-primary"
            >
              {generatingAI ? 'Generating...' : 'Refresh AI Intelligence'}
            </button>
          </div>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading intelligence data...</div>
        ) : (
          <>
            <div className="animate-fade-in delay-100" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
              
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Overall Score</h3>
                  <Globe size={20} color="var(--accent-blue)" />
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'Outfit' }}>
                  {scores?.overall || 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 1000</span>
                </div>
              </div>

              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Development</h3>
                  <GitBranch size={20} color="var(--text-primary)" />
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'Outfit' }}>
                  {scores?.development || 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 1000</span>
                </div>
              </div>

              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Problem Solving</h3>
                  <Code2 size={20} color="var(--accent-purple)" />
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'Outfit' }}>
                  {scores?.problemSolving || 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 1000</span>
                </div>
              </div>

            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
              {aiData.dna && <DNACard dna={aiData.dna} />}
              {aiData.insight && <SkillRadar insights={aiData.insight} />}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
              <GrowthChart analytics={aiData.analytics} />
              <LeaderboardWidget />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
              <ActivityFeed />
              <ReportGenerator />
            </div>

            <LeetCodeSection />
          </>
        )}
    </UserLayout>
  );
};

export default Dashboard;
