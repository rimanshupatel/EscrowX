import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { WalletStatus } from '../wallet/WalletStatus';
import { LogOut, LayoutDashboard } from 'lucide-react';
import { Sidebar } from '../layout/Sidebar';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#0F1117] font-sans selection:bg-purple-500/30 selection:text-white flex">
      {/* Sidebar on the left */}
      <Sidebar />

      {/* Main Content Area on the right */}
      <div className="flex-1 ml-[240px] flex flex-col min-h-screen">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-[#E4E8F0] flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[17px] font-bold text-[#0F1117] tracking-tight">EscrowX Dashboard</h1>
            <span className="text-xs text-[#6B7280] border-l border-[#E4E8F0] pl-2.5">
              Good morning, <span className="text-[#0F1117] font-semibold">{user?.name || 'Guest'}</span> 👋
            </span>
          </div>

          {/* Header right: Controls */}
          <div className="flex items-center gap-3">
            {/* Wallet Integration Component */}
            <WalletStatus />
            {user && (
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-[8px] bg-[#F8F9FB] border border-[#E4E8F0] hover:border-red-500/20 hover:bg-red-500/10 text-[#6B7280] hover:text-red-500 transition-all cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {/* Banner Card showing current active view */}
          <div className="mb-6 p-4 rounded-xl bg-purple-50 border border-purple-100/80 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                <LayoutDashboard size={18} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-purple-600">
                  Active Environment
                </span>
                <h2 className="text-sm font-semibold text-[#0F1117]">
                  Currently displaying the {user?.role?.toLowerCase() || 'client'} view
                </h2>
              </div>
            </div>
            <div className="text-xs text-[#6B7280] hidden md:block">
              Connected as <span className="font-mono text-[#0F1117]">{user?.walletAddress || 'No Wallet'}</span>
            </div>
          </div>

          {/* Dashboard environment render */}
          {children}
        </div>
      </div>
    </div>
  );
};
export default DashboardLayout;
