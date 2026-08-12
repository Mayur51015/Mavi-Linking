import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';

const SyncLeetCodeButton = ({ username, onSyncSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [inputUsername, setInputUsername] = useState(username || '');
  const [isEditing, setIsEditing] = useState(!username);
  const [fieldError, setFieldError] = useState('');
  const toast = useToast();

  const handleSync = async () => {
    if (!inputUsername.trim()) {
      setFieldError('Please enter a LeetCode username');
      return;
    }
    setFieldError('');
    setLoading(true);
    try {
      const res = await api.post('/leetcode/sync', { username: inputUsername });
      if (res.data.success) {
        setIsEditing(false);
        toast.success('LeetCode profile synced successfully.');
        if (onSyncSuccess) onSyncSuccess(res.data.data);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to sync LeetCode profile. Please check the username and try again.'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 255, 255, 0.03)' }}>
      <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/LeetCode_logo_black.png" alt="LeetCode" style={{ width: '24px', height: '24px', filter: 'brightness(0) invert(1)' }} />
      {isEditing ? (
        <>
<div style={{ flex: 1 }}>
            <input 
              type="text" 
              placeholder="LeetCode Username"
              value={inputUsername}
              onChange={(e) => { setInputUsername(e.target.value); setFieldError(''); }}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: `1px solid ${fieldError ? '#ef4444' : 'var(--border-color)'}`, background: 'transparent', color: 'var(--text-primary)' }}
            />
            {fieldError && <span style={{ color: '#fca5a5', fontSize: '0.75rem' }}>{fieldError}</span>}
          </div>
          <button onClick={handleSync} disabled={loading} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>            {loading ? <RefreshCw size={16} className="animate-spin" /> : 'Connect & Sync'}
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
