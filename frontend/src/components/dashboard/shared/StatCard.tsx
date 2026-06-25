import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value?: string | number;
  icon: LucideIcon;
  trend?: string;
  color: 'purple' | 'blue' | 'green' | 'amber' | 'red';
  isLoading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#E4E8F0] bg-white p-6 animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="h-4 bg-slate-100 rounded w-24"></div>
          <div className="w-10 h-10 rounded-lg bg-slate-100"></div>
        </div>
        <div className="h-8 bg-slate-100 rounded w-16 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded w-28"></div>
      </div>
    );
  }

  // Define styling configurations per color
  const colorStyles = {
    purple: {
      gradient: 'bg-white hover:border-purple-200 hover:shadow-purple-100/30',
      iconContainer: 'bg-purple-50 text-purple-600',
    },
    blue: {
      gradient: 'bg-white hover:border-blue-200 hover:shadow-blue-100/30',
      iconContainer: 'bg-blue-50 text-blue-600',
    },
    green: {
      gradient: 'bg-white hover:border-green-200 hover:shadow-green-100/30',
      iconContainer: 'bg-green-50 text-green-600',
    },
    amber: {
      gradient: 'bg-white hover:border-amber-200 hover:shadow-amber-100/30',
      iconContainer: 'bg-amber-50 text-amber-600',
    },
    red: {
      gradient: 'bg-white hover:border-red-200 hover:shadow-red-100/30',
      iconContainer: 'bg-red-50 text-red-600',
    },
  };

  const isPositiveTrend = trend ? !trend.includes('-') : true;

  return (
    <div
      className={`rounded-xl border border-[#E4E8F0] p-6 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md hover:shadow-[#5B6BF8]/5 ${colorStyles[color].gradient}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs text-[#6B7280] uppercase tracking-widest font-medium">
          {title}
        </span>
        <div className={`p-2 rounded-lg ${colorStyles[color].iconContainer}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="text-3xl font-bold tracking-tight text-[#0F1117] mb-2">
        {value}
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-1 text-xs">
          {isPositiveTrend ? (
            <span className="text-green-600 flex items-center gap-0.5">
              <TrendingUp size={14} />
              {trend}
            </span>
          ) : (
            <span className="text-red-600 flex items-center gap-0.5">
              <TrendingDown size={14} />
              {trend}
            </span>
          )}
          <span className="text-[#9CA3AF]">since last month</span>
        </div>
      )}
    </div>
  );
};
