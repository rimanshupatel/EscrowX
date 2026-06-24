'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Copy, LogOut, ExternalLink, ChevronDown } from 'lucide-react';
import { truncateAddress, copyToClipboard } from '@/lib/utils';
import { MOCK_WALLET } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

interface WalletConnectButtonProps {
  variant?: 'outlined' | 'filled';
  className?: string;
}

export function WalletConnectButton({ variant = 'filled', className }: WalletConnectButtonProps) {
  const [connected, setConnected] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const balance = 10_842.50;

  const handleConnect = () => {
    setConnected(true);
  };

  const handleCopy = async () => {
    await copyToClipboard(MOCK_WALLET);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDisconnect = () => {
    setConnected(false);
    setShowDropdown(false);
  };

  if (!connected) {
    return (
      <button
        onClick={handleConnect}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-semibold transition-all duration-200',
          variant === 'outlined'
            ? 'border border-[#5B6BF8] text-[#5B6BF8] hover:bg-[#EEF0FF]'
            : 'bg-[#5B6BF8] text-white hover:bg-[#4757E8] shadow-sm hover:shadow-md hover:-translate-y-px',
          className
        )}
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-2 rounded-[10px] text-sm font-medium border border-[#E4E8F0] bg-white hover:bg-[#F8F9FB] transition-all duration-200',
          className
        )}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#16A865]" />
          <span className="font-mono text-xs text-[#6B7280]">
            {truncateAddress(MOCK_WALLET, 6)}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-[#5B6BF8] bg-[#EEF0FF] px-1.5 py-0.5 rounded-[4px]">
          {balance.toLocaleString()} XLM
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
      </button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#E4E8F0] rounded-[12px] shadow-xl z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-[#E4E8F0]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF] mb-1">Connected Wallet</p>
              <p className="font-mono text-xs text-[#0F1117] break-all leading-relaxed">{MOCK_WALLET}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-[#0F1117]">{balance.toLocaleString()} XLM</span>
                <span className="text-xs text-[#9CA3AF]">≈ $1,214.36</span>
              </div>
            </div>

            <div className="p-1.5">
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-sm text-[#6B7280] hover:bg-[#F8F9FB] hover:text-[#0F1117] transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied!' : 'Copy Address'}
              </button>
              <a
                href="#"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-sm text-[#6B7280] hover:bg-[#F8F9FB] hover:text-[#0F1117] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View on Explorer
              </a>
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Disconnect
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
