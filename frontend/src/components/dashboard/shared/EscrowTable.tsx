import React from 'react';
import { Escrow } from '../../../types/dashboard.types';
import { StatusBadge } from './StatusBadge';
import { format, differenceInDays } from 'date-fns';
import { Shield, Sparkles } from 'lucide-react';

interface EscrowTableProps {
  escrows?: Escrow[];
  isLoading: boolean;
}

export const EscrowTable: React.FC<EscrowTableProps> = ({
  escrows = [],
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#E4E8F0] bg-white p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-slate-100 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[#E4E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                <div className="space-y-1.5">
                  <div className="h-3.5 bg-slate-100 rounded w-24"></div>
                  <div className="h-2.5 bg-slate-100 rounded w-16"></div>
                </div>
              </div>
              <div className="h-4 bg-slate-100 rounded w-16"></div>
              <div className="h-4 bg-slate-100 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (escrows.length === 0) {
    return (
      <div className="rounded-xl border border-[#E4E8F0] bg-white p-10 flex flex-col items-center justify-center text-center">
        <div className="p-4 rounded-full bg-[#F8F9FB] text-[#9CA3AF] mb-4">
          <Shield size={48} className="stroke-[1.5]" />
        </div>
        <h4 className="text-slate-800 font-medium mb-1">No Escrows Found</h4>
        <p className="text-xs text-[#9CA3AF] max-w-xs leading-relaxed">
          Create your first smart contract-backed escrow to start working securely on EscrowX.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E4E8F0] bg-white overflow-hidden">
      {/* Desktop view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[#E4E8F0] bg-[#F8F9FB]/50">
              <th className="p-4 text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
                Freelancer
              </th>
              <th className="p-4 text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
                Job Title
              </th>
              <th className="p-4 text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
                Amount (XLM)
              </th>
              <th className="p-4 text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
                Deadline
              </th>
              <th className="p-4 text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E8F0]">
            {escrows.map((escrow) => {
              const deadlineDate = new Date(escrow.deadline);
              const daysLeft = differenceInDays(deadlineDate, new Date());
              const isUrgent = daysLeft >= 0 && daysLeft < 3;
              const formattedDeadline = isNaN(deadlineDate.getTime())
                ? escrow.deadline
                : format(deadlineDate, 'MMM dd, yyyy');

              return (
                <tr
                  key={escrow.id}
                  className="hover:bg-[#F8F9FB] transition-colors duration-150 group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={escrow.freelancerAvatar}
                        alt={escrow.freelancerName}
                        className="w-8 h-8 rounded-full bg-slate-50 border border-[#E4E8F0] group-hover:border-slate-300 transition-all"
                      />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-[#0F1117]">
                        {escrow.freelancerName}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-medium text-[#0F1117]">
                      {escrow.jobTitle}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-[#0F1117]">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-[10px]">
                        <Sparkles size={10} />
                      </div>
                      <span>{escrow.amountLocked} XLM</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-sm ${
                        isUrgent ? 'text-red-500 font-medium' : 'text-slate-500'
                      }`}
                    >
                      {formattedDeadline}
                      {isUrgent && (
                        <span className="text-[10px] block font-bold uppercase text-red-500 tracking-wider">
                          Due soon!
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={escrow.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile view */}
      <div className="grid grid-cols-1 divide-y divide-[#E4E8F0] md:hidden">
        {escrows.map((escrow) => {
          const deadlineDate = new Date(escrow.deadline);
          const daysLeft = differenceInDays(deadlineDate, new Date());
          const isUrgent = daysLeft >= 0 && daysLeft < 3;
          const formattedDeadline = isNaN(deadlineDate.getTime())
            ? escrow.deadline
            : format(deadlineDate, 'MMM dd, yyyy');

          return (
            <div key={escrow.id} className="p-4 space-y-3 hover:bg-[#F8F9FB]">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <img
                    src={escrow.freelancerAvatar}
                    alt={escrow.freelancerName}
                    className="w-7 h-7 rounded-full bg-slate-50 border border-[#E4E8F0]"
                  />
                  <div>
                    <h5 className="text-xs font-semibold text-slate-400">Freelancer</h5>
                    <p className="text-sm font-medium text-[#0F1117]">{escrow.freelancerName}</p>
                  </div>
                </div>
                <StatusBadge status={escrow.status} />
              </div>

              <div>
                <h5 className="text-xs font-semibold text-slate-400">Job Title</h5>
                <p className="text-sm text-slate-700">{escrow.jobTitle}</p>
              </div>

              <div className="flex justify-between items-end pt-1">
                <div>
                  <h5 className="text-xs font-semibold text-slate-400">Amount Locked</h5>
                  <div className="flex items-center gap-1 text-sm font-bold text-[#0F1117] mt-0.5">
                    <Sparkles size={12} className="text-indigo-600" />
                    <span>{escrow.amountLocked} XLM</span>
                  </div>
                </div>
                <div className="text-right">
                  <h5 className="text-xs font-semibold text-slate-400">Deadline</h5>
                  <span
                    className={`text-sm ${
                      isUrgent ? 'text-red-500 font-semibold' : 'text-slate-500'
                    }`}
                  >
                    {formattedDeadline}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
