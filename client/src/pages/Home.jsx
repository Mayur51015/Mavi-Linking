import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Code, Cpu } from 'lucide-react';

const Home = () => {
  return (
    <>
      <nav className="navbar animate-fade-in">
        <div className="container nav-container">
          <div className="nav-brand">
            <Terminal size={28} className="text-gradient" />
            <span>MaVi Linking</span>
          </div>
          <div className="nav-links">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/login" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      <main className="container" style={{ marginTop: '8rem', textAlign: 'center' }}>
        <h1 className="title-xl animate-fade-in" style={{ marginBottom: '1.5rem' }}>
          Your Developer Intelligence <br />
          <span className="text-gradient">Unified in One Place</span>
        </h1>
        
        <p className="animate-fade-in delay-100" style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
          Aggregate your data from GitHub, LeetCode, Codeforces, and Stack Overflow. Get AI-driven insights and automatically generate a stunning portfolio.
        </p>

        <div className="animate-fade-in delay-200" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '5rem' }}>
          <Link to="/login" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
            Build Your Portfolio
          </Link>
          <a href="#features" className="btn btn-outline" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
            View Features
          </a>
        </div>

        <div id="features" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', paddingBottom: '5rem' }} className="animate-fade-in delay-300">
          <div className="glass-card" style={{ textAlign: 'left' }}>
            <Cpu size={32} color="var(--accent-purple)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>AI Insights</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Get actionable career advice and identify areas for improvement based on your actual code and problem-solving history.</p>
          </div>
          
          <div className="glass-card" style={{ textAlign: 'left' }}>
            <Code size={32} color="var(--accent-blue)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Smart Scoring</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Our proprietary algorithm calculates your Development, Problem Solving, and Knowledge scores to rank you globally.</p>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
