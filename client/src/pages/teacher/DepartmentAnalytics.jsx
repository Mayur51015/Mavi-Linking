import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart as BarChartIcon, BookOpen, GraduationCap, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import UserLayout from '../../layouts/UserLayout';
import api from '../../api/axios';

const DepartmentAnalytics = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    placedStudents: 0,
    averageScore: 0,
    topPerformerScore: 0
  });
  const [loading, setLoading] = useState(false);

  // Mock data for charts
  const performanceData = [
    { name: 'Jan', score: 65 },
    { name: 'Feb', score: 68 },
    { name: 'Mar', score: 72 },
    { name: 'Apr', score: 75 },
    { name: 'May', score: 78 },
    { name: 'Jun', score: 82 },
  ];

  const skillDistribution = [
    { skill: 'React', count: 45 },
    { skill: 'Node.js', count: 38 },
    { skill: 'Python', count: 52 },
    { skill: 'Java', count: 30 },
    { skill: 'C++', count: 25 },
  ];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await api.get('/teacher/stats');
      if (res.data.data) {
        setStats(prev => ({ ...prev, ...res.data.data }));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <UserLayout>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChartIcon size={28} /> Department Analytics
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track student performance and placement readiness.</p>
      </header>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading analytics...</div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '2rem' }}>
          
          <div className="stats-grid">
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <Users size={24} />
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'Outfit' }}>{stats.totalStudents || 0}</div>
                <div style={{ color: 'var(--text-secondary)' }}>Total Students</div>
              </div>
            </div>
            
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <GraduationCap size={24} />
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'Outfit' }}>{stats.placedStudents || 0}</div>
                <div style={{ color: 'var(--text-secondary)' }}>Placed Students</div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <TrendingUp size={24} />
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'Outfit' }}>{Math.round(stats.averageScore || 0)}</div>
                <div style={{ color: 'var(--text-secondary)' }}>Average Score</div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                <BookOpen size={24} />
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'Outfit' }}>{stats.topPerformerScore || 0}</div>
                <div style={{ color: 'var(--text-secondary)' }}>Top Score</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Average Score Trend</h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Top Skills in Department</h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skillDistribution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="skill" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </motion.div>
      )}
    </UserLayout>
  );
};

// Simple icon missing in lucide-react import
const Users = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default DepartmentAnalytics;
