import React from 'react';
import { UserRole } from '../../../types/dashboard.types';
import { Plus, Search, AlertTriangle, Upload, Wallet, Gavel, UserMinus, FileSpreadsheet } from 'lucide-react';
import { useDisputes } from '../../../hooks/useDashboard';

interface QuickActionsProps {
  role: UserRole;
  onAction?: (actionName: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ role, onAction }) => {
  const { data: disputes } = useDisputes();
  const openDisputesCount = disputes ? disputes.filter((d) => d.status === 'OPEN').length : 0;

  const handleClick = (actionName: string) => {
    if (onAction) {
      onAction(actionName);
    } else {
      alert(`Triggered action: "${actionName}" (Simulation)`);
    }
  };

   if (role === 'CLIENT') {
    return (
      <div className="rounded-xl border border-[#E4E8F0] bg-white p-6">
        <h3 className="text-lg font-semibold text-[#0F1117] mb-4">Quick Actions</h3>
        <div className="flex flex-col gap-3">
          {/* Create New Escrow */}
          <button
            onClick={() => handleClick('create_escrow')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            Create New Escrow
          </button>

          {/* Browse Freelancers */}
          <button
            onClick={() => handleClick('browse_freelancers')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-[#0F1117] bg-transparent border border-[#E4E8F0] hover:bg-[#F8F9FB] transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Search size={16} />
            Browse Freelancers
          </button>

          {/* Open Disputes */}
          <button
            onClick={() => handleClick('open_disputes')}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:text-red-700 bg-transparent border border-red-200 hover:bg-red-50/50 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <AlertTriangle size={16} />
              Open Disputes
            </span>
            {openDisputesCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {openDisputesCount}
              </span>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (role === 'FREELANCER') {
    return (
      <div className="rounded-xl border border-[#E4E8F0] bg-white p-6">
        <h3 className="text-lg font-semibold text-[#0F1117] mb-4">Quick Actions</h3>
        <div className="flex flex-col gap-3">
          {/* Create New Gig */}
          <button
            onClick={() => handleClick('create_gig')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            Create New Gig
          </button>

          {/* Deliver Work */}
          <button
            onClick={() => handleClick('deliver_work')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
          >
            <Upload size={16} />
            Deliver Work
          </button>

          {/* My Earnings */}
          <button
            onClick={() => handleClick('my_earnings')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-500 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
          >
            <Wallet size={16} />
            My Earnings
          </button>
        </div>
      </div>
    );
  }

  if (role === 'ADMIN') {
    return (
      <div className="rounded-xl border border-[#E4E8F0] bg-white p-6">
        <h3 className="text-lg font-semibold text-[#0F1117] mb-4">Quick Actions</h3>
        <div className="flex flex-col gap-3">
          {/* Assign to DAO */}
          <button
            onClick={() => handleClick('assign_to_dao')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Gavel size={16} />
            Assign to DAO
          </button>

          {/* Suspend User */}
          <button
            onClick={() => handleClick('suspend_user')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-500 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <UserMinus size={16} />
            Suspend User
          </button>

          {/* Platform Report */}
          <button
            onClick={() => handleClick('platform_report')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-[#0F1117] bg-[#F8F9FB] border border-[#E4E8F0] hover:bg-slate-100 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet size={16} />
            Platform Report
          </button>
        </div>
      </div>
    );
  }

  return null;
};
