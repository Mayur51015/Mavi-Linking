import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import { GitBranch, Code2, Database, Trash2, Link as LinkIcon } from 'lucide-react';

const PlatformCard = ({ platform, info, onLink, onUnlink }) => {
  const [username, setUsername] = useState('');

  const icons = {
    github: <GitBranch size={24} />,
    leetcode: <Code2 size={24} />,
    codeforces: <Database size={24} />,
    stackoverflow: <Database size={24} />
  };

  const displayNames = {
    github: 'GitHub',
    leetcode: 'LeetCode',
    codeforces: 'Codeforces',
    stackoverflow: 'Stack Overflow'
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {icons[platform]}
        <h3 style={{ fontSize: '1.25rem' }}>{displayNames[platform]}</h3>
        {info.linked && (
          <span style={{ marginLeft: 'auto', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
            Connected
          </span>
        )}
      </div>

      {info.linked ? (
        <div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Linked as: <strong>{info.username}</strong></p>
          <button onClick={() => onUnlink(platform)} className="btn btn-outline" style={{ width: '100%', borderColor: '#ef4444', color: '#fca5a5' }}>
            <Trash2 size={16} /> Unlink
          </button>
        </div>
      ) : (
        <form 
          onSubmit={(e) => { e.preventDefault(); onLink(platform, username); }} 
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: 'auto' }}
        >
          <input 
            type="text" 
            placeholder="Enter Username / Handle" 
            className="input-field" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            <LinkIcon size={16} /> Link Account
          </button>
        </form>
      )}
    </div>
  );
};

const AccountLinking = () => {
  const [platforms, setPlatforms] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchPlatforms = async () => {
    try {
      const res = await api.get('/platforms');
      setPlatforms(res.data.data.platforms);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const handleLink = async (platform, username) => {
    setMessage({ text: 'Linking...', type: 'info' });
    try {
      await api.put(`/platforms/${platform}`, { username });
      setMessage({ text: `${platform} successfully linked!`, type: 'success' });
      fetchPlatforms();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to link account.', type: 'error' });
    }
  };

  const handleUnlink = async (platform) => {
    setMessage({ text: 'Unlinking...', type: 'info' });
    try {
      await api.delete(`/platforms/${platform}`);
      setMessage({ text: `${platform} unlinked.`, type: 'success' });
      fetchPlatforms();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to unlink account.', type: 'error' });
    }
  };

  return (
    <DashboardLayout>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Account Linking</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Connect your external developer platforms to aggregate your intelligence data.</p>
      </header>

      {message.text && (
        <div style={{ 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '2rem', 
          background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(52, 211, 153, 0.1)',
          color: message.type === 'error' ? '#fca5a5' : '#6ee7b7',
          border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`
        }}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Loading accounts...</div>
      ) : (
        <div className="animate-fade-in delay-100" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {platforms && Object.keys(platforms).map((key) => (
            <PlatformCard 
              key={key} 
              platform={key} 
              info={platforms[key]} 
              onLink={handleLink}
              onUnlink={handleUnlink}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AccountLinking;
