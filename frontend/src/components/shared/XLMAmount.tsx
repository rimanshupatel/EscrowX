'use client';

import { formatXLM, formatUSD, xlmToUSD } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface XLMAmountProps {
  amount: number;
  showUSD?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES = {
  sm: { amount: 'text-lg font-bold', usd: 'text-xs', symbol: 'text-sm' },
  md: { amount: 'text-2xl font-bold', usd: 'text-sm', symbol: 'text-base' },
  lg: { amount: 'text-4xl font-extrabold', usd: 'text-base', symbol: 'text-xl' },
  xl: { amount: 'text-5xl font-extrabold tracking-tight', usd: 'text-lg', symbol: 'text-2xl' },
};

export function XLMAmount({ amount, showUSD = false, size = 'md', className }: XLMAmountProps) {
  const classes = SIZE_CLASSES[size];
  const usdValue = xlmToUSD(amount);

  return (
    <div className={cn('inline-flex flex-col', className)}>
      <div className="flex items-baseline gap-1.5">
        <span className={cn('font-mono text-[#0F1117]', classes.amount)}>
          {formatXLM(amount)}
        </span>
        <span className={cn('font-mono font-semibold text-[#7B68EE]', classes.symbol)}>
          XLM
        </span>
      </div>
      {showUSD && (
        <span className={cn('text-[#9CA3AF] font-mono mt-0.5', classes.usd)}>
          ≈ {formatUSD(usdValue)}
        </span>
      )}
    </div>
  );
}
