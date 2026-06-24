import React from 'react';
import { Wallet, LogOut, Loader2 } from 'lucide-react';
import { useFreighter } from '@/hooks/useFreighter';
import { WalletStatus } from './WalletStatus';

function shortenAddress(addr: string): string {
  if (addr.length <= 8) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export interface WalletButtonProps {
  className?: string;
}

export function WalletButton({ className }: WalletButtonProps) {
  const {
    isConnected,
    walletAddress,
    connectWallet,
    disconnectWallet,
    isLoading,
    error,
  } = useFreighter();

  const handleConnect = async (e: React.MouseEvent) => {
    e.preventDefault();
    await connectWallet();
  };

  const handleDisconnect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    disconnectWallet();
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-semibold border border-[#E5E7EB] bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-500 cursor-not-allowed transition-all ${className || ''}`}
      >
        <Loader2 className="w-4 h-4 animate-spin text-[#5B6BF8]" />
        Connecting...
      </button>
    );
  }

  // 2. Connected State
  if (isConnected && walletAddress) {
    return (
      <div className={`group/chip inline-flex items-center gap-3 px-3 py-2 rounded-[10px] bg-slate-900 border border-[#16A865]/40 shadow-[0_0_12px_rgba(22,168,101,0.2)] text-white transition-all duration-300 hover:border-[#16A865]/80 hover:shadow-[0_0_16px_rgba(22,168,101,0.35)] ${className || ''}`}>
        <div className="flex items-center gap-2">
          <WalletStatus />
          <span className="font-mono text-xs font-medium text-slate-200 tracking-wide select-all">
            {shortenAddress(walletAddress)}
          </span>
        </div>

        {/* Tooltip + Disconnect Button */}
        <div className="relative group/tooltip flex items-center">
          <button
            onClick={handleDisconnect}
            aria-label="Disconnect wallet"
            className="p-1 rounded-[6px] hover:bg-white/10 text-slate-400 hover:text-red-400 opacity-80 md:opacity-0 group-hover/chip:opacity-100 hover:opacity-100 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 text-[10px] font-semibold text-white bg-slate-950 border border-slate-800 rounded-md opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-lg z-50">
            Disconnect wallet
          </span>
        </div>
      </div>
    );
  }

  // 3. Error State
  if (error) {
    return (
      <div className={`flex flex-col items-center sm:items-end gap-1 ${className || ''}`}>
        <button
          onClick={handleConnect}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-semibold transition-all duration-200 border border-red-500 bg-red-50/50 text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/35 cursor-pointer active:scale-[0.98]"
        >
          <Wallet className="w-4 h-4 text-red-500" />
          Connect Wallet
        </button>
        <span className="text-[10px] font-medium text-red-600 dark:text-red-400 max-w-[240px] text-center sm:text-right mt-0.5 animate-pulse">
          {error}
        </span>
      </div>
    );
  }

  // 4. Disconnected State (Default)
  return (
    <button
      onClick={handleConnect}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-semibold transition-all duration-200 border border-[#E5E7EB] bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-600 active:scale-[0.98] cursor-pointer ${className || ''}`}
    >
      <Wallet className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      Connect Wallet
    </button>
  );
}
