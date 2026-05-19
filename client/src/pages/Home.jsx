import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Code, Cpu, Users, GraduationCap, Search, Sparkles, Shield, Zap } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
  const { user, getDashboardPath } = useContext(AuthContext);

  return (
    <>
      <nav className="navbar animate-fade-in">
        <div className="container nav-container">
          <div className="nav-brand">
            <Terminal size={28} className="text-gradient" />
            <span>MaVi Linking</span>
          </div>
          <div className="nav-links">
            {user ? (
              <Link to={getDashboardPath()} className="btn btn-primary">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="btn btn-primary">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="container" style={{ marginTop: '6rem', textAlign: 'center' }}>
        {/* Hero */}
        <h1 className="title-xl animate-fade-in" style={{ marginBottom: '1.5rem' }}>
          Your Developer Intelligence <br />
          <span className="text-gradient">Unified in One Place</span>
        </h1>
        
        <p className="animate-fade-in delay-100" style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '650px', margin: '0 auto 3rem auto' }}>
          One platform for students, recruiters, and teachers. Aggregate your data from GitHub, LeetCode, and more — powered by AI-driven insights.
        </p>

        <div className="animate-fade-in delay-200" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '5rem', flexWrap: 'wrap' }}>
          <Link to="/register" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
            <Sparkles size={20} /> Create Your Profile
          </Link>
          <a href="#roles" className="btn btn-outline" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
            Explore Roles
          </a>
        </div>

        {/* Role Cards */}
        <div id="roles" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '5rem' }} className="animate-fade-in delay-300">
          <div className="glass-card" style={{ textAlign: 'left', borderTop: '3px solid var(--accent-purple)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '0.75rem', borderRadius: '12px' }}>
                <Users size={28} color="var(--accent-purple)" />
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>For Students</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
              Build your centralized developer profile. Link GitHub, LeetCode, and more. Get AI-powered career insights, rankings, and a shareable public identity page.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span className="badge badge-purple">AI Insights</span>
              <span className="badge badge-primary">Public Profile</span>
              <span className="badge badge-emerald">QR Code</span>
              <span className="badge badge-amber">Ranking</span>
            </div>
          </div>
          
          <div className="glass-card" style={{ textAlign: 'left', borderTop: '3px solid var(--accent-cyan)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.75rem', borderRadius: '12px' }}>
                <Search size={28} color="var(--accent-cyan)" />
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>For Recruiters</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
              Discover top developer talent scoped to your allowed colleges and departments. Bookmark, compare, and track candidates through your hiring pipeline.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span className="badge badge-primary">Talent Search</span>
              <span className="badge badge-emerald">Bookmarks</span>
              <span className="badge badge-purple">Compare</span>
              <span className="badge badge-amber">Reports</span>
            </div>
          </div>

          <div className="glass-card" style={{ textAlign: 'left', borderTop: '3px solid var(--accent-emerald)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.75rem', borderRadius: '12px' }}>
                <GraduationCap size={28} color="var(--accent-emerald)" />
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>For Teachers</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
              Monitor your department's students, track placement readiness, view leaderboards — all automatically scoped to your own college and department.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span className="badge badge-emerald">Student Monitor</span>
              <span className="badge badge-amber">Readiness</span>
              <span className="badge badge-purple">Leaderboard</span>
              <span className="badge badge-primary">Analytics</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div id="features" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', paddingBottom: '5rem' }} className="animate-fade-in delay-400">
          <div className="glass-card-static" style={{ textAlign: 'center', padding: '2rem' }}>
            <Cpu size={36} color="var(--accent-purple)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>AI-Powered Insights</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Personalized career advice based on your code, contests, and contributions.</p>
          </div>
          
          <div className="glass-card-static" style={{ textAlign: 'center', padding: '2rem' }}>
            <Code size={36} color="var(--accent-blue)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Smart Scoring</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Development, Problem Solving, and Knowledge scores with global ranking.</p>
          </div>

          <div className="glass-card-static" style={{ textAlign: 'center', padding: '2rem' }}>
            <Shield size={36} color="var(--accent-emerald)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Role-Based Access</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Scoped dashboards ensure teachers and recruiters only see authorized data.</p>
          </div>

          <div className="glass-card-static" style={{ textAlign: 'center', padding: '2rem' }}>
            <Zap size={36} color="var(--accent-amber)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Real-Time Sync</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Live data aggregation from GitHub, LeetCode, Codeforces, and Stack Overflow.</p>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
