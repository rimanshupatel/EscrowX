import React from 'react';
import { Message } from '../../../types/dashboard.types';
import { formatDistanceToNow } from 'date-fns';

interface MessagesPreviewProps {
  messages?: Message[];
  isLoading: boolean;
}

export const MessagesPreview: React.FC<MessagesPreviewProps> = ({
  messages = [],
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#E4E8F0] bg-white p-6 space-y-4">
        <div className="h-5 bg-slate-100 rounded w-1/3 mb-4 animate-pulse"></div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                <div className="h-3 bg-slate-100 rounded w-10"></div>
              </div>
              <div className="h-3 bg-slate-100 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E4E8F0] bg-white p-6">
      <h3 className="text-lg font-semibold text-[#0F1117] mb-4">Inbox Messages</h3>
      {messages.length === 0 ? (
        <div className="text-center py-8 text-[#9CA3AF] text-sm">
          No new messages.
        </div>
      ) : (
        <div className="space-y-4">
          {messages.slice(0, 3).map((msg) => {
            const date = new Date(msg.timestamp);
            const formattedTime = isNaN(date.getTime())
              ? 'some time ago'
              : formatDistanceToNow(date, { addSuffix: false });

            return (
              <div
                key={msg.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#F8F9FB] cursor-pointer transition-all duration-200"
              >
                {/* Avatar with optional unread badge */}
                <div className="relative flex-shrink-0">
                  <img
                    src={msg.avatar}
                    alt={msg.from}
                    className="w-10 h-10 rounded-full bg-slate-50 border border-[#E4E8F0]"
                  />
                  {msg.unread && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span
                      className={`text-sm ${
                        msg.unread ? 'text-[#0F1117] font-semibold' : 'text-slate-700 font-medium'
                      }`}
                    >
                      {msg.from}
                    </span>
                    <span className="text-xs text-[#9CA3AF] whitespace-nowrap ml-2">
                      {formattedTime}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate leading-relaxed">
                    {msg.preview}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
