'use client';

import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Lock, CheckCircle, Wallet } from 'lucide-react';
import { WalletConnectButton } from '@/components/shared/WalletConnectButton';

const HERO_CARDS = [
  {
    id: 1,
    icon: <Lock className="w-4 h-4 text-[#5B6BF8]" />,
    title: 'Escrow Created',
    subtitle: '100 XLM locked',
    status: 'funded',
    statusColor: 'text-[#5B6BF8]',
    statusBg: 'bg-[#EEF0FF]',
    time: 'Just now',
  },
  {
    id: 2,
    icon: <CheckCircle className="w-4 h-4 text-amber-500" />,
    title: 'Work Delivered ✓',
    subtitle: 'IPFS: QmX7z...qM5',
    status: 'delivered',
    statusColor: 'text-amber-600',
    statusBg: 'bg-amber-50',
    time: '2 days later',
  },
  {
    id: 3,
    icon: <Wallet className="w-4 h-4 text-[#16A865]" />,
    title: 'Payment Released',
    subtitle: '→ Wallet · 100 XLM',
    status: 'approved',
    statusColor: 'text-[#16A865]',
    statusBg: 'bg-emerald-50',
    time: '3.2s finality',
  },
];

const STAT_CHIPS = [
  { label: '3.2s avg finality', icon: '⚡' },
  { label: '$0.00001 avg fee', icon: '💸' },
  { label: '100% non-custodial', icon: '🔒' },
];

export function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#5B6BF8]/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#7B68EE]/4 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle, #5B6BF8 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="max-w-[1280px] mx-auto px-6 w-full py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Copy */}
          <div ref={ref}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
            >
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5B6BF8] text-white text-[11px] font-bold uppercase tracking-[0.1em] mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-white/60 inline-block" />
                Built on Stellar Blockchain
              </div>

              {/* Headline */}
              <h1 className="text-[60px] lg:text-[72px] font-extrabold text-[#0F1117] leading-[1.05] tracking-[-0.03em] mb-6">
                Freelance payments,{' '}
                <span className="gradient-text">secured by code.</span>
              </h1>

              {/* Subheadline */}
              <p className="text-[18px] text-[#6B7280] leading-[1.65] mb-8 max-w-[480px]">
                Lock funds in a Soroban smart contract. Release only when work is
                delivered. No middlemen, no chargebacks, no trust required.
              </p>

              {/* CTA row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-10">
                <Link
                  to="/escrow/new"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-[10px] bg-[#5B6BF8] text-white font-semibold hover:bg-[#4757E8] transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-[#5B6BF8]/30 hover:-translate-y-0.5"
                >
                  Start an Escrow
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-[10px] border border-[#E4E8F0] text-[#6B7280] font-semibold hover:border-[#5B6BF8] hover:text-[#5B6BF8] hover:bg-[#EEF0FF] transition-all duration-200"
                >
                  See How It Works
                </a>
              </div>

              {/* Stat chips */}
              <div className="flex flex-wrap gap-2.5">
                {STAT_CHIPS.map((chip) => (
                  <motion.div
                    key={chip.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.3, delay: 0.6 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E4E8F0] text-sm text-[#6B7280] font-medium shadow-sm"
                  >
                    <span>{chip.icon}</span>
                    {chip.label}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right — Animated card stack */}
          <div className="relative flex justify-center items-center">
            <div className="relative w-full max-w-[360px]">
              {/* Connecting line */}
              <div className="absolute left-7 top-16 bottom-16 w-px z-0">
                <svg className="w-full h-full" viewBox="0 0 2 300" preserveAspectRatio="none">
                  <line x1="1" y1="0" x2="1" y2="300"
                    stroke="#E4E8F0"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                  />
                  <line x1="1" y1="0" x2="1" y2="300"
                    stroke="#5B6BF8"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    strokeDashoffset="12"
                    opacity="0.5"
                  >
                    <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1.5s" repeatCount="indefinite" />
                  </line>
                </svg>
              </div>

              {/* Cards */}
              <div className="space-y-4">
                {HERO_CARDS.map((card, i) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.18, ease: [0.34, 1.56, 0.64, 1] }}
                    className="relative z-10 hero-card p-4 ml-4"
                    style={{
                      transform: `scale(${1 - i * 0.02}) translateX(${i * 4}px)`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-[8px] ${card.statusBg} flex items-center justify-center shrink-0 mt-0.5`}>
                        {card.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[#0F1117]">{card.title}</p>
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[4px] ${card.statusBg} ${card.statusColor}`}>
                            {card.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs font-mono text-[#9CA3AF]">{card.subtitle}</p>
                          <p className="text-[10px] text-[#9CA3AF]">{card.time}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                className="absolute -bottom-4 -right-4 bg-white border border-[#E4E8F0] rounded-[12px] px-3 py-2 shadow-md"
              >
                <p className="text-[11px] font-semibold text-[#9CA3AF]">Network fee</p>
                <p className="text-sm font-bold text-[#16A865]">$0.00001</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
