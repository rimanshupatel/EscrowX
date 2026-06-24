'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const FEATURES = [
  {
    emoji: '🔐',
    title: 'Trustless Escrow',
    description: 'Smart contracts hold funds autonomously. No third party can access, freeze, or redirect your payments.',
  },
  {
    emoji: '⚡',
    title: 'Stellar Speed',
    description: 'Transactions settle in ~3 seconds on the Stellar network. Near-instant payment confirmation, every time.',
  },
  {
    emoji: '🏆',
    title: 'Milestone Payments',
    description: 'Break large projects into milestones. Release payment incrementally as each phase is delivered and approved.',
  },
  {
    emoji: '⚖️',
    title: 'Dispute Resolution',
    description: 'Neutral arbiters review evidence from both parties and issue binding on-chain resolutions automatically.',
  },
  {
    emoji: '📊',
    title: 'Analytics Dashboard',
    description: 'Track escrow volume, success rates, completion times, and earnings with a real-time analytics suite.',
  },
  {
    emoji: '🌍',
    title: 'Cross-border Ready',
    description: 'XLM transacts globally with no currency conversion friction. Ideal for remote and international work.',
  },
];

export function FeaturesGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E4E8F0] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-4">
            Features
          </div>
          <h2 className="text-[40px] font-extrabold text-[#0F1117] tracking-tight mb-4">
            Everything you need to transact{' '}
            <span className="gradient-text">with confidence</span>
          </h2>
          <p className="text-[17px] text-[#6B7280] max-w-[500px] mx-auto leading-relaxed">
            Built for freelancers, agencies, and clients who demand transparency, speed, and security.
          </p>
        </div>

        {/* Grid */}
        <div ref={ref} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
              whileHover={{ y: -3, boxShadow: '0 4px 16px rgba(91,107,248,0.16), 0 1px 4px rgba(0,0,0,0.08)' }}
              className="group bg-white rounded-[16px] p-6 border border-[#E4E8F0] cursor-default transition-all duration-200"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(91,107,248,0.08)' }}
            >
              <div className="text-2xl mb-4">{feature.emoji}</div>
              <h3 className="text-[16px] font-semibold text-[#0F1117] mb-2 group-hover:text-[#5B6BF8] transition-colors">
                {feature.title}
              </h3>
              <p className="text-[14px] text-[#6B7280] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
