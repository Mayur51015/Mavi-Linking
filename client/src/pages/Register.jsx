import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Terminal, Building2, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, Lock, ShieldCheck, UserCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errorMessage';
import api from '../api/axios';

const Register = () => {
  // Step 1: Institution Code | Step 2: Department & PRN | Step 3: Account Details | Step 4: Verification
  const [step, setStep] = useState(1);

  // Institution State
  const [institutionCodeInput, setInstitutionCodeInput] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);
  const [validatedInstitution, setValidatedInstitution] = useState(null);

  // Department State
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');

  // PRN State
  const [prnInput, setPrnInput] = useState('');
  const [validatingPrn, setValidatingPrn] = useState(false);
  const [prnVerified, setPrnVerified] = useState(false);

  // Account Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    degree: 'B.Tech',
    graduationYear: '2026',
    githubUsername: '',
    preferredDomain: 'Web Development',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();

  const updateField = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  // Step 1: Validate Institution Code
  const handleValidateInstitutionCode = async (e) => {
    e.preventDefault();
    if (!institutionCodeInput.trim()) {
      setError('Please enter your Institution Code.');
      return;
    }

    setError('');
    setValidatingCode(true);

    try {
      const res = await api.get(`/public/institutions/by-code/${encodeURIComponent(institutionCodeInput.trim())}`);
      if (res.data?.success && res.data?.institution) {
        const inst = res.data.institution;
        setValidatedInstitution(inst);
        toast.success(`✓ Institution Found: ${inst.name}`);
        
        // Fetch departments
        fetchDepartmentsForInstitution(inst.id);
        setStep(2);
      } else {
        setError(res.data?.message || 'Invalid Institution Code. Please check the code provided by your college.');
      }
    } catch (err) {
      if (err.response?.data?.code === 'INSTITUTION_INACTIVE') {
        setError('Student registration for this institution is currently unavailable.');
      } else {
        setError(getErrorMessage(err, 'Invalid Institution Code. Please check the code provided by your institution.'));
      }
    } finally {
      setValidatingCode(false);
    }
  };

  // Fetch departments for validated institution
  const fetchDepartmentsForInstitution = async (instId) => {
    setLoadingDepartments(true);
    try {
      const res = await api.get(`/public/institutions/${instId}/departments`);
      if (res.data?.departments) {
        setDepartments(res.data.departments);
        if (res.data.departments.length > 0) {
          setSelectedDepartmentId(res.data.departments[0].id || res.data.departments[0].departmentId);
        }
      }
    } catch (err) {
      toast.error('Failed to load institution departments.');
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Step 2: Validate PRN
  const handleValidatePRN = async (e) => {
    e.preventDefault();
    if (!selectedDepartmentId) {
      setError('Please select your department.');
      return;
    }
    if (!prnInput.trim()) {
      setError('Please enter your PRN / Student ID.');
      return;
    }

    setError('');
    setValidatingPrn(true);

    try {
      const res = await api.post('/auth/validate-prn', {
        institutionId: validatedInstitution.id,
        departmentId: selectedDepartmentId,
        prn: prnInput.trim(),
      });

      if (res.data?.success) {
        setPrnVerified(true);
        toast.success('✓ PRN verified successfully!');
        setStep(3);
      } else {
        setError(res.data?.message || 'PRN verification failed.');
      }
    } catch (err) {
      if (err.response?.data?.code === 'PRN_ALREADY_REGISTERED') {
        setError('A student account with this PRN is already registered.');
      } else if (err.response?.data?.code === 'DEPARTMENT_INSTITUTION_MISMATCH') {
        setError('The selected department does not belong to your institution.');
      } else {
        setError(getErrorMessage(err, 'PRN verification failed. Please check your credentials.'));
      }
    } finally {
      setValidatingPrn(false);
    }
  };

  // Step 3: Complete Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const selectedDept = departments.find((d) => (d.id || d.departmentId) === selectedDepartmentId);

      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        institutionCode: validatedInstitution.code,
        institutionId: validatedInstitution.id,
        departmentId: selectedDepartmentId,
        prn: prnInput.trim(),
        degree: formData.degree,
        graduationYear: formData.graduationYear,
        githubUsername: formData.githubUsername,
        preferredDomain: formData.preferredDomain,
        university: {
          name: validatedInstitution.name,
          department: selectedDept ? selectedDept.name : '',
        },
      };

      const res = await register(payload);

      const registeredEmail = formData.email.toLowerCase().trim();
      localStorage.setItem('pendingVerificationEmail', registeredEmail);

      if (res?.code === 'EMAIL_VERIFICATION_REQUIRED') {
        toast.success(`🎉 Account created! Please check ${registeredEmail} to verify your address.`);
        navigate('/verify-account', { state: { email: registeredEmail } });
      } else {
        toast.success('Account created successfully!');
        navigate('/verify-account', { state: { email: registeredEmail } });
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Account registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Reset institution choice
  const handleChangeInstitution = () => {
    setValidatedInstitution(null);
    setDepartments([]);
    setSelectedDepartmentId('');
    setPrnInput('');
    setPrnVerified(false);
    setStep(1);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: '#09090b' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '580px', padding: '2.5rem', borderRadius: '16px', background: '#18181b', border: '1px solid #27272a' }}>
        
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <Terminal size={32} style={{ color: '#a855f7' }} />
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>MaVi Linking</span>
          </Link>
          <p style={{ color: '#a1a1aa', fontSize: '0.9rem', marginTop: '0.5rem' }}>Verified Student Registration & Multi-Tenant Onboarding</p>
        </div>

        {/* Progress Stepper Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', padding: '0 0.5rem' }}>
          {[
            { num: 1, label: 'Institution' },
            { num: 2, label: 'Department & PRN' },
            { num: 3, label: 'Account' },
          ].map((s) => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: step >= s.num ? 1 : 0.4 }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: step > s.num ? '#22c55e' : step === s.num ? '#a855f7' : '#27272a',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: step >= s.num ? '#ffffff' : '#71717a' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Institution Code Entry */}
        {step === 1 && (
          <form onSubmit={handleValidateInstitutionCode}>
            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Building2 size={28} color="#a855f7" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>Join Your Institution</h3>
              <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Enter the unique Institution Code provided by your college/university.</p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.5rem' }}>Institution Code</label>
              <input
                type="text"
                placeholder="e.g. ZCER-PUNE-01"
                value={institutionCodeInput}
                onChange={(e) => setInstitutionCodeInput(e.target.value.toUpperCase())}
                required
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', background: '#09090b', border: '1px solid #27272a', color: 'white', fontSize: '1rem', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}
              />
            </div>

            <button
              type="submit"
              disabled={validatingCode}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                color: 'white',
                border: 'none',
                fontWeight: 700,
                cursor: validatingCode ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {validatingCode ? <RefreshCw size={18} className="spin" /> : <>Continue <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        {/* STEP 2: Department Selection & PRN Verification */}
        {step === 2 && validatedInstitution && (
          <form onSubmit={handleValidatePRN}>
            {/* Validated Institution Banner */}
            <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle2 size={14} /> Confirmed Institution
                </span>
                <strong style={{ color: 'white', display: 'block', fontSize: '0.95rem', marginTop: '0.2rem' }}>{validatedInstitution.name}</strong>
                <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Code: {validatedInstitution.code}</span>
              </div>
              <button
                type="button"
                onClick={handleChangeInstitution}
                style={{ background: 'transparent', border: '1px solid #3f3f46', color: '#a1a1aa', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Change Code
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.5rem' }}>Academic Department</label>
              {loadingDepartments ? (
                <div style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Loading institution departments...</div>
              ) : (
                <select
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', background: '#09090b', border: '1px solid #27272a', color: 'white', fontSize: '0.9rem' }}
                >
                  {departments.map((dept) => (
                    <option key={dept.id || dept.departmentId} value={dept.id || dept.departmentId}>
                      {dept.name} {dept.code ? `(${dept.code})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.5rem' }}>Permanent Registration Number (PRN / Roll No.)</label>
              <input
                type="text"
                placeholder="e.g. 124BT10469"
                value={prnInput}
                onChange={(e) => setPrnInput(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', background: '#09090b', border: '1px solid #27272a', color: 'white', fontSize: '0.95rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ width: '35%', padding: '0.75rem', borderRadius: '8px', background: 'transparent', border: '1px solid #27272a', color: '#a1a1aa', fontWeight: 600, cursor: 'pointer' }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={validatingPrn}
                style={{
                  width: '65%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 700,
                  cursor: validatingPrn ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {validatingPrn ? <RefreshCw size={18} className="spin" /> : <>Verify Identity <ArrowRight size={18} /></>}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Personal Account Information */}
        {step === 3 && prnVerified && (
          <form onSubmit={handleRegisterSubmit}>
            <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '0.85rem', marginBottom: '1.25rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#4ade80', fontWeight: 600 }}>✓ Verified: {validatedInstitution.name}</span>
                <span style={{ color: '#a1a1aa', display: 'block' }}>PRN: {prnInput}</span>
              </div>
              <button type="button" onClick={() => setStep(2)} style={{ background: 'transparent', border: 'none', color: '#c084fc', textDecoration: 'underline', fontSize: '0.75rem', cursor: 'pointer' }}>Edit</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.4rem' }}>Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', background: '#09090b', border: '1px solid #27272a', color: 'white', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.4rem' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', background: '#09090b', border: '1px solid #27272a', color: 'white', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.4rem' }}>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  required
                  minLength={8}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', background: '#09090b', border: '1px solid #27272a', color: 'white', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.4rem' }}>Confirm Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', background: '#09090b', border: '1px solid #27272a', color: 'white', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.4rem' }}>Degree Program</label>
                <select
                  value={formData.degree}
                  onChange={(e) => updateField('degree', e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', background: '#09090b', border: '1px solid #27272a', color: 'white', fontSize: '0.85rem' }}
                >
                  <option value="B.Tech">B.Tech</option>
                  <option value="M.Tech">M.Tech</option>
                  <option value="B.E.">B.E.</option>
                  <option value="BCA">BCA</option>
                  <option value="MCA">MCA</option>
                  <option value="B.Sc">B.Sc</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.4rem' }}>Graduation Year</label>
                <input
                  type="text"
                  placeholder="2026"
                  value={formData.graduationYear}
                  onChange={(e) => updateField('graduationYear', e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', background: '#09090b', border: '1px solid #27272a', color: 'white', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{ width: '35%', padding: '0.75rem', borderRadius: '8px', background: 'transparent', border: '1px solid #27272a', color: '#a1a1aa', fontWeight: 600, cursor: 'pointer' }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '65%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {loading ? <RefreshCw size={18} className="spin" /> : <>Create Account <ArrowRight size={18} /></>}
              </button>
            </div>
          </form>
        )}

        <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #27272a', paddingTop: '1.25rem' }}>
          <p style={{ color: '#71717a', fontSize: '0.85rem' }}>
            Already have an active account?{' '}
            <Link to="/login" style={{ color: '#c084fc', textDecoration: 'none', fontWeight: 600 }}>
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;
