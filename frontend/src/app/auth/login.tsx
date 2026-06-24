import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Mail, User as UserIcon, Wallet, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useFreighter } from '../../hooks/useFreighter';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const { connectWallet, signAuthChallenge } = useFreighter();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState(1); // 1: Connect, 2: Sign, 3: Register Details
  const [wallet, setWallet] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for profile details
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'CLIENT' | 'FREELANCER' | 'ARBITRATOR'>('CLIENT');

  // Step 1: Connect Wallet
  const handleConnect = async () => {
    setError(null);
    const addr = await connectWallet();
    if (addr) {
      setWallet(addr);
      setStep(2);
      // Fetch challenge right away
      try {
        const res = await authService.getChallenge(addr);
        setChallenge(res.challenge);
      } catch (err: any) {
        setError('Failed to fetch authentication challenge from server');
      }
    } else {
      setError('Could not connect to wallet. Make sure Freighter is active.');
    }
  };

  // Step 2: Sign Challenge Message
  const handleSignChallenge = async () => {
    if (!challenge) return;
    setError(null);
    setLoading(true);
    const sig = await signAuthChallenge(challenge);
    if (sig) {
      setSignature(sig);
      try {
        // Verify signature with backend
        const res = await authService.verifySignature(wallet!, challenge, sig);
        
        if (res.status === 'NEW_USER') {
          // Move to Profile Registration details step
          setStep(3);
        } else if (res.status === 'EXISTING_USER') {
          // Existing user, ask for email password login
          setEmail(res.email || '');
          setStep(4);
        } else {
          // Existing user login successful
          setAuth(res.token, res.user);
          navigate('/dashboard');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Authentication signature verification failed.');
      }
    } else {
      setError('Challenge signature request rejected by user.');
    }
    setLoading(false);
  };

  // Step 3: Complete Register Form
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !role) {
      setError('All fields are required');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await authService.register({
        walletAddress: wallet,
        challenge,
        signature,
        email,
        password,
        role,
        username: username || email.split('@')[0],
      });
      setAuth(res.token, res.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete registration.');
    }
    setLoading(false);
  };

  // Step 4: Complete Login with Password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await authService.login({
        email,
        password,
        walletAddress: wallet,
        challenge,
        signature,
      });
      setAuth(res.token, res.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to authenticate.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] bg-white rounded-[24px] border border-[#E5E7EB] shadow-[0_4px_32px_rgba(0,0,0,0.03)] overflow-hidden"
      >
        {/* Banner Logo */}
        <div className="bg-[#0F172A] p-6 text-white text-center relative">
          <div className="w-12 h-12 rounded-[12px] bg-[#7C3AED] flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="4" width="14" height="10" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
              <path d="M6 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="white" strokeWidth="1.5"/>
              <circle cx="9" cy="9" r="1.5" fill="white"/>
            </svg>
          </div>
          <h2 className="text-[19px] font-bold tracking-tight">Access EscrowX Marketplace</h2>
          <p className="text-xs text-gray-400 mt-1">Stellar-secured decentralized marketplace</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 rounded-[12px] bg-red-50 border border-red-200 text-xs font-semibold text-red-600 leading-relaxed">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: Connect Wallet */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#7C3AED]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-6 h-6 text-[#7C3AED]" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A] mb-1">Step 1: Connect Wallet</h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-[280px] mx-auto">
                    Freighter wallet connection is mandatory to browse, post, or fund contracts on EscrowX.
                  </p>
                </div>

                <button
                  onClick={handleConnect}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[12px] bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold text-sm transition-all shadow-sm hover:shadow-md"
                >
                  Connect Freighter Wallet
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* STEP 2: Sign Challenge */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-amber-500" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A] mb-1">Step 2: Sign Auth Challenge</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Sign a unique cryptographic token from Freighter to verify ownership of wallet address:
                  </p>
                  <p className="font-mono text-[11px] bg-[#FAFAFA] border border-[#E5E7EB] rounded-[8px] p-2 mt-3 break-all text-gray-500">
                    {wallet}
                  </p>
                </div>

                <button
                  onClick={handleSignChallenge}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[12px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? 'Requesting signature...' : 'Sign Cryptographic Message'}
                  <Lock className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setStep(1)}
                  className="w-full text-center text-xs text-gray-500 hover:text-gray-700"
                >
                  Go Back
                </button>
              </motion.div>
            )}

            {/* STEP 3: Register profile details */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-6">
                  <div className="w-10 h-10 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-sm font-bold text-[#0F172A] mb-1">Step 3: Setup Profile Credentials</h3>
                  <p className="text-xs text-gray-500">Add email and password to secure your JWT login session.</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Role selection */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Register as:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['CLIENT', 'FREELANCER', 'ARBITRATOR'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className={`py-2 rounded-[8px] border text-xs font-semibold uppercase tracking-wider transition-all ${
                            role === r
                              ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                              : 'bg-white border-[#E5E7EB] text-[#0F172A] hover:bg-[#FAFAFA]'
                          }`}
                        >
                          {r.toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Username / Agency Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="john_doe"
                        className="w-full px-3 py-2.5 rounded-[8px] border border-[#E5E7EB] text-xs bg-white text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#7C3AED] pl-9"
                      />
                      <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        required
                        className="w-full px-3 py-2.5 rounded-[8px] border border-[#E5E7EB] text-xs bg-white text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#7C3AED] pl-9"
                      />
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3 py-2.5 rounded-[8px] border border-[#E5E7EB] text-xs bg-white text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#7C3AED] pl-9"
                      />
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-[12px] bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold text-xs uppercase tracking-wider transition-all disabled:opacity-40"
                  >
                    {loading ? 'Creating account...' : 'Create Account & Login'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 4: Login with Password */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-6">
                  <div className="w-10 h-10 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-sm font-bold text-[#0F172A] mb-1">Step 3: Enter Password</h3>
                  <p className="text-xs text-gray-500">Provide password for wallet account: <span className="font-semibold">{email}</span></p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Password */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3 py-2.5 rounded-[8px] border border-[#E5E7EB] text-xs bg-white text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#7C3AED] pl-9"
                      />
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-[12px] bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold text-xs uppercase tracking-wider transition-all disabled:opacity-40"
                  >
                    {loading ? 'Logging in...' : 'Verify Password & Login'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
