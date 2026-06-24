'use client';

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function CTABanner() {
  return (
    <section className="py-20">
      <div className="max-w-[1280px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[24px] p-12 md:p-16 text-center"
          style={{ background: 'linear-gradient(135deg, #5B6BF8 0%, #7B68EE 100%)' }}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 pointer-events-none opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
                backgroundSize: '32px 32px',
              }}
            />
          </div>
          {/* Blobs */}
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-white/80 text-[11px] font-semibold uppercase tracking-[0.1em] mb-6">
              Get started today
            </div>
            <h2 className="text-[40px] md:text-[52px] font-extrabold text-white tracking-tight leading-tight mb-4">
              Start your first escrow
              <br />
              in under 60 seconds.
            </h2>
            <p className="text-[17px] text-white/70 mb-8 max-w-[480px] mx-auto leading-relaxed">
              No sign-up, no KYC, no paperwork. Just connect your Freighter wallet and create a trustless escrow instantly.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/escrow/new"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[10px] bg-white text-[#5B6BF8] font-bold hover:bg-[#F8F9FB] transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Connect Wallet
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[10px] border border-white/30 text-white font-semibold hover:bg-white/10 transition-all duration-200"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
