import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart as PieIcon, TrendingUp, Users, Briefcase } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import UserLayout from '../../layouts/UserLayout';
import api from '../../api/axios';

const Analytics = () => {
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplications: 0,
    totalInterviews: 0,
    totalHired: 0,
    hiringTrends: [],
    departmentData: []
  });
  const [loading, setLoading] = useState(false);
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recruiter/stats');
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
          <PieIcon size={28} /> Recruiter Analytics
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Overview of your hiring pipeline and trends.</p>
      </header>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading analytics...</div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '2rem' }}>
          
          <div className="stats-grid">
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <Briefcase size={24} />
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'Outfit' }}>{stats.totalJobs || 0}</div>
                <div style={{ color: 'var(--text-secondary)' }}>Total Jobs</div>
              </div>
            </div>
            
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                <Users size={24} />
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'Outfit' }}>{stats.totalApplications || 0}</div>
                <div style={{ color: 'var(--text-secondary)' }}>Total Applications</div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <PieIcon size={24} />
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'Outfit' }}>{stats.totalInterviews || 0}</div>
                <div style={{ color: 'var(--text-secondary)' }}>Interviews Scheduled</div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <TrendingUp size={24} />
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'Outfit' }}>{stats.totalHired || 0}</div>
                <div style={{ color: 'var(--text-secondary)' }}>Candidates Hired</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Hiring Trends</h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.hiringTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorHires" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="applications" stroke="#3b82f6" fillOpacity={1} fill="url(#colorApps)" />
                    <Area type="monotone" dataKey="hires" stroke="#10b981" fillOpacity={1} fill="url(#colorHires)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Department-wise Hiring</h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.departmentData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" paddingAngle={5} dataKey="value" label>
                      {stats.departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </motion.div>
      )}
    </UserLayout>
  );
};

export default Analytics;
