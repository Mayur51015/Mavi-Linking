import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Compass, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const NotFound = () => {
  const { user, getDashboardPath } = useContext(AuthContext);

  return (
    <>
      <nav className="navbar reveal-fade is-visible">
        <div className="container nav-container">
          <div className="nav-brand">
            <Terminal size={28} className="text-gradient" />
            <span>MaVi Linking</span>
          </div>
        </div>
      </nav>

      <main>
        <section
          className="container"
          style={{
            minHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '4rem 1rem',
          }}
        >
          <div
            className="glass-card"
            style={{
              padding: '1.25rem',
              borderRadius: '50%',
              marginBottom: '2rem',
              background: 'rgba(139, 92, 246, 0.15)',
            }}
          >
            <Compass size={40} color="var(--accent-purple)" />
          </div>

          <h1 className="title-xl text-gradient" style={{ fontSize: 'clamp(4rem, 12vw, 7rem)', lineHeight: 1, marginBottom: '1rem' }}>
            404
          </h1>

          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Page Not Found</h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '480px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
            The page you're looking for doesn't exist or may have been moved.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to={user ? getDashboardPath() : '/'} className="btn btn-primary btn-lg" style={{ minWidth: '200px' }}>
              <ArrowLeft size={18} /> {user ? 'Back to Dashboard' : 'Back to Home'}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
};

export default NotFound;
