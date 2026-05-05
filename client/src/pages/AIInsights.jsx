import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import { Cpu, RefreshCw, AlertCircle } from 'lucide-react';

const AIInsights = () => {
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInsights = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/scores/insights');
      setInsights(res.data.data.insights);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load AI insights. Ensure you have linked at least one account and your API key is configured.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <DashboardLayout>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu className="text-gradient" size={32} />
            AI-Driven Insights
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Personalized career advice and technical growth recommendations based on your aggregated metrics.</p>
        </div>
        <button onClick={fetchInsights} disabled={loading} className="btn btn-outline" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Analyzing...' : 'Regenerate'}
        </button>
      </header>

      {error ? (
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <AlertCircle size={24} color="#ef4444" />
          <p style={{ color: '#fca5a5' }}>{error}</p>
        </div>
      ) : loading ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
          <Cpu size={48} className="text-gradient animate-pulse" style={{ margin: '0 auto 1.5rem auto', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Consulting the Intelligence Engine...</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Analyzing your GitHub repos, competitive programming stats, and community contributions.</p>
        </div>
      ) : (
        <div className="glass-card animate-fade-in delay-100" style={{ lineHeight: '1.8', fontSize: '1.1rem' }}>
          {insights.split('\n').map((line, idx) => {
            if (line.startsWith('###') || line.startsWith('**')) {
              return <h3 key={idx} style={{ marginTop: '1.5rem', marginBottom: '0.5rem', color: 'white' }}>{line.replace(/#/g, '').replace(/\*\*/g, '')}</h3>;
            }
            if (line.startsWith('- ')) {
              return <li key={idx} style={{ marginLeft: '1.5rem', color: 'var(--text-secondary)' }}>{line.replace('- ', '')}</li>;
            }
            if (line.trim() === '') return <br key={idx} />;
            return <p key={idx} style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{line}</p>;
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AIInsights;
