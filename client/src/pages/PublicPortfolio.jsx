import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { Terminal, GitBranch, Code2, Globe, Database, ExternalLink, Briefcase } from 'lucide-react';

const PublicPortfolio = () => {
  const { id } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await api.get(`/portfolio/${id}`);
        setPortfolio(res.data.data);
      } catch (err) {
        setError('Portfolio not found. The user may not exist.');
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, [id]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading portfolio...</div>;
  if (error) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fca5a5' }}>{error}</div>;
  if (!portfolio) return null;

  return (
    <>
      <nav className="navbar" style={{ position: 'relative', background: 'transparent', borderBottom: 'none' }}>
        <div className="container nav-container" style={{ justifyContent: 'center' }}>
          <Link to="/" className="nav-brand">
            <Terminal size={24} className="text-gradient" />
            <span style={{ fontSize: '1.25rem' }}>MaVi Linking Portfolio</span>
          </Link>
        </div>
      </nav>

      <main className="container animate-fade-in" style={{ paddingBottom: '5rem', maxWidth: '900px' }}>
        
        {/* Header Section */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '3rem', marginBottom: '2rem', marginTop: '2rem' }}>
          <div style={{ background: 'var(--gradient-primary)', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 'bold' }}>
            {portfolio.profile.name.charAt(0)}
          </div>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{portfolio.profile.name}</h1>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.875rem' }}>
                Overall Score: <strong>{portfolio.scores.overall}/1000</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Scores Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          <div className="glass-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <GitBranch size={28} color="var(--text-primary)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Development</h3>
            <div style={{ fontSize: '2rem', fontWeight: '700' }}>{portfolio.scores.development}</div>
          </div>
          <div className="glass-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <Code2 size={28} color="var(--accent-purple)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Problem Solving</h3>
            <div style={{ fontSize: '2rem', fontWeight: '700' }}>{portfolio.scores.problemSolving}</div>
          </div>
          <div className="glass-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <Database size={28} color="var(--accent-blue)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Knowledge</h3>
            <div style={{ fontSize: '2rem', fontWeight: '700' }}>{portfolio.scores.knowledge}</div>
          </div>
        </div>

        {/* Platform Stats Highlights */}
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', paddingLeft: '0.5rem', borderLeft: '4px solid var(--accent-purple)' }}>Platform Highlights</h2>
        <div className="glass-card" style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            
            {portfolio.stats.github && (
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}><GitBranch size={18}/> GitHub</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li>Public Repos: <strong>{portfolio.stats.github.publicRepos}</strong></li>
                  <li>Followers: <strong>{portfolio.stats.github.followers}</strong></li>
                </ul>
              </div>
            )}

            {portfolio.stats.leetcode && (
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}><Code2 size={18}/> LeetCode</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li>Total Solved: <strong>{portfolio.stats.leetcode.solved}</strong></li>
                  <li style={{ color: '#34d399' }}>Easy: {portfolio.stats.leetcode.easy}</li>
                  <li style={{ color: '#fbbf24' }}>Medium: {portfolio.stats.leetcode.medium}</li>
                  <li style={{ color: '#ef4444' }}>Hard: {portfolio.stats.leetcode.hard}</li>
                </ul>
              </div>
            )}

            {portfolio.stats.codeforces && (
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}><Database size={18}/> Codeforces</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li>Rating: <strong>{portfolio.stats.codeforces.rating}</strong></li>
                  <li style={{ textTransform: 'capitalize' }}>Rank: {portfolio.stats.codeforces.rank}</li>
                </ul>
              </div>
            )}

            {portfolio.stats.stackoverflow && (
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}><Database size={18}/> Stack Overflow</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li>Reputation: <strong>{portfolio.stats.stackoverflow.reputation}</strong></li>
                  <li style={{ color: '#fbbf24' }}>Gold Badges: {portfolio.stats.stackoverflow.badges.gold}</li>
                  <li style={{ color: '#94a3b8' }}>Silver Badges: {portfolio.stats.stackoverflow.badges.silver}</li>
                  <li style={{ color: '#b45309' }}>Bronze Badges: {portfolio.stats.stackoverflow.badges.bronze}</li>
                </ul>
              </div>
            )}

          </div>
        </div>

        {/* Projects */}
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', paddingLeft: '0.5rem', borderLeft: '4px solid var(--accent-blue)' }}>Showcase Projects</h2>
        {portfolio.projects.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
            This developer hasn't added any custom projects yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {portfolio.projects.map(proj => (
              <div key={proj._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '1rem' }}>{proj.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>{proj.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {proj.technologies.map((tech, idx) => (
                    <span key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                      {tech}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}><GitBranch size={16} style={{display:'inline', verticalAlign:'text-bottom'}}/> Code</a>}
                  {proj.liveUrl && <a href={proj.liveUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', fontSize: '0.875rem' }}><ExternalLink size={16} style={{display:'inline', verticalAlign:'text-bottom'}}/> Live Demo</a>}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </>
  );
};

export default PublicPortfolio;
