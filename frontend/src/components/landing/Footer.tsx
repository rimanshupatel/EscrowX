'use client';

import { Link } from 'react-router-dom';
import { GitBranch, MessageCircle, Globe } from 'lucide-react';

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Changelog', href: '#' },
  ],
  Developers: [
    { label: 'Documentation', href: '#' },
    { label: 'API Reference', href: '#' },
    { label: 'GitHub', href: '#' },
    { label: 'Status', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
    { label: 'Security', href: '#' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#0F1117] text-white">
      <div className="max-w-[1280px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-[7px] bg-[#5B6BF8] flex items-center justify-center">
                <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="4" width="14" height="10" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
                  <path d="M6 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="white" strokeWidth="1.5"/>
                  <circle cx="9" cy="9" r="1.5" fill="white"/>
                  <path d="M9 10.5v1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-[16px] font-bold tracking-tight">EscrowX</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Decentralized escrow for the modern freelance economy. Powered by Stellar and Soroban.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 rounded-[7px] bg-white/10 flex items-center justify-center hover:bg-[#5B6BF8] transition-colors">
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="w-8 h-8 rounded-[7px] bg-white/10 flex items-center justify-center hover:bg-[#5B6BF8] transition-colors">
                <GitBranch className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="w-8 h-8 rounded-[7px] bg-white/10 flex items-center justify-center hover:bg-[#5B6BF8] transition-colors">
                <Globe className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500 mb-4">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            EscrowX © 2025 — Built on Stellar
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#16A865]" />
            <span className="text-xs text-gray-500">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
