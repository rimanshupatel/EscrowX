'use client';

import { useState } from 'react';
import { Copy, ExternalLink, Check } from 'lucide-react';
import { truncateHash, copyToClipboard } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface TransactionHashProps {
  hash: string;
  label?: string;
  explorerUrl?: string;
  chars?: number;
  className?: string;
}

export function TransactionHash({ hash, label, explorerUrl, chars = 8, className }: TransactionHashProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const stellarExplorer = explorerUrl || `https://stellar.expert/explorer/testnet/tx/${hash}`;

  return (
    <div className={cn('inline-flex flex-col gap-0.5', className)}>
      {label && (
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
          {label}
        </span>
      )}
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-sm text-[#6B7280] bg-[#F2F4F8] px-2 py-1 rounded-[6px]">
          {truncateHash(hash, chars)}
        </span>
        <button
          onClick={handleCopy}
          title="Copy hash"
          className="p-1 rounded-[6px] text-[#9CA3AF] hover:text-[#5B6BF8] hover:bg-[#EEF0FF] transition-all duration-150"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#16A865]" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <a
          href={stellarExplorer}
          target="_blank"
          rel="noopener noreferrer"
          title="View on Stellar Explorer"
          className="p-1 rounded-[6px] text-[#9CA3AF] hover:text-[#5B6BF8] hover:bg-[#EEF0FF] transition-all duration-150"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
