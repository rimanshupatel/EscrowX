import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, User as UserIcon, Wallet, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { authService } from '../../services/api';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { walletAddress, isConnected, setAuth } = useAuthStore();
  const { showToast } = useToastStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'CLIENT' | 'FREELANCER' | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Read selected role from localStorage
    const savedRole = localStorage.getItem('selectedRole') as 'CLIENT' | 'FREELANCER';
    if (savedRole && (savedRole === 'CLIENT' || savedRole === 'FREELANCER')) {
      setRole(savedRole);
    } else {
      showToast("No role selected. Redirecting to landing page.", "error");
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast("Name is required", "error");
      return;
    }
    if (!email.trim()) {
      showToast("Email is required", "error");
      return;
    }
    if (password.length < 8) {
      showToast("Password must be at least 8 characters long", "error");
      return;
    }
    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    if (!isConnected || !walletAddress) {
      showToast("Stellar wallet must be connected", "error");
      return;
    }
    if (!role) {
      showToast("Selected role is missing", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.signup({
        name,
        email,
        password,
        walletAddress,
        role
      });

      setAuth(res.token, res.user);
      showToast("Registration successful!", "success");

      // Redirect by role
      if (role === 'CLIENT') {
        navigate('/client/dashboard');
      } else {
        navigate('/freelancer/dashboard');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || "Registration failed.", "error");
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
              EscrowX Smart Contracts
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Experience the safest trustless marketplace powered by Soroban on the Stellar ledger. Lock funds, deliver milestones, and settle securely.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            {[
              { title: 'Non-Custodial Escrows', desc: 'No middleman. Funds are locked inside Rust-based smart contracts.' },
              { title: 'Stellar Fast Settlements', desc: 'USDC and XLM transactions resolve in seconds with tiny network fees.' },
              { title: 'Verified Reputation', desc: 'Build your decentralized reputation trust score as client or freelancer.' }
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
          className="w-full max-w-[460px] bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-[0_4px_32px_rgba(0,0,0,0.02)]"
        >
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h2>
            <p className="text-xs text-slate-500 mt-1">Setup profile details to get started with hybrid authentication.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Wallet Address (Read-only) */}
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

            {/* Role (Read-only) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Account Role
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  readOnly
                  value={role ? `${role.toUpperCase()} PROFILE` : 'Loading selected role...'}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-indigo-600 focus:outline-none pl-9 cursor-not-allowed"
                />
                <Shield className="w-4 h-4 text-indigo-500 absolute left-3" />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Full Name / Agency Name
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 pl-9 transition-all"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3" />
              </div>
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
                  placeholder="Min. 8 characters"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 pl-9 pr-10 transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !isConnected}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              {submitting ? 'Creating account...' : 'Create Account & Sign In'}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-6 text-center">
            <span className="text-[11px] text-slate-400 font-semibold">Already have an account? </span>
            <Link to="/auth/sign-in" className="text-[11px] text-indigo-600 hover:text-indigo-700 font-bold transition-colors">
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
