'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' };
  icon: React.ReactNode;
  accent?: 'default' | 'success' | 'warning' | 'danger' | 'brand';
  delay?: number;
  className?: string;
}

const ACCENT_CLASSES = {
  default: 'bg-[#F2F4F8] text-[#6B7280]',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-red-50 text-red-500',
  brand: 'bg-[#EEF0FF] text-[#5B6BF8]',
};

export function StatCard({ label, value, subValue, trend, icon, accent = 'brand', delay = 0, className }: StatCardProps) {
  const TrendIcon = trend?.direction === 'up' ? TrendingUp : trend?.direction === 'down' ? TrendingDown : Minus;
  const trendColor = trend?.direction === 'up' ? 'text-[#16A865]' : trend?.direction === 'down' ? 'text-red-500' : 'text-[#9CA3AF]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(91,107,248,0.16), 0 1px 4px rgba(0,0,0,0.08)' }}
      className={cn(
        'bg-white rounded-[16px] p-6 border border-[#E4E8F0] cursor-default',
        'shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_32px_rgba(91,107,248,0.08)]',
        'transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF] mb-2">
            {label}
          </p>
          <p className="text-[28px] font-bold text-[#0F1117] leading-none tracking-tight">
            {value}
          </p>
          {subValue && (
            <p className="text-sm text-[#9CA3AF] mt-1">{subValue}</p>
          )}
          {trend && (
            <div className={cn('inline-flex items-center gap-1 mt-2 text-xs font-semibold', trendColor)}>
              <TrendIcon className="w-3 h-3" />
              {trend.value}
            </div>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0', ACCENT_CLASSES[accent])}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
