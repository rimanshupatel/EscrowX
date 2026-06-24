'use client';

import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Plus } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  showNewEscrow?: boolean;
}

export function AppLayout({ children, title, showNewEscrow = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex">
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 ml-[240px] flex flex-col min-h-screen">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-[#E4E8F0] flex items-center justify-between px-6 sticky top-0 z-30">
          <h1 className="text-[17px] font-bold text-[#0F1117] tracking-tight">{title}</h1>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-[8px] hover:bg-[#F8F9FB] transition-colors text-[#6B7280] hover:text-[#0F1117]">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#5B6BF8]" />
            </button>

            {showNewEscrow && (
              <Link
                to="/escrow/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-[#5B6BF8] text-white text-sm font-semibold hover:bg-[#4757E8] transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-[#5B6BF8]/20 hover:-translate-y-px"
              >
                <Plus className="w-4 h-4" />
                New Escrow
              </Link>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
