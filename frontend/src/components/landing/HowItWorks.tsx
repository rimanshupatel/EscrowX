'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FilePlus, Coins, Package, CheckCircle } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: FilePlus,
    title: 'Create Escrow',
    description: 'Define the project, set the price, and add the seller\'s Stellar wallet address. Deploy the smart contract in seconds.',
    color: 'text-[#5B6BF8]',
    bg: 'bg-[#EEF0FF]',
  },
  {
    number: '02',
    icon: Coins,
    title: 'Deposit XLM',
    description: 'Fund the escrow vault with XLM via Freighter wallet. Funds are locked in the Soroban contract — untouchable by anyone.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    number: '03',
    icon: Package,
    title: 'Deliver Work',
    description: 'Seller completes the work and submits deliverables. Files are pinned to IPFS for immutable, verifiable proof of delivery.',
    color: 'text-[#7B68EE]',
    bg: 'bg-[#EEF0FF]',
  },
  {
    number: '04',
    icon: CheckCircle,
    title: 'Release Funds',
    description: 'Buyer reviews and approves. The smart contract releases the XLM directly to the seller in 3 seconds. Zero intermediaries.',
    color: 'text-[#16A865]',
    bg: 'bg-emerald-50',
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="how-it-works" className="py-20 bg-[#F8F9FB]">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E4E8F0] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-4">
            Process
          </div>
          <h2 className="text-[40px] font-extrabold text-[#0F1117] tracking-tight mb-4">
            How it works
          </h2>
          <p className="text-[17px] text-[#6B7280] max-w-[520px] mx-auto leading-relaxed">
            From project creation to payment release — fully automated, on-chain, and trustless.
          </p>
        </div>

        {/* Steps — desktop horizontal, mobile vertical */}
        <div ref={ref} className="relative">
          {/* Connecting dashed line (desktop) */}
          <div className="hidden lg:block absolute top-[52px] left-[calc(12.5%_+_24px)] right-[calc(12.5%_+_24px)] h-px z-0">
            <svg className="w-full h-2" viewBox="0 0 800 2" preserveAspectRatio="none">
              <line x1="0" y1="1" x2="800" y2="1" stroke="#E4E8F0" strokeWidth="2" strokeDasharray="8 8" />
              <line x1="0" y1="1" x2="800" y2="1" stroke="#5B6BF8" strokeWidth="2" strokeDasharray="8 8" strokeDashoffset="16" opacity="0.4">
                <animate attributeName="stroke-dashoffset" from="32" to="0" dur="2s" repeatCount="indefinite" />
              </line>
            </svg>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 24 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.12, ease: 'easeOut' }}
                  className="relative flex flex-col items-center lg:items-start text-center lg:text-left"
                >
                  {/* Mobile connecting line */}
                  {index < STEPS.length - 1 && (
                    <div className="lg:hidden absolute left-1/2 top-[104px] -translate-x-1/2 w-0.5 h-8 bg-[#E4E8F0] z-0" />
                  )}

                  {/* Icon circle */}
                  <div className={`relative z-10 w-[52px] h-[52px] rounded-full ${step.bg} flex items-center justify-center mb-5 border-2 border-white shadow-md`}>
                    <Icon className={`w-5 h-5 ${step.color}`} />
                    {/* Step number overlay */}
                    <span
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-[#E4E8F0] flex items-center justify-center text-[9px] font-bold text-[#9CA3AF]"
                    >
                      {index + 1}
                    </span>
                  </div>

                  {/* Large background step number */}
                  <div className="relative">
                    <span
                      className="absolute -top-2 -left-2 text-[80px] font-black text-[#5B6BF8]/5 leading-none select-none pointer-events-none"
                    >
                      {step.number}
                    </span>
                    <h3 className="text-[18px] font-bold text-[#0F1117] mb-2 relative z-10">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-[14px] text-[#6B7280] leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
