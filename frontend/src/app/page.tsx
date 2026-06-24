import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, Lock, Sparkles, ChevronRight, Play, ArrowRight, CheckCircle2,
  Cpu, Users, BarChart3, HelpCircle, Activity, Award, HelpCircle as HelpIcon,
  Compass, ChevronDown, CheckCircle, Star
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { WalletButton } from '@/components/wallet/WalletButton';
import { useToastStore } from '../store/toastStore';
import { authService } from '../services/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isConnected, walletAddress } = useAuthStore();
  const { showToast } = useToastStore();
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  
  // Ref for scroll trigger animations
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });

  const handleCTA = async (role: 'CLIENT' | 'FREELANCER') => {
    if (!isConnected || !walletAddress) {
      showToast("Please connect your Stellar wallet first.", "error");
      return;
    }

    localStorage.setItem('selectedRole', role);

    try {
      showToast("Checking wallet registration...", "info");
      const res = await authService.checkWallet(walletAddress);
      if (res.exists) {
        navigate('/auth/sign-in');
      } else {
        navigate('/auth/sign-up');
      }
    } catch (err: any) {
      console.error("Wallet check error:", err);
      showToast("Authentication server unreachable. Redirecting to registration...", "info");
      // Resilient fallback: redirect to sign-up if server check fails
      setTimeout(() => {
        navigate('/auth/sign-up');
      }, 1200);
    }
  };

  const steps = [
    { title: 'Job Created', desc: 'Client posts terms', icon: '📝', color: 'bg-indigo-50 text-indigo-600' },
    { title: 'Funds Locked', desc: 'Tokens moved into Soroban', icon: '🔒', color: 'bg-[#7C3AED]/10 text-[#7C3AED]' },
    { title: 'Work Delivered', desc: 'Work hashes saved to IPFS', icon: '🚀', color: 'bg-amber-50 text-amber-600' },
    { title: 'Released', desc: 'Freighter signature pays out', icon: '💸', color: 'bg-[#10B981]/10 text-[#10B981]' }
  ];

  const features = [
    { icon: <Lock className="w-5 h-5 text-[#7C3AED]" />, title: 'Non-Custodial Vaults', desc: 'Funds reside inside smart contracts directly on the Stellar ledger, not our servers.' },
    { icon: <Cpu className="w-5 h-5 text-[#7C3AED]" />, title: 'Soroban Powered', desc: 'Automated workflow execution written in pure, secure Rust bytecode.' },
    { icon: <Shield className="w-5 h-5 text-[#7C3AED]" />, title: 'Dispute Arbitration', desc: 'Independent community arbiters review file logs and split payments fairly.' },
    { icon: <Users className="w-5 h-5 text-[#7C3AED]" />, title: 'Reputation System', desc: 'Badge ratings (Bronze to Platinum) recalculate based on historical trust scores.' },
    { icon: <Activity className="w-5 h-5 text-[#7C3AED]" />, title: 'Realtime Alerts', desc: 'Live socket signals update messages, deliveries, and payment status instantly.' },
    { icon: <BarChart3 className="w-5 h-5 text-[#7C3AED]" />, title: 'USDC & XLM Payments', desc: 'Fast transactions settle in seconds with sub-penny network fees.' }
  ];

  const testimonials = [
    {
      name: 'Sarah Jenkins',
      role: 'Design Lead',
      company: 'Web3Labs',
      quote: 'Locking 15,000 USDC in a Soroban escrow contract gave us and our freelancer 100% confidence. Settlements happen in seconds, not weeks.',
      rating: 5,
      avatarGradient: 'from-purple-500 to-indigo-500',
    },
    {
      name: 'Alex Rivera',
      role: 'Rust & Smart Contract Engineer',
      company: 'Independent',
      quote: 'EscrowX solved my payment collection issues. No invoicing, no chasing clients. Once my IPFS delivery hash is approved, the funds release instantly.',
      rating: 5,
      avatarGradient: 'from-amber-500 to-orange-500',
    },
    {
      name: 'Marcus Thorne',
      role: 'Founder',
      company: 'Stellar Ventures',
      quote: 'The dispute arbitration mechanism is outstanding. We had a split-payment resolution that was handled within 2 hours by verified community arbiters.',
      rating: 5,
      avatarGradient: 'from-emerald-400 to-teal-500',
    }
  ];

  return (
    <div className="bg-[#FAFAFA] text-[#0F172A] font-sans overflow-x-hidden min-h-screen selection:bg-[#7C3AED]/10 selection:text-[#7C3AED]">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAFA]/85 backdrop-blur-md border-b border-[#E5E7EB] transition-all">
        <div className="max-w-6.5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[#7C3AED] flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="4" width="14" height="10" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
                <path d="M6 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight">EscrowX</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-xs font-semibold text-gray-500 hover:text-[#0F172A] transition-colors">Features</a>
            <a href="#how-it-works" className="text-xs font-semibold text-gray-500 hover:text-[#0F172A] transition-colors">How it Works</a>
            <a href="#security" className="text-xs font-semibold text-gray-500 hover:text-[#0F172A] transition-colors">Security</a>
            <a href="#roadmap" className="text-xs font-semibold text-gray-500 hover:text-[#0F172A] transition-colors">Roadmap</a>
            <a href="#faq" className="text-xs font-semibold text-gray-500 hover:text-[#0F172A] transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="pt-32 pb-20 relative px-6">
        <div className="max-w-[800px] mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-[10px] font-bold uppercase tracking-wider mx-auto"
          >
            <Sparkles className="w-3 h-3" />
            Soroban Smart Contracts Live
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-[44px] md:text-[64px] font-extrabold text-[#0F172A] tracking-tight leading-[1.08] max-w-[720px] mx-auto"
          >
            Secure Freelance Payments <br />
            <span className="text-[#7C3AED]">Without Trust Issues</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-sm md:text-base text-gray-500 max-w-[520px] mx-auto leading-relaxed"
          >
            EscrowX protects both clients and freelancers using Stellar smart contracts.
            Lock funds securely until milestones are approved.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4"
          >
            <button
              onClick={() => handleCTA('CLIENT')}
              className="w-full sm:w-auto px-8 py-4 rounded-[12px] bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer animate-pulse-slow"
            >
              Continue As Client
            </button>
            <button
              onClick={() => handleCTA('FREELANCER')}
              className="w-full sm:w-auto px-8 py-4 rounded-[12px] bg-white border border-[#E5E7EB] hover:bg-gray-50 text-[#0F172A] font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
            >
              Continue As Freelancer
            </button>
            <a
              href="#escrow-flow"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-[12px] text-[#7C3AED] hover:text-[#6D28D9] font-bold text-xs uppercase tracking-wider transition-all"
            >
              <Play className="w-4 h-4" />
              Watch Demo
            </a>
          </motion.div>
        </div>
      </section>

      {/* Escrow Flow Animation */}
      <section id="escrow-flow" className="py-12 bg-white border-y border-[#E5E7EB] px-6">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-center text-xs font-bold uppercase tracking-widest text-[#7C3AED] mb-8">
            Decentralized Escrow Workflow
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {steps.map((s, idx) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-[20px] p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
              >
                <div className={`w-10 h-10 rounded-[10px] ${s.color} flex items-center justify-center text-base mb-4`}>
                  {s.icon}
                </div>
                <h4 className="text-xs font-bold text-[#0F172A] mb-1">{s.title}</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed">{s.desc}</p>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 z-10 text-gray-300">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center max-w-[480px] mx-auto mb-16 space-y-2">
          <h2 className="text-2xl font-bold text-[#0F172A]">Production-grade Web3 Features</h2>
          <p className="text-xs text-gray-500 leading-relaxed">Built for freelancers, secured with cryptographic ledgers.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white border border-[#E5E7EB] rounded-[20px] p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="w-9 h-9 rounded-[8px] bg-[#7C3AED]/10 flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="text-xs font-bold text-[#0F172A] mb-2">{f.title}</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-20 bg-white border-y border-[#E5E7EB] px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C3AED] bg-[#7C3AED]/10 px-2.5 py-1.5 rounded-full">
              Trustless Infrastructure
            </span>
            <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight leading-tight">
              Cryptographically secure lockups. Zero middlemen.
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Every deposit on EscrowX translates to a direct operation inside a native Soroban smart contract. 
              The application doesn't maintain custodial access to tokens. Payout triggers require Freighter validation keys.
            </p>
            <div className="space-y-2.5 pt-2">
              {[
                'Freighter Wallet Signature challenges prevent identity theft',
                'Arbitration keys are decentralized across verified arbiters',
                'IPFS storage ensures delivery assets are immutable'
              ].map(text => (
                <div key={text} className="flex items-center gap-2.5 text-xs text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm relative">
            <h3 className="text-xs font-bold text-[#0F172A] mb-4">Soroban State Inspector</h3>
            <div className="space-y-3 font-mono text-[10px] text-gray-500 bg-white border border-[#E5E7EB] p-4 rounded-[12px]">
              <p className="text-green-600">✓ Connection: Mainnet active</p>
              <p>📍 Contract: CAQZ5VRMGHPKMHWRJTPQNXW...</p>
              <p>🔑 Client: GBXPKM7VSKBKX5JKJHLX...</p>
              <p>💼 Freelancer: GDKPQN5XCZK8MNBRTV...</p>
              <p>💰 Locked: 10,842.50 XLM</p>
              <p className="text-indigo-600">⚡ Status: FUNDED</p>
            </div>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-[#7C3AED]/5 rounded-full blur-xl pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '$12.4M', label: 'Volume Secured' },
            { value: '3.2s', label: 'Avg Finality' },
            { value: '99.8%', label: 'Disputes Solved' },
            { value: '$0.00001', label: 'Stellar Avg Fee' }
          ].map(s => (
            <div key={s.label} className="text-center space-y-1">
              <p className="text-3xl font-extrabold text-[#0F172A]">{s.value}</p>
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white border-y border-[#E5E7EB] px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-[480px] mx-auto mb-16 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C3AED] bg-[#7C3AED]/10 px-2.5 py-1.5 rounded-full">
              User Testimonials
            </span>
            <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">
              Trusted by Clients and Freelancers
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Read how EscrowX is establishing trustless collaboration across the Web3 ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="flex flex-col bg-[#FAFAFA] border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group cursor-default"
              >
                {/* Rating stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-xs text-gray-600 leading-relaxed italic mb-6 flex-grow">
                  "{t.quote}"
                </p>

                {/* Profile row */}
                <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.avatarGradient} flex items-center justify-center text-white text-xs font-bold shadow-inner`}>
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">{t.name}</h4>
                    <p className="text-[10px] text-gray-400 font-semibold">{t.role} @ {t.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="py-20 bg-white border-y border-[#E5E7EB] px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-[480px] mx-auto mb-16 space-y-2">
            <h2 className="text-2xl font-bold text-[#0F172A]">Stellar Escrow Roadmap</h2>
            <p className="text-xs text-gray-500">Milestones towards completely decentralized freelance networks.</p>
          </div>
          
          <div className="space-y-8 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E7EB]">
            {[
              { phase: 'Q3 2026', title: 'Freighter Challenge Authentication', desc: 'Enable stateless challenge-response signatures to bypass standard password models.', active: true },
              { phase: 'Q4 2026', title: 'USDC Vault Contract Deployment', desc: 'Introduce USD-pegged stablecoin smart contract lockups.', active: true },
              { phase: 'Q1 2027', title: 'Decentralized DAO Arbitration', desc: 'Vesting rewards for active community dispute resolving pools.', active: false }
            ].map(r => (
              <div key={r.phase} className="flex gap-6 relative">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10 ${
                  r.active ? 'bg-[#7C3AED] border-[#7C3AED] text-white' : 'bg-white border-[#E5E7EB] text-gray-400'
                }`}>
                  ✓
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#7C3AED]">{r.phase}</span>
                  <h4 className="text-xs font-bold text-[#0F172A] mt-0.5">{r.title}</h4>
                  <p className="text-[11px] text-gray-500 mt-1 max-w-lg">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-[#0F172A] mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            { q: 'What is a Soroban smart contract?', a: 'Soroban is the native smart contract platform built on the Stellar network. It provides isolated, safe Rust-based execution environments that allow us to lock deposits on-chain.' },
            { q: 'How does Freighter signature verification work?', a: 'When you sign a message with Freighter, your private keys securely sign a string containing a server challenge and a timestamp. The server verifies this cryptographically, securing logins.' },
            { q: 'What happens in case of a dispute?', a: 'If a dispute is raised, the funds remain locked in the contract. Independent arbiters review submitted chat files and transaction records to determine payout resolutions.' }
          ].map((item, idx) => {
            const isOpen = activeFAQ === idx;
            return (
              <div key={item.q} className="border border-[#E5E7EB] rounded-[16px] overflow-hidden bg-white">
                <button
                  onClick={() => setActiveFAQ(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-xs font-bold text-[#0F172A] hover:bg-[#FAFAFA] transition-all"
                >
                  {item.q}
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-[#E5E7EB] px-5 py-4 text-xs text-gray-500 leading-relaxed bg-[#FAFAFA]"
                    >
                      {item.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F172A] text-white py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] bg-[#7C3AED] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="4" width="14" height="10" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
                <path d="M6 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight">EscrowX</span>
          </div>
          
          <p className="text-xs text-gray-400">© 2026 EscrowX. Secure freelance marketplace built on Stellar.</p>
          
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 rounded-full bg-[#10B981]" />
            All systems operational
          </div>
        </div>
      </footer>
    </div>
  );
}
