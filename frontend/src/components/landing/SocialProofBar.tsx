'use client';

export function SocialProofBar() {
  return (
    <section className="py-10 bg-white border-y border-[#E4E8F0]">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <p className="text-sm text-[#9CA3AF] font-medium whitespace-nowrap">
            Trusted by builders on
          </p>
          <div className="flex items-center gap-8">
            {/* Stellar */}
            <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-6 h-6 rounded-full bg-[#5B6BF8] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 48 48" fill="none">
                  <path d="M24 8L27.5 18.5H38.5L29.5 25L33 35.5L24 29L15 35.5L18.5 25L9.5 18.5H20.5L24 8Z" fill="white"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-[#6B7280]">Stellar</span>
            </div>
            {/* Soroban */}
            <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-6 h-6 rounded-[5px] bg-gradient-to-br from-[#5B6BF8] to-[#7B68EE] flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                  <rect x="1" y="1" width="4" height="4" rx="1"/>
                  <rect x="7" y="1" width="4" height="4" rx="1"/>
                  <rect x="1" y="7" width="4" height="4" rx="1"/>
                  <rect x="7" y="7" width="4" height="4" rx="1"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-[#6B7280]">Soroban</span>
            </div>
            {/* Freighter */}
            <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-[#5B6BF8] flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                  <path d="M2 4h8M2 8h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-[#6B7280]">Freighter</span>
            </div>
            {/* Separator */}
            <div className="h-4 w-px bg-[#E4E8F0]" />
            {/* Stats */}
            <div className="flex items-center gap-6 text-center">
              <div>
                <p className="text-[17px] font-bold text-[#0F1117]">$2.4M+</p>
                <p className="text-[11px] text-[#9CA3AF]">Locked in escrow</p>
              </div>
              <div>
                <p className="text-[17px] font-bold text-[#0F1117]">1,200+</p>
                <p className="text-[11px] text-[#9CA3AF]">Builders</p>
              </div>
              <div>
                <p className="text-[17px] font-bold text-[#0F1117]">98.2%</p>
                <p className="text-[11px] text-[#9CA3AF]">Success rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
