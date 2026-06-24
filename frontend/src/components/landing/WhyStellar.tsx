'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check } from 'lucide-react';

const REASONS = [
  {
    title: 'Near-zero fees',
    desc: 'Stellar transactions cost a fraction of a cent. Keep more of every payment.',
  },
  {
    title: '5-second settlement',
    desc: 'Stellar\'s consensus protocol delivers finality in 3–5 seconds, not minutes.',
  },
  {
    title: 'Soroban smart contracts',
    desc: 'The modern, Rust-based smart contract platform built directly into Stellar.',
  },
  {
    title: 'Decentralized & open',
    desc: 'No single point of failure. EscrowX contracts run on a decentralized network.',
  },
];

export function WhyStellar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-20 bg-[#EEF0FF]">
      <div className="max-w-[1280px] mx-auto px-6">
        <div ref={ref} className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — reasons */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#BCC5FF] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5B6BF8] bg-white mb-6">
              Why Stellar
            </div>
            <h2 className="text-[40px] font-extrabold text-[#0F1117] tracking-tight mb-8 leading-tight">
              The blockchain built{' '}
              <br />
              for payments.
            </h2>

            <div className="space-y-5">
              {REASONS.map((reason, i) => (
                <motion.div
                  key={reason.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="w-6 h-6 rounded-full bg-[#5B6BF8] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0F1117] mb-0.5">{reason.title}</p>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{reason.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right — Stellar logo with orbiting particles */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-center"
          >
            <div className="relative w-[300px] h-[300px]">
              {/* Center Stellar logo */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-[#5B6BF8] flex items-center justify-center shadow-xl shadow-[#5B6BF8]/30">
                  {/* Stellar star SVG */}
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <path
                      d="M24 8L27.5 18.5H38.5L29.5 25L33 35.5L24 29L15 35.5L18.5 25L9.5 18.5H20.5L24 8Z"
                      fill="white"
                    />
                  </svg>
                </div>
              </div>

              {/* Outer ring */}
              <div className="absolute inset-4 rounded-full border-2 border-dashed border-[#5B6BF8]/20" />
              <div className="absolute inset-12 rounded-full border-2 border-dashed border-[#5B6BF8]/10" />

              {/* Orbiting XLM particles */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full">
                  {/* Particle 1 */}
                  <div className="orbit-1 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-8 h-8 rounded-full bg-white border border-[#DDE2FF] shadow-sm flex items-center justify-center text-[11px] font-bold text-[#5B6BF8]">
                      XLM
                    </div>
                  </div>
                  {/* Particle 2 */}
                  <div className="orbit-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-6 h-6 rounded-full bg-[#EEF0FF] border border-[#BCC5FF] shadow-sm flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#5B6BF8]" />
                    </div>
                  </div>
                  {/* Particle 3 */}
                  <div className="orbit-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 rounded-full bg-white border border-[#E4E8F0] shadow-sm flex items-center justify-center text-[9px] font-bold text-[#7B68EE]">
                      ★
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats floating labels */}
              <div className="absolute -right-8 top-16 bg-white rounded-[10px] px-3 py-2 shadow-md border border-[#E4E8F0]">
                <p className="text-[10px] text-[#9CA3AF]">Finality</p>
                <p className="text-sm font-bold text-[#5B6BF8]">3.2s avg</p>
              </div>
              <div className="absolute -left-8 bottom-16 bg-white rounded-[10px] px-3 py-2 shadow-md border border-[#E4E8F0]">
                <p className="text-[10px] text-[#9CA3AF]">Fee</p>
                <p className="text-sm font-bold text-[#16A865]">$0.00001</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
