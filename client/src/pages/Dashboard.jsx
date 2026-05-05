import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { Globe, GitBranch, Code2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [scores, setScores] = useState(null);
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/scores/me');
        setScores(res.data.data.scores);
        setRank(res.data.data.rank);
      } catch (error) {
        console.error("Failed to fetch scores", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <DashboardLayout>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome, {user?.name}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Here's your aggregated developer intelligence overview.</p>
          </div>
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
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading intelligence data...</div>
        ) : (
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
        )}
    </DashboardLayout>
  );
};

export default Dashboard;
