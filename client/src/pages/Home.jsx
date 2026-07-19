import { useContext, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Code, Cpu, Users, GraduationCap, Search, Sparkles, Shield, Zap, ArrowRight, PlayCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
const Home = () => {
  const { user, getDashboardPath } = useContext(AuthContext);
  const observerRef = useRef(null);

  useEffect(() => {
    // Setup Intersection Observer for scroll reveal animations
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Only trigger once
          observerRef.current.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    const revealElements = document.querySelectorAll('.reveal, .reveal-fade');
    revealElements.forEach((el) => observerRef.current.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <>
      <nav className="navbar reveal-fade is-visible">
        <div className="container nav-container">
          <div className="nav-brand">
            <Terminal size={28} className="text-gradient" />
            <span>MaVi Linking</span>
          </div>
          <div className="nav-links">
            <ThemeToggle />
            {user ? (
              <Link to={getDashboardPath()} className="btn btn-primary" aria-label="Dashboard">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="nav-link" aria-label="Login">Login</Link>
                <Link to="/register" className="btn btn-primary" aria-label="Get Started">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="container" style={{ marginTop: '6rem', marginBottom: '8rem', textAlign: 'center' }}>
          <h1 className="title-xl reveal" style={{ marginBottom: '1.5rem', lineHeight: 1.15 }}>
            Your Developer Intelligence <br />
            <span className="text-gradient">Unified in One Place</span>
          </h1>
          
          <p className="reveal reveal-delay-100" style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '650px', margin: '0 auto 3rem auto', lineHeight: 1.6 }}>
            One platform for students, recruiters, and teachers. Aggregate your data from GitHub, LeetCode, and more — powered by AI-driven insights.
          </p>

          <div className="reveal reveal-delay-200" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg" style={{ minWidth: '220px' }}>
              <Sparkles size={20} /> Create Your Profile
            </Link>
            <a href="#roles" className="btn btn-outline btn-lg" style={{ minWidth: '220px' }}>
              Explore Roles <ArrowRight size={18} />
            </a>
          </div>
        </section>

        {/* Role Cards Section */}
        <section id="roles" className="container" style={{ scrollMarginTop: '6rem', marginBottom: '8rem' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="title-xl" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '1rem' }}>Tailored for <span className="text-gradient-secondary">Every Role</span></h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
              Discover features specifically designed for your needs, whether you are learning, hiring, or teaching.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            <div className="glass-card reveal reveal-delay-100" style={{ textAlign: 'left', borderTop: '3px solid var(--accent-purple)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '0.875rem', borderRadius: '12px' }}>
                  <Users size={28} color="var(--accent-purple)" />
                </div>
                <h3 style={{ fontSize: '1.35rem' }}>For Students</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.7, flexGrow: 1 }}>
                Build your centralized developer profile. Link GitHub, LeetCode, and more. Get AI-powered career insights, rankings, and a shareable public identity page.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: 'auto' }}>
                <span className="badge badge-purple">AI Insights</span>
                <span className="badge badge-primary">Public Profile</span>
                <span className="badge badge-emerald">QR Code</span>
                <span className="badge badge-amber">Ranking</span>
              </div>
            </div>
            
            <div className="glass-card reveal reveal-delay-200" style={{ textAlign: 'left', borderTop: '3px solid var(--accent-cyan)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.875rem', borderRadius: '12px' }}>
                  <Search size={28} color="var(--accent-cyan)" />
                </div>
                <h3 style={{ fontSize: '1.35rem' }}>For Recruiters</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.7, flexGrow: 1 }}>
                Discover top developer talent scoped to your allowed colleges and departments. Bookmark, compare, and track candidates through your hiring pipeline.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: 'auto' }}>
                <span className="badge badge-primary">Talent Search</span>
                <span className="badge badge-emerald">Bookmarks</span>
                <span className="badge badge-purple">Compare</span>
                <span className="badge badge-amber">Reports</span>
              </div>
            </div>

            <div className="glass-card reveal reveal-delay-300" style={{ textAlign: 'left', borderTop: '3px solid var(--accent-emerald)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.875rem', borderRadius: '12px' }}>
                  <GraduationCap size={28} color="var(--accent-emerald)" />
                </div>
                <h3 style={{ fontSize: '1.35rem' }}>For Teachers</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.7, flexGrow: 1 }}>
                Monitor your department's students, track placement readiness, view leaderboards — all automatically scoped to your own college and department.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: 'auto' }}>
                <span className="badge badge-emerald">Student Monitor</span>
                <span className="badge badge-amber">Readiness</span>
                <span className="badge badge-purple">Leaderboard</span>
                <span className="badge badge-primary">Analytics</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container" style={{ scrollMarginTop: '6rem', paddingBottom: '6rem' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="title-xl" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '1rem' }}>Powerful <span className="text-gradient">Capabilities</span></h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
              Everything you need to showcase your skills or find the perfect candidate.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div className="glass-card reveal reveal-delay-100" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.1)', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                <Cpu size={36} color="var(--accent-purple)" />
              </div>
              <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>AI-Powered Insights</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>Personalized career advice based on your code, contests, and contributions.</p>
            </div>
            
            <div className="glass-card reveal reveal-delay-200" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                <Code size={36} color="var(--accent-blue)" />
              </div>
              <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>Smart Scoring</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>Development, Problem Solving, and Knowledge scores with global ranking.</p>
            </div>

            <div className="glass-card reveal reveal-delay-300" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                <Shield size={36} color="var(--accent-emerald)" />
              </div>
              <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>Role-Based Access</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>Scoped dashboards ensure teachers and recruiters only see authorized data.</p>
            </div>

            <div className="glass-card reveal reveal-delay-400" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                <Zap size={36} color="var(--accent-amber)" />
              </div>
              <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>Real-Time Sync</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>Live data aggregation from GitHub, LeetCode, Codeforces, and Stack Overflow.</p>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="container reveal" style={{ marginBottom: '2rem', padding: '0 1rem' }}>
          <div className="gradient-border-card" style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: 'var(--radius-xl)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 60%)', zIndex: 0, pointerEvents: 'none' }}></div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 className="title-xl" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', marginBottom: '1.5rem' }}>Continue Your <span className="text-gradient">Learning Journey</span></h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '650px', margin: '0 auto 3rem auto', lineHeight: 1.7 }}>
                Explore interactive learning resources, discover new concepts, and start practicing with our educational tools to elevate your development career.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                <Link to="/register" className="btn btn-primary btn-lg" style={{ minWidth: '180px' }}>
                  Get Started
                </Link>
                <a href="#features" className="btn btn-outline btn-lg" style={{ minWidth: '180px' }}>
                  <PlayCircle size={20} /> Explore Platform
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Responsive Footer */}
      <Footer />
    </>
  );
};

export default Home;
