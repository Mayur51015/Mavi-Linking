import React, { useState, useContext, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, X, Zap, Heart, Search, BadgeCheck, Loader2 } from 'lucide-react';
import UserLayout from '../layouts/UserLayout';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const CompatibilityPage = () => {
  const { user } = useContext(AuthContext);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/compatibility/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const filtered = (res.data.data || []).filter(
          u => !selectedUsers.some(s => s._id === u._id)
        );
        setSearchResults(filtered);
        setShowDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, selectedUsers]);

  const addUser = (u) => {
    if (selectedUsers.length >= 5) return;
    setSelectedUsers(prev => [...prev, u]);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const removeUser = (id) => {
    setSelectedUsers(prev => prev.filter(u => u._id !== id));
  };

  const handleCompare = async () => {
    const ids = [user._id, ...selectedUsers.map(u => u._id)];
    if (ids.length < 2) {
      setError('Add at least one other team member to compare.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/compatibility/compare', { userIds: ids });
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Comparison failed. Make sure users have linked accounts.');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score) =>
    score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';

  const scoreLabel = (score) =>
    score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Low';

  return (
    <UserLayout>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Heart size={28} /> Team Compatibility
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Find the perfect team match by comparing developer profiles.</p>
      </header>

      {/* Team Builder */}
      <div className="glass-card-static" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} style={{ color: 'var(--accent-purple)' }} /> Build Your Team
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Your profile is automatically included. Search and add team members by name.
        </p>

        {/* Current User (You) */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.75rem 1rem', borderRadius: '10px',
          background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)',
          marginBottom: '1rem',
        }}>
          <div className="avatar-gradient" style={{ width: '36px', height: '36px', fontSize: '0.9rem', flexShrink: 0 }}>
            {user?.name?.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {user?.name}
              {user?.isVerified && <BadgeCheck size={14} style={{ color: 'var(--accent-cyan)' }} />}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              You • Score: {user?.scores?.overall || 0}
            </div>
          </div>
          <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>You</span>
        </div>

        {/* Selected Team Members */}
        {selectedUsers.length > 0 && (
          <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
            {selectedUsers.map((u, i) => (
              <motion.div
                key={u._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="avatar-gradient" style={{ width: '36px', height: '36px', fontSize: '0.9rem', flexShrink: 0 }}>
                  {u.name?.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {u.name}
                    {u.isVerified && <BadgeCheck size={14} style={{ color: 'var(--accent-cyan)' }} />}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {u.university?.name || 'N/A'} • Score: {u.scores?.overall || 0}
                  </div>
                </div>
                <button
                  onClick={() => removeUser(u._id)}
                  style={{
                    background: 'none', border: 'none', color: '#fca5a5',
                    cursor: 'pointer', padding: '0.25rem',
                  }}
                >
                  <X size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Search Input */}
        {selectedUsers.length < 5 && (
          <div ref={searchRef} style={{ position: 'relative', marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{
                position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', pointerEvents: 'none',
              }} />
              <input
                className="input-field"
                placeholder="Search by name or username..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                style={{ paddingLeft: '2.75rem' }}
              />
              {searching && (
                <Loader2 size={18} style={{
                  position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--accent-purple)', animation: 'spin 1s linear infinite',
                }} />
              )}
            </div>

            {/* Search Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  marginTop: '0.5rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                  zIndex: 50,
                  maxHeight: '280px',
                  overflowY: 'auto',
                }}
              >
                {searchResults.map(u => (
                  <button
                    key={u._id}
                    onClick={() => addUser(u)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem 1rem', width: '100%',
                      background: 'transparent', border: 'none',
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer', color: 'var(--text-primary)',
                      textAlign: 'left', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div className="avatar-gradient" style={{ width: '32px', height: '32px', fontSize: '0.8rem', flexShrink: 0 }}>
                      {u.name?.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {u.name}
                        {u.isVerified && <BadgeCheck size={12} style={{ color: 'var(--accent-cyan)' }} />}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {u.username ? `@${u.username}` : ''} {u.university?.name ? `• ${u.university.name}` : ''}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', fontFamily: 'Outfit', color: 'var(--accent-purple)' }}>
                      {u.scores?.overall || 0}
                    </div>
                    <Plus size={16} style={{ color: 'var(--accent-emerald)' }} />
                  </button>
                ))}
              </motion.div>
            )}

            {showDropdown && searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                marginTop: '0.5rem', padding: '1rem',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)', textAlign: 'center',
                color: 'var(--text-muted)', fontSize: '0.85rem', zIndex: 50,
              }}>
                No users found matching "{searchQuery}"
              </div>
            )}
          </div>
        )}

        {error && <p style={{ color: '#fca5a5', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={handleCompare}
            disabled={loading || selectedUsers.length === 0}
            className="btn btn-primary"
          >
            <Zap size={16} /> {loading ? 'Analyzing...' : 'Analyze Compatibility'}
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {selectedUsers.length + 1} member{selectedUsers.length > 0 ? 's' : ''} in team
          </span>
        </div>
      </div>

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Overall Score */}
          <div className="gradient-border-card" style={{ textAlign: 'center', padding: '2.5rem', marginBottom: '2rem' }}>
            <div style={{
              fontSize: '4.5rem', fontWeight: '800', fontFamily: 'Outfit',
              color: scoreColor(result.compatibility.overallScore),
              lineHeight: 1,
            }}>
              {result.compatibility.overallScore}%
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginTop: '0.5rem' }}>
              Team Compatibility — <span style={{ color: scoreColor(result.compatibility.overallScore), fontWeight: '600' }}>
                {scoreLabel(result.compatibility.overallScore)}
              </span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="glass-card-static" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Compatibility Breakdown</h3>
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {Object.entries(result.compatibility.breakdown || {}).map(([key, val]) => {
                const labels = {
                  skillComplementarity: '🧩 Skill Complementarity',
                  workStyleMatch: '💼 Work Style Match',
                  codingBehavior: '💻 Coding Behavior',
                  contributionBalance: '⚖️ Contribution Balance',
                  personalityFit: '🧠 Personality Fit',
                };
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {labels[key] || key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span style={{ color: scoreColor(val), fontWeight: '700', fontFamily: 'Outfit' }}>{val}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: '8px' }}>
                      <div className="progress-bar-fill" style={{ width: `${val}%`, background: scoreColor(val) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team Members with Roles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {result.users.map(u => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card"
                style={{ textAlign: 'center', padding: '1.5rem' }}
              >
                <div className="avatar-gradient" style={{ width: '56px', height: '56px', fontSize: '1.5rem', margin: '0 auto 0.75rem' }}>
                  {u.name?.charAt(0)}
                </div>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{u.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                  Score: {u.scores?.overall || 0}
                </div>
                {result.compatibility.recommendedRoles?.[u.id] && (
                  <span className="badge badge-purple">{result.compatibility.recommendedRoles[u.id]}</span>
                )}
              </motion.div>
            ))}
          </div>

          {/* Complementary Strengths */}
          {result.compatibility.complementaryStrengths?.length > 0 && (
            <div className="glass-card-static" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>🌟 Complementary Strengths</h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {result.compatibility.complementaryStrengths.map((s, i) => (
                  <div key={i} style={{
                    padding: '0.5rem 0.75rem', borderRadius: '8px',
                    background: 'rgba(139, 92, 246, 0.06)', fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                  }}>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Summary */}
          {result.compatibility.aiSummary && (
            <div className="glass-card-static" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.75rem' }}>🤖 AI Analysis</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{result.compatibility.aiSummary}</p>
            </div>
          )}
        </motion.div>
      )}
    </UserLayout>
  );
};

export default CompatibilityPage;
