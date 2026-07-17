import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import api from '../../api/axios';

const SyncLeetCodeButton = ({ username, onSyncSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [inputUsername, setInputUsername] = useState(username || '');
  const [isEditing, setIsEditing] = useState(!username);

  const handleSync = async () => {
    if (!inputUsername.trim()) return alert('Please enter a LeetCode username');
    setLoading(true);
    try {
      const res = await api.post('/leetcode/sync', { username: inputUsername });
      if (res.data.success) {
        setIsEditing(false);
        if (onSyncSuccess) onSyncSuccess(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to sync LeetCode profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 255, 255, 0.03)' }}>
      <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/LeetCode_logo_black.png" alt="LeetCode" style={{ width: '24px', height: '24px', filter: 'brightness(0) invert(1)' }} />
      {isEditing ? (
        <>
          <input 
            type="text" 
            placeholder="LeetCode Username"
            value={inputUsername}
            onChange={(e) => setInputUsername(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', flex: 1 }}
          />
          <button onClick={handleSync} disabled={loading} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
            {loading ? <RefreshCw size={16} className="animate-spin" /> : 'Connect & Sync'}
          </button>
        </>
      ) : (
        <>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 'bold' }}>{inputUsername}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '1rem' }}>Connected</span>
          </div>
          <button onClick={handleSync} disabled={loading} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> 
            {loading ? 'Syncing...' : 'Sync Now'}
          </button>
          <button onClick={() => setIsEditing(true)} className="btn" style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border-color)' }}>Edit</button>
        </>
      )}
    </div>
  );
};

export default SyncLeetCodeButton;
