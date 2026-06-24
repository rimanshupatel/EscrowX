'use client';

import { motion } from 'framer-motion';
import type { EscrowStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface EscrowStatusBadgeProps {
  status: EscrowStatus;
  showPulse?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<EscrowStatus, {
  label: string;
  bg: string;
  text: string;
  dot: string;
  border: string;
}> = {
  created: {
    label: 'Created',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
    border: 'border-gray-200',
  },
  funded: {
    label: 'Funded',
    bg: 'bg-[#EEF0FF]',
    text: 'text-[#5B6BF8]',
    dot: 'bg-[#5B6BF8]',
    border: 'border-[#BCC5FF]',
  },
  delivered: {
    label: 'Delivered',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
  },
  approved: {
    label: 'Approved',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200',
  },
  disputed: {
    label: 'Disputed',
    bg: 'bg-red-50',
    text: 'text-red-600',
    dot: 'bg-red-500',
    border: 'border-red-200',
  },
  refunded: {
    label: 'Refunded',
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    dot: 'bg-orange-400',
    border: 'border-orange-200',
  },
  complete: {
    label: 'Complete',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200',
  },
};

export function EscrowStatusBadge({ status, showPulse = true, className }: EscrowStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const isFunded = status === 'funded';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold tracking-[0.08em] uppercase border',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {isFunded && showPulse && (
          <motion.span
            className={cn('absolute inline-flex h-full w-full rounded-full opacity-75', config.dot)}
            animate={{ scale: [1, 1.8], opacity: [0.7, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <span className={cn('relative inline-flex rounded-full h-2 w-2', config.dot)} />
      </span>
      {config.label}
    </span>
  );
}
