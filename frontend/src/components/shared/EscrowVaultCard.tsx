'use client';

import { motion } from 'framer-motion';
import { Lock, Shield, Clock, CheckCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import type { EscrowStatus } from '@/lib/types';
import { XLMAmount } from './XLMAmount';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

interface EscrowVaultCardProps {
  amount: number;
  status: EscrowStatus;
  deadline?: string;
  contractId?: string;
  className?: string;
}

const STATUS_ICON: Record<EscrowStatus, React.ElementType> = {
  created: Shield,
  funded: Lock,
  delivered: CheckCircle,
  approved: CheckCircle,
  disputed: AlertTriangle,
  refunded: RotateCcw,
  complete: CheckCircle,
};

const STATUS_LABEL: Record<EscrowStatus, string> = {
  created: 'Awaiting Deposit',
  funded: 'Funds Locked',
  delivered: 'Pending Review',
  approved: 'Payment Released',
  disputed: 'Under Dispute',
  refunded: 'Funds Returned',
  complete: 'Completed',
};

const STATUS_COLOR: Record<EscrowStatus, string> = {
  created: 'text-[#9CA3AF]',
  funded: 'text-[#5B6BF8]',
  delivered: 'text-amber-500',
  approved: 'text-[#16A865]',
  disputed: 'text-red-500',
  refunded: 'text-orange-500',
  complete: 'text-[#16A865]',
};

export function EscrowVaultCard({ amount, status, deadline, contractId, className }: EscrowVaultCardProps) {
  const Icon = STATUS_ICON[status];
  const isFunded = status === 'funded';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-[16px] p-6',
        'glass-card',
        isFunded ? 'vault-glow-funded' : 'vault-glow',
        className
      )}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#EEF0FF]/60 via-white/20 to-[#F8F9FB]/40 pointer-events-none" />

      {/* Glow blob */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[#5B6BF8]/10 blur-2xl pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
              Escrow Vault
            </p>
            <p className="text-xs font-mono text-[#6B7280] mt-0.5">
              Protected by Soroban
            </p>
          </div>
          <div className={cn(
            'w-10 h-10 rounded-[10px] flex items-center justify-center',
            isFunded ? 'bg-[#5B6BF8] text-white' : 'bg-[#F2F4F8] text-[#6B7280]'
          )}>
            <Icon className="w-5 h-5" />
          </div>
        </div>

        {/* Amount — centered & large */}
        <div className="text-center my-6">
          <XLMAmount amount={amount} showUSD size="xl" />
        </div>

        {/* Status */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {isFunded && (
            <motion.div
              className="w-2 h-2 rounded-full bg-[#5B6BF8]"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
          <span className={cn('text-sm font-semibold', STATUS_COLOR[status])}>
            {STATUS_LABEL[status]}
          </span>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#E4E8F0] to-transparent mb-4" />

        {/* Footer info */}
        <div className="space-y-2.5">
          {deadline && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9CA3AF] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Deadline
              </span>
              <span className="text-xs font-semibold text-[#6B7280]">
                {formatDate(deadline)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9CA3AF]">Network fee</span>
            <span className="text-xs font-semibold text-[#16A865]">~$0.00001</span>
          </div>

          {contractId && (
            <div className="pt-1">
              <p className="text-[10px] font-mono text-[#9CA3AF] truncate" title={contractId}>
                {contractId.slice(0, 12)}...{contractId.slice(-6)}
              </p>
            </div>
          )}
        </div>

        {/* Trust badge */}
        <div className="mt-4 flex items-center gap-2 p-2.5 bg-[#EEF0FF]/60 rounded-[8px] border border-[#DDE2FF]">
          <Shield className="w-3.5 h-3.5 text-[#5B6BF8] shrink-0" />
          <span className="text-[10px] font-semibold text-[#5B6BF8]">
            Funds Protected by Soroban Smart Contract
          </span>
        </div>
      </div>
    </motion.div>
  );
}
