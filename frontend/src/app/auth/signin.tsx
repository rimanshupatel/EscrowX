import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, Wallet, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { authService } from '../../services/api';

export default function SignInPage() {
  const navigate = useNavigate();
  const { walletAddress, isConnected, setAuth } = useAuthStore();
  const { showToast } = useToastStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      showToast("Email is required", "error");
      return;
    }
    if (!password) {
      showToast("Password is required", "error");
      return;
    }
    if (!isConnected || !walletAddress) {
      showToast("Connect your wallet before signing in.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.signin({
        email,
        password,
        walletAddress
      });

      setAuth(res.token, res.user);
      showToast("Signed in successfully!", "success");

      // Redirect by role
      const userRole = res.user.role;
      if (userRole === 'CLIENT') {
        navigate('/client/dashboard');
      } else if (userRole === 'FREELANCER') {
        navigate('/freelancer/dashboard');
      } else if (userRole === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || "Invalid credentials or wallet mismatch.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased text-slate-900 selection:bg-indigo-500/10 selection:text-indigo-600">
      
      {/* LEFT SIDE: Branding / Features (Vercel/Linear Style) */}
      <div className="hidden lg:flex lg:w-1/2 bg-white border-r border-slate-200 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative Grid and Blur */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-200 rounded-full blur-[128px] opacity-40 pointer-events-none" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-600 shadow-sm">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>

        <div className="my-auto space-y-8 max-w-md relative z-10">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-[14px] bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="4" width="14" height="10" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
                <path d="M6 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="white" strokeWidth="1.5"/>
                <circle cx="9" cy="9" r="1.5" fill="white"/>
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Access EscrowX Marketplace
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Log in to your account with our secure hybrid authentication model combining traditional credentials with on-chain Stellar keys.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            {[
              { title: 'Secure Cryptographic Association', desc: 'Your account is cryptographically tied to your specific public key.' },
              { title: 'Milestone Tracking', desc: 'Manage your active escrows, release milestone payments, and track files.' },
              { title: 'Instant Settle', desc: 'Secure payment settles on Soroban smart contract ledger instantly.' }
            ].map((f, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">{f.title}</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-semibold relative z-10">
          © 2026 EscrowX Inc. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-10 right-10 lg:hidden z-10">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[440px] bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-[0_4px_32px_rgba(0,0,0,0.02)]"
        >
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Verify credentials and connected wallet to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Connected Wallet (Read-only status) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Connected Stellar Wallet
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  readOnly
                  value={walletAddress || 'No Wallet Connected'}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-600 focus:outline-none pl-9 select-all cursor-not-allowed"
                />
                <Wallet className="w-4 h-4 text-slate-400 absolute left-3" />
              </div>
              {!isConnected && (
                <p className="text-[10px] text-red-500 font-medium mt-1">Please connect Freighter wallet first.</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Email Address
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 pl-9 transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 pl-9 pr-10 transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-[11px] text-slate-500 font-semibold">Remember this wallet</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !isConnected}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              {submitting ? 'Authenticating...' : 'Sign In with Wallet'}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-6 text-center">
            <span className="text-[11px] text-slate-400 font-semibold">New to EscrowX? </span>
            <Link to="/" className="text-[11px] text-indigo-600 hover:text-indigo-700 font-bold transition-colors">
              Get Started
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
