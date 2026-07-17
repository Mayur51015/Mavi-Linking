import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BadgeCheck, Copy, Check, RefreshCw, ExternalLink } from 'lucide-react';
import api from '../api/axios';

const VerificationModal = ({ onClose, onVerified, userRole = 'student' }) => {
  const [step, setStep] = useState('idle'); // idle, generated, verifying, verified, error
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    try {
      setStep('generating');
      const res = await api.post('/verification/generate');
      setCode(res.data.data.code);
      setStep('generated');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to generate code');
      setStep('error');
    }
  };

  const handleVerify = async () => {
    try {
      setStep('verifying');
      const res = await api.post('/verification/verify');
      if (res.data.data.verified) {
        setStep('verified');
        onVerified?.();
      } else {
        setMessage(res.data.data.message);
        setStep('generated');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Verification failed');
      setStep('error');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div
          className="modal-content"
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BadgeCheck size={20} className="text-gradient" /> {userRole === 'recruiter' || userRole === 'teacher' ? 'Account Verification' : 'GitHub Verification'}
            </h3>
            <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '0.375rem' }}><X size={20} /></button>
          </div>

          {step === 'idle' && (
            <div style={{ textAlign: 'center' }}>
              {userRole === 'recruiter' || userRole === 'teacher' ? (
                <>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    As a {userRole}, your account must be verified manually by our administration team using your official institutional or company credentials to receive the <span style={{ color: 'var(--accent-cyan)' }}>✓ Verified</span> badge.
                  </p>
                  <a href="mailto:support@mavilinking.com" className="btn btn-primary" style={{ display: 'inline-block' }}>Contact Support</a>
                </>
              ) : (
                <>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Verify your GitHub account to get a <span style={{ color: 'var(--accent-cyan)' }}>✓ Verified</span> badge on your profile.
                  </p>
                  <button onClick={handleGenerate} className="btn btn-primary">Generate Verification Code</button>
                </>
              )}
            </div>
          )}

          {step === 'generating' && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <RefreshCw size={24} className="animate-pulse" style={{ marginBottom: '1rem' }} />
              <p>Generating code...</p>
            </div>
          )}

          {step === 'generated' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Add this code to your GitHub bio:</p>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <code>{code}</code>
                  <button onClick={handleCopy} className="btn btn-ghost btn-sm">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              {message && <p style={{ color: 'var(--accent-amber)', fontSize: '0.875rem', marginBottom: '1rem' }}>{message}</p>}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <a href="https://github.com/settings/profile" target="_blank" rel="noreferrer" className="btn btn-outline" style={{ flex: 1 }}>
                  <ExternalLink size={16} /> Open GitHub Profile
                </a>
                <button onClick={handleVerify} className="btn btn-primary" style={{ flex: 1 }}>Verify Now</button>
              </div>
            </div>
          )}

          {step === 'verifying' && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <RefreshCw size={24} className="animate-pulse" style={{ marginBottom: '1rem' }} />
              <p>Checking your GitHub bio...</p>
            </div>
          )}

          {step === 'verified' && (
            <div style={{ textAlign: 'center' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }}>
                <BadgeCheck size={64} style={{ color: 'var(--accent-cyan)', marginBottom: '1rem' }} />
              </motion.div>
              <h3 style={{ marginBottom: '0.5rem' }}>Verified!</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Your GitHub account is now verified. The badge will appear on your profile.</p>
              <button onClick={onClose} className="btn btn-primary">Done</button>
            </div>
          )}

          {step === 'error' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#fca5a5', marginBottom: '1rem' }}>{message}</p>
              <button onClick={() => setStep('idle')} className="btn btn-outline">Try Again</button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VerificationModal;
