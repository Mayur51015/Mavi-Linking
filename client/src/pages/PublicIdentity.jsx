import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Terminal, GitBranch, Code2, Globe, Database, ExternalLink,
  BadgeCheck, QrCode, Download, Share2, Award, TrendingUp,
  Cpu, Users, Star, Briefcase,
} from 'lucide-react';
import api from '../api/axios';
import QRModal from '../components/QRModal';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const tierColors = {
  'Bronze': '#cd7f32',
  'Silver': '#c0c0c0',
  'Gold': '#ffd700',
  'Platinum': '#e5e4e2',
  'Diamond': '#b9f2ff',
  'Elite Developer': undefined, // uses gradient
};

const PublicIdentity = () => {
  const { username } = useParams();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/public/u/${username}`);
        setData(res.data.data);
      } catch {
        setError('Developer profile not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);


  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="animate-pulse" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Loading identity...</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <div style={{ fontSize: '3rem' }}>🔍</div>
      <div style={{ color: '#fca5a5', fontSize: '1.25rem' }}>{error}</div>
      <Link to="/" className="btn btn-outline">Back to Home</Link>
    </div>
  );

  if (!data) return null;

  const { profile, scores, aiInsights, dna, ranking, stats, projects, analytics } = data;

  return (
    <>
      {/* Nav */}
      <nav className="navbar">
        <div className="container nav-container">
          <Link to="/" className="nav-brand">
            <Terminal size={24} className="text-gradient" />
            <span>MaVi Linking</span>
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowQR(true)}>
              <QrCode size={18} /> QR
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => navigator.clipboard.writeText(window.location.href)}>
              <Share2 size={16} /> Share
            </button>
          </div>
        </div>
      </nav>

      <main className="container" style={{ paddingBottom: '5rem', maxWidth: '1000px' }}>
        {/* Hero Section */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="glass-card-static"
          style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '3rem', marginTop: '2rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
          
          <div className="avatar-gradient" style={{ width: '100px', height: '100px', fontSize: '2.5rem', flexShrink: 0 }}>
            {profile.avatar ? <img src={profile.avatar} alt={profile.name} className="avatar" style={{ width: '100px', height: '100px' }} /> : profile.name?.charAt(0)}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '2rem' }}>{profile.name}</h1>
              {profile.isVerified && (
                <span className="verified-badge"><BadgeCheck size={20} /> Verified</span>
              )}
            </div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '1rem' }}>
              @{profile.username}
            </div>
            {profile.bio && <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{profile.bio}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {ranking && (
                <span className="badge badge-purple" style={{ fontSize: '0.8rem' }}>
                  <Award size={14} />
                  <span className={`tier-${ranking.tier.toLowerCase().replace(' ', '-')}`}>{ranking.tier}</span>
                </span>
              )}
              <span className="badge badge-primary">
                <Star size={14} /> Score: {scores.overall}/1000
              </span>
              {aiInsights?.specialization && (
                <span className="badge badge-emerald">
                  <Cpu size={14} /> {aiInsights.specialization}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="tabs">
          {['overview', 'skills', 'platforms', 'projects'].map(tab => (
            <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.4 }}>
            {/* Score Cards */}
            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
              {[
                { label: 'Development', value: scores.development, icon: <GitBranch size={24} />, color: 'var(--accent-blue)' },
                { label: 'Problem Solving', value: scores.problemSolving, icon: <Code2 size={24} />, color: 'var(--accent-purple)' },
                { label: 'Knowledge', value: scores.knowledge, icon: <Database size={24} />, color: 'var(--accent-cyan)' },
                { label: 'Overall', value: scores.overall, icon: <Globe size={24} />, color: 'var(--accent-emerald)' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="glass-card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ color, marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>{icon}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{label}</div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'Outfit' }}>{value}</div>
                  <div className="progress-bar" style={{ marginTop: '0.75rem' }}>
                    <div className="progress-bar-fill" style={{ width: `${(value / 1000) * 100}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* DNA Card */}
            {dna && (
              <div className="gradient-border-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🧬</span> Developer DNA
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Personality</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>{dna.personalityType}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Work Style</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>{dna.workingStyle}</div>
                  </div>
                </div>
                {dna.description && <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>{dna.description}</p>}
                
                {/* DNA Scores */}
                <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  {Object.entries(dna.scores || {}).map(([key, val]) => (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span>{val}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insights */}
            {aiInsights && (
              <div className="glass-card-static" style={{ marginBottom: '2rem', padding: '2rem' }}>
                <h3 className="section-header" style={{ margin: '0 0 1.5rem 0' }}><Cpu size={20} /> AI Intelligence</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div>
                    <h4 style={{ color: 'var(--accent-emerald)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Strengths</h4>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {(aiInsights.strengths || []).map((s, i) => (
                        <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>✦ {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--accent-amber)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Areas to Improve</h4>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {(aiInsights.improvements || []).map((s, i) => (
                        <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>◇ {s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && aiInsights && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.4 }}>
            <div className="glass-card-static" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Tech Stack</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                {(aiInsights.techStack || []).map((tech, i) => (
                  <span key={i} className="badge badge-primary" style={{ fontSize: '0.85rem', padding: '0.375rem 0.875rem' }}>{tech}</span>
                ))}
              </div>

              <h3 style={{ marginBottom: '1.5rem' }}>Skill Confidence</h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {Object.entries(aiInsights.confidenceScores || {}).sort((a, b) => b[1] - a[1]).map(([skill, score]) => (
                  <div key={skill}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      <span>{skill}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{score}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: '8px' }}>
                      <div className="progress-bar-fill" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {aiInsights.careerRecommendations && (
              <div className="glass-card-static" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Career Recommendations</h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {aiInsights.careerRecommendations.map((rec, i) => (
                    <li key={i} style={{ color: 'var(--text-secondary)' }}>🎯 {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* Platforms Tab */}
        {activeTab === 'platforms' && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {stats.github && (
                <div className="glass-card" style={{ padding: '2rem' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <GitBranch size={20} /> GitHub
                  </h4>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Repositories</span><strong>{stats.github.publicRepos}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Followers</span><strong>{stats.github.followers}</strong></div>
                    {stats.github.company && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Company</span><strong>{stats.github.company}</strong></div>}
                    {stats.github.location && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Location</span><strong>{stats.github.location}</strong></div>}
                  </div>
                </div>
              )}

              {stats.leetcode && (
                <div className="glass-card" style={{ padding: '2rem' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <Code2 size={20} /> LeetCode
                  </h4>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Total Solved</span><strong>{stats.leetcode.solved}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#34d399' }}>Easy</span><strong>{stats.leetcode.easy}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#fbbf24' }}>Medium</span><strong>{stats.leetcode.medium}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#ef4444' }}>Hard</span><strong>{stats.leetcode.hard}</strong></div>
                  </div>
                </div>
              )}

              {stats.codeforces && (
                <div className="glass-card" style={{ padding: '2rem' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <Globe size={20} /> Codeforces
                  </h4>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Rating</span><strong>{stats.codeforces.rating}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Max Rating</span><strong>{stats.codeforces.maxRating}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Rank</span><strong style={{ textTransform: 'capitalize' }}>{stats.codeforces.rank}</strong></div>
                  </div>
                </div>
              )}

              {stats.stackoverflow && (
                <div className="glass-card" style={{ padding: '2rem' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <Database size={20} /> Stack Overflow
                  </h4>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Reputation</span><strong>{stats.stackoverflow.reputation}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#fbbf24' }}>Gold</span><strong>{stats.stackoverflow.badges?.gold}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Silver</span><strong>{stats.stackoverflow.badges?.silver}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#b45309' }}>Bronze</span><strong>{stats.stackoverflow.badges?.bronze}</strong></div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.4 }}>
            {projects.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                <Briefcase size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No projects showcased yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {projects.map(proj => (
                  <div key={proj._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>{proj.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', flex: 1 }}>{proj.description}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem' }}>
                      {proj.technologies.map((tech, idx) => (
                        <span key={idx} className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{tech}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                      {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><GitBranch size={14} /> Code</a>}
                      {proj.liveUrl && <a href={proj.liveUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><ExternalLink size={14} /> Live</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* QR Modal */}
      {showQR && <QRModal username={profile.username} onClose={() => setShowQR(false)} />}
    </>
  );
};

export default PublicIdentity;
