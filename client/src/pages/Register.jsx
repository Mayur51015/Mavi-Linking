import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Terminal, User, Search, GraduationCap, ChevronRight, ChevronLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errorMessage';

const ROLES = [
  { key: 'user', label: 'Student / Developer', icon: <User size={32} />, desc: 'Create your developer profile and showcase your skills.', color: 'var(--accent-purple)' },
  { key: 'recruiter', label: 'Recruiter', icon: <Search size={32} />, desc: 'Discover and recruit top developer talent.', color: 'var(--accent-cyan)' },
  { key: 'teacher', label: 'Teacher / Professor', icon: <GraduationCap size={32} />, desc: 'Monitor and track your students\' progress.', color: 'var(--accent-emerald)' },
];

const DOMAINS = ['Web Development', 'AI/ML', 'Competitive Programming', 'Cybersecurity', 'App Development'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const Register = () => {
  const [step, setStep] = useState(1); // 1: role, 2: basic, 3: role-specific
  const [role, setRole] = useState('user');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '',
    // Student
    prn: '', collegeName: '', department: '', batch: '',
    degree: '', graduationYear: '', portfolioWebsite: '',
    githubUsername: '', preferredDomain: '', experienceLevel: '', bio: '',
    // Recruiter
    companyName: '', allowedColleges: '', allowedDepartments: '',
    // Teacher
    facultyId: '', teacherCollege: '', teacherDepartment: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const updateField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const handleNavigationByRole = (userRole) => {
    switch (userRole) {
      case 'recruiter': navigate('/dashboard/recruiter'); break;
      case 'teacher': navigate('/dashboard/teacher'); break;
      default: navigate('/dashboard'); break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role,
        bio: formData.bio,
      };

      if (role === 'user') {
        payload.prn = formData.prn;
        payload.university = {
          name: formData.collegeName,
          department: formData.department,
          batch: formData.batch,
        };
        payload.degree = formData.degree;
        payload.graduationYear = formData.graduationYear;
        payload.portfolioWebsite = formData.portfolioWebsite;
        payload.githubUsername = formData.githubUsername;
        payload.preferredDomain = formData.preferredDomain;
        payload.experienceLevel = formData.experienceLevel;
      }

      if (role === 'recruiter') {
        payload.companyName = formData.companyName;
        payload.allowedColleges = formData.allowedColleges ? formData.allowedColleges.split(',').map(s => s.trim()).filter(Boolean) : [];
        payload.allowedDepartments = formData.allowedDepartments ? formData.allowedDepartments.split(',').map(s => s.trim()).filter(Boolean) : [];
      }

      if (role === 'teacher') {
        payload.facultyId = formData.facultyId;
        payload.university = {
          name: formData.teacherCollege,
          department: formData.teacherDepartment,
        };
      }

      const res = await register(payload);
      toast.success('Account created successfully!');
      handleNavigationByRole(res?.user?.role);
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const renderRoleSelection = () => (
    <div className="animate-fade-in">
      <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.75rem' }}>Choose Your Role</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Select how you'll use MaVi Linking.
      </p>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {ROLES.map(r => (
          <button
            key={r.key}
            type="button"
            onClick={() => { setRole(r.key); setStep(2); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '1.25rem 1.5rem',
              background: role === r.key ? `${r.color}15` : 'rgba(255,255,255,0.02)',
              border: `1px solid ${role === r.key ? r.color : 'var(--border-color)'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              textAlign: 'left',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ color: r.color, flexShrink: 0 }}>{r.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{r.label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.desc}</div>
            </div>
            <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
          </button>
        ))}
      </div>
    </div>
  );

  const renderBasicFields = () => (
    <div className="animate-fade-in">
      <button type="button" onClick={() => setStep(1)} style={{
        background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1.5rem', fontSize: '0.875rem',
      }}>
        <ChevronLeft size={16} /> Back to role selection
      </button>
      <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.75rem' }}>Create Your Account</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Signing up as <span style={{ color: ROLES.find(r => r.key === role)?.color, fontWeight: '600' }}>
          {ROLES.find(r => r.key === role)?.label}
        </span>
      </p>

      <div className="input-group">
        <label className="input-label">Full Name *</label>
        <input type="text" className="input-field" placeholder="Enter your name"
          value={formData.name} onChange={(e) => updateField('name', e.target.value)} required />
      </div>
      <div className="input-group">
        <label className="input-label">Email Address *</label>
        <input type="email" className="input-field" placeholder="you@example.com"
          value={formData.email} onChange={(e) => updateField('email', e.target.value)} required />
      </div>
      <div className="input-group">
        <label className="input-label">Password *</label>
        <input type="password" className="input-field" placeholder="••••••••"
          value={formData.password} onChange={(e) => updateField('password', e.target.value)} required />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Min 6 chars, include uppercase, lowercase, and number</span>
      </div>

      <button type="button" onClick={() => setStep(3)}
        className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.875rem' }}
        disabled={!formData.name || !formData.email || !formData.password}
      >
        Continue <ChevronRight size={18} />
      </button>
    </div>
  );

  const renderRoleSpecificFields = () => (
    <div className="animate-fade-in">
      <button type="button" onClick={() => setStep(2)} style={{
        background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1.5rem', fontSize: '0.875rem',
      }}>
        <ChevronLeft size={16} /> Back
      </button>
      <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.5rem' }}>
        {role === 'user' && 'Developer Profile'}
        {role === 'recruiter' && 'Recruiter Details'}
        {role === 'teacher' && 'Teacher Details'}
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.875rem' }}>
        {role === 'user' && 'Tell us about your background. You can update these later.'}
        {role === 'recruiter' && 'Set up your recruiting access scope.'}
        {role === 'teacher' && 'Enter your college and department to scope your view.'}
      </p>

      {role === 'user' && (
        <>
          <div className="input-group">
            <label className="input-label">PRN / Permanent Registration No. (For College Verification)</label>
            <input type="text" className="input-field" placeholder="e.g., 124BT10461"
              value={formData.prn} onChange={e => updateField('prn', e.target.value)} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Required for login via PRN after Admin approval</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div className="input-group">
              <label className="input-label">College Name</label>
              <input type="text" className="input-field" placeholder="e.g., MIT Pune"
                value={formData.collegeName} onChange={e => updateField('collegeName', e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Department</label>
              <input type="text" className="input-field" placeholder="e.g., Computer Science"
                value={formData.department} onChange={e => updateField('department', e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Degree</label>
              <input type="text" className="input-field" placeholder="e.g., B.Tech"
                value={formData.degree} onChange={e => updateField('degree', e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Graduation Year</label>
              <input type="text" className="input-field" placeholder="e.g., 2026"
                value={formData.graduationYear} onChange={e => updateField('graduationYear', e.target.value)} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">GitHub Username</label>
            <input type="text" className="input-field" placeholder="e.g., torvalds"
              value={formData.githubUsername} onChange={e => updateField('githubUsername', e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Portfolio Website</label>
            <input type="url" className="input-field" placeholder="https://yoursite.com"
              value={formData.portfolioWebsite} onChange={e => updateField('portfolioWebsite', e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Preferred Career Domain</label>
            <select className="input-field" value={formData.preferredDomain} onChange={e => updateField('preferredDomain', e.target.value)}>
              <option value="">Select Domain</option>
              {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Experience Level</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {LEVELS.map(l => (
                <button key={l} type="button"
                  onClick={() => updateField('experienceLevel', l)}
                  className={`btn btn-sm ${formData.experienceLevel === l ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: 1 }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Bio</label>
            <textarea className="input-field" placeholder="Tell us about yourself..."
              rows={3} value={formData.bio} onChange={e => updateField('bio', e.target.value)}
              style={{ resize: 'vertical' }} />
          </div>
        </>
      )}

      {role === 'recruiter' && (
        <>
          <div className="input-group">
            <label className="input-label">Company Name *</label>
            <input type="text" className="input-field" placeholder="e.g., Google"
              value={formData.companyName} onChange={e => updateField('companyName', e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">Allowed Colleges (comma-separated)</label>
            <input type="text" className="input-field" placeholder="e.g., MIT Pune, IIT Bombay"
              value={formData.allowedColleges} onChange={e => updateField('allowedColleges', e.target.value)} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Leave empty to access all colleges</span>
          </div>
          <div className="input-group">
            <label className="input-label">Allowed Departments (comma-separated)</label>
            <input type="text" className="input-field" placeholder="e.g., Computer Science, IT"
              value={formData.allowedDepartments} onChange={e => updateField('allowedDepartments', e.target.value)} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Leave empty to access all departments</span>
          </div>
        </>
      )}

      {role === 'teacher' && (
        <>
          <div className="input-group">
            <label className="input-label">Faculty / Employee ID (For Verification)</label>
            <input type="text" className="input-field" placeholder="e.g., FAC-8890"
              value={formData.facultyId} onChange={e => updateField('facultyId', e.target.value)} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Required for login via Faculty ID after Admin approval</span>
          </div>
          <div className="input-group">
            <label className="input-label">College / University Name *</label>
            <input type="text" className="input-field" placeholder="e.g., MIT Pune"
              value={formData.teacherCollege} onChange={e => updateField('teacherCollege', e.target.value)} required />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>You can only monitor students from this college</span>
          </div>
          <div className="input-group">
            <label className="input-label">Department *</label>
            <input type="text" className="input-field" placeholder="e.g., Computer Science"
              value={formData.teacherDepartment} onChange={e => updateField('teacherDepartment', e.target.value)} required />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>You can only monitor students from this department</span>
          </div>
        </>
      )}

      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.875rem' }}
        disabled={loading}>
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: step === 3 && role === 'user' ? '560px' : '440px', padding: '2.5rem', transition: 'max-width 0.3s' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <Link to="/" className="nav-brand">
            <Terminal size={32} className="text-gradient" />
            <span>MaVi Linking</span>
          </Link>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Progress Indicator */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              flex: 1, height: '3px', borderRadius: '2px',
              background: s <= step ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && renderRoleSelection()}
          {step === 2 && renderBasicFields()}
          {step === 3 && renderRoleSpecificFields()}
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Already have an account? <Link to="/login" className="text-gradient" style={{ fontWeight: '600' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
