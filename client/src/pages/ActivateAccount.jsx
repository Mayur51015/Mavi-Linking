import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Building2,
  UserCheck,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import api from '../api/axios';

const ActivateAccount = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided in the URL. Please check your invitation link.');
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/auth/verify-invitation/${token}`);
        if (res.data?.success) {
          setInviteInfo(res.data.data);
        } else {
          setError(res.data?.message || 'Invalid or expired invitation token.');
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            'The invitation token is invalid or has expired. Please contact your administrator to resend your invitation.'
        );
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setError('');

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/auth/activate-account', {
        token,
        password,
      });

      if (res.data?.success) {
        setSuccess(true);
      } else {
        setError(res.data?.message || 'Failed to activate account.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to activate account. The invitation link may have expired or already been used.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-[#18181b] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-xl"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-4 shadow-lg shadow-purple-500/5">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">MAVI Account Activation</h1>
          <p className="text-sm text-zinc-400 mt-1">Set your private password to activate your account</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-3" />
            <p className="text-sm text-zinc-400">Verifying invitation token...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && !success && (
          <div className="space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300">Activation Error</p>
                <p className="mt-1 text-red-400/90 leading-relaxed">{error}</p>
              </div>
            </div>
            <Link
              to="/login"
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 text-sm"
            >
              Return to Login
            </Link>
          </div>
        )}

        {/* Success State */}
        {success && (
          <div className="text-center py-4 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">Account Activated!</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Your password has been created successfully. You can now sign in with your email or MAVI ID.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 text-sm"
            >
              Sign In to MAVI
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Activation Form */}
        {!loading && inviteInfo && !success && (
          <div className="space-y-5">
            {/* Account Info Box */}
            <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Invited Account</span>
                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold uppercase tracking-wider">
                  {inviteInfo.role}
                </span>
              </div>
              <div className="font-semibold text-white text-base">{inviteInfo.name}</div>
              <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-zinc-500" />
                {inviteInfo.email}
              </div>
              {inviteInfo.institutionName && (
                <div className="text-xs text-zinc-400 flex items-center gap-1.5 pt-1 border-t border-zinc-800/80">
                  <Building2 className="w-3.5 h-3.5 text-purple-400" />
                  {inviteInfo.institutionName}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {passwordError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Create New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl text-xs text-purple-300/80 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  No password was set by your administrator. Your password is private and encrypted.
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Activating Account...
                  </>
                ) : (
                  'Activate Account & Save Password'
                )}
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ActivateAccount;
