import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, X, Zap, Heart } from 'lucide-react';
import UserLayout from '../layouts/UserLayout';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const CompatibilityPage = () => {
  const { user } = useContext(AuthContext);
  const [userIds, setUserIds] = useState([]);
  const [inputId, setInputId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addUser = () => {
    if (inputId.trim() && !userIds.includes(inputId.trim())) {
      setUserIds(prev => [...prev, inputId.trim()]);
      setInputId('');
    }
  };

  const removeUser = (id) => setUserIds(prev => prev.filter(uid => uid !== id));

  const handleCompare = async () => {
    const ids = [...userIds];
    if (user?._id && !ids.includes(user._id)) ids.unshift(user._id);
    if (ids.length < 2) { setError('Add at least one other user ID.'); return; }

    setLoading(true); setError('');
    try {
      const res = await api.post('/compatibility/compare', { userIds: ids });
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score) => score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <UserLayout>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Heart size={28} /> Team Compatibility
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Compare developer profiles to find the perfect team match.</p>
      </header>

      {/* Input Section */}
      <div className="glass-card-static" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          Your profile is automatically included. Add other user IDs to compare.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <input className="input-field" placeholder="Enter User ID..." value={inputId}
            onChange={e => setInputId(e.target.value)} onKeyDown={e => e.key === 'Enter' && addUser()} style={{ flex: 1 }} />
          <button onClick={addUser} className="btn btn-outline btn-sm"><Plus size={16} /> Add</button>
        </div>

        {userIds.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {userIds.map(id => (
              <span key={id} className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem' }}>
                {id.slice(0, 8)}...
                <button onClick={() => removeUser(id)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><X size={12} /></button>
              </span>
            ))}
          </div>
        )}

        {error && <p style={{ color: '#fca5a5', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

        <button onClick={handleCompare} disabled={loading || userIds.length === 0} className="btn btn-primary">
          <Zap size={16} /> {loading ? 'Analyzing...' : 'Analyze Compatibility'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Overall Score */}
          <div className="gradient-border-card" style={{ textAlign: 'center', padding: '2.5rem', marginBottom: '2rem' }}>
            <div style={{ fontSize: '4rem', fontWeight: '800', fontFamily: 'Outfit', color: scoreColor(result.compatibility.overallScore) }}>
              {result.compatibility.overallScore}%
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Team Compatibility Score</div>
          </div>

          {/* Breakdown */}
          <div className="glass-card-static" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Compatibility Breakdown</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {Object.entries(result.compatibility.breakdown || {}).map(([key, val]) => (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span style={{ color: scoreColor(val), fontWeight: '600' }}>{val}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: '8px' }}>
                    <div className="progress-bar-fill" style={{ width: `${val}%`, background: scoreColor(val) }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Members */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {result.users.map(u => (
              <div key={u.id} className="glass-card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                <div className="avatar-gradient" style={{ width: '56px', height: '56px', fontSize: '1.5rem', margin: '0 auto 0.75rem' }}>{u.name?.charAt(0)}</div>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{u.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Score: {u.scores?.overall || 0}</div>
                {result.compatibility.recommendedRoles?.[u.id] && (
                  <span className="badge badge-purple">{result.compatibility.recommendedRoles[u.id]}</span>
                )}
              </div>
            ))}
          </div>

          {/* AI Summary */}
          {result.compatibility.aiSummary && (
            <div className="glass-card-static" style={{ padding: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>{result.compatibility.aiSummary}</p>
            </div>
          )}
        </motion.div>
      )}
    </UserLayout>
  );
};

export default CompatibilityPage;
