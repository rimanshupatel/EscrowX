import React from 'react';
import { Activity } from '../../../types/dashboard.types';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  activities?: Activity[];
  isLoading: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities = [],
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#E4E8F0] bg-white p-6 space-y-4">
        <div className="h-5 bg-slate-100 rounded w-1/3 mb-4 animate-pulse"></div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-100 flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-100 rounded w-5/6"></div>
              <div className="h-3 bg-slate-100 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const dotColors = {
    DELIVERY: 'bg-blue-500 shadow-blue-500/20',
    DISPUTE: 'bg-red-500 shadow-red-500/20',
    RELEASE: 'bg-green-500 shadow-green-500/20',
    NEW_ESCROW: 'bg-purple-500 shadow-purple-500/20',
  };

  return (
    <div className="rounded-xl border border-[#E4E8F0] bg-white p-6">
      <h3 className="text-lg font-semibold text-[#0F1117] mb-4">Recent Activity</h3>
      {activities.length === 0 ? (
        <div className="text-center py-8 text-[#9CA3AF] text-sm">
          No recent activity found.
        </div>
      ) : (
        <div className="relative border-l border-[#E4E8F0] pl-4 ml-2 space-y-5">
          {activities.map((activity, idx) => {
            const date = new Date(activity.timestamp);
            const timeAgo = isNaN(date.getTime())
              ? 'some time ago'
              : formatDistanceToNow(date, { addSuffix: true });

            return (
              <div
                key={activity.id}
                className="relative flex flex-col gap-1 transition-all duration-300 hover:translate-x-1"
                style={{
                  animation: `fadeIn 0.3s ease-out ${idx * 0.05}s both`,
                }}
              >
                {/* Timeline Dot */}
                <div
                  className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full ${
                    dotColors[activity.type] || 'bg-gray-400'
                  }`}
                />
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                  {activity.message}
                </p>
                <span className="text-xs text-[#9CA3AF]">{timeAgo}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
