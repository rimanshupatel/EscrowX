'use client';

import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Shield,
  PlusCircle,
  Gavel,
  BarChart2,
  Settings,
  Briefcase,
  CreditCard,
  Star,
  MessageSquare,
  LogOut,
  ClipboardList,
} from 'lucide-react';
import { truncateAddress } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

const CLIENT_NAV = [
  { href: '/client/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/client/jobs', label: 'My Jobs', icon: Briefcase },
  { href: '/client/escrows', label: 'My Escrows', icon: Shield },
  { href: '/client/escrow/new', label: 'Create Escrow', icon: PlusCircle },
  { href: '/client/payments', label: 'Payments', icon: CreditCard },
  { href: '/client/reviews', label: 'Reviews', icon: Star },
  { href: '/client/chat', label: 'Messages', icon: MessageSquare },
  { href: '/client/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/client/settings', label: 'Settings', icon: Settings },
];

const FREELANCER_NAV = [
  { href: '/freelancer/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/freelancer/jobs', label: 'Browse Jobs', icon: Briefcase },
  { href: '/freelancer/applications', label: 'My Applications', icon: ClipboardList },
  { href: '/freelancer/escrows', label: 'My Contracts', icon: Shield },
  { href: '/freelancer/payments', label: 'Earnings', icon: CreditCard },
  { href: '/freelancer/reviews', label: 'Reputation', icon: Star },
  { href: '/freelancer/chat', label: 'Messages', icon: MessageSquare },
  { href: '/freelancer/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/freelancer/settings', label: 'Settings', icon: Settings },
];

const ARBITRATOR_NAV = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/disputes', label: 'Disputes', icon: Gavel, badge: true },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

const ADMIN_NAV = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/disputes', label: 'Disputes', icon: Gavel, badge: true },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const { user, walletAddress, logout } = useAuthStore();
  const navigate = useNavigate();

  const navLinks = user?.role === 'FREELANCER'
    ? FREELANCER_NAV
    : user?.role === 'ARBITRATOR'
    ? ARBITRATOR_NAV
    : user?.role === 'ADMIN'
    ? ADMIN_NAV
    : CLIENT_NAV;

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] bg-white border-r border-[#E4E8F0] flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 h-16 flex items-center border-b border-[#E4E8F0]">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-[7px] bg-[#5B6BF8] flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="4" width="14" height="10" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
              <path d="M6 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="white" strokeWidth="1.5"/>
              <circle cx="9" cy="9" r="1.5" fill="white"/>
              <path d="M9 10.5v1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-[16px] font-bold text-[#0F1117] tracking-tight">EscrowX</span>
        </Link>
      </div>

      {/* Role badge */}
      {user && (
        <div className="px-5 pt-4 pb-2">
          <span className={cn(
            'text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full',
            user.role === 'CLIENT' && 'bg-blue-50 text-blue-600',
            user.role === 'FREELANCER' && 'bg-purple-50 text-purple-600',
            user.role === 'ARBITRATOR' && 'bg-amber-50 text-amber-600',
            user.role === 'ADMIN' && 'bg-red-50 text-red-600',
          )}>
            {user.role}
          </span>
          <p className="text-xs font-semibold text-[#0F1117] mt-1 truncate">{user.username || user.email}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));

          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-[#EEF0FF] text-[#5B6BF8] border-l-[3px] border-l-[#5B6BF8] pl-[calc(0.75rem_-_3px)]'
                  : 'text-[#6B7280] hover:bg-[#F8F9FB] hover:text-[#0F1117]'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  isActive ? 'text-[#5B6BF8]' : 'text-[#9CA3AF] group-hover:text-[#6B7280]'
                )}
              />
              {link.label}
              {(link as any).badge && (
                <span className="ml-auto text-[10px] font-bold bg-red-50 text-red-500 px-1.5 py-0.5 rounded-[4px]">
                  !
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Wallet info + Logout */}
      <div className="p-3 border-t border-[#E4E8F0] space-y-2">
        <div className="bg-[#F8F9FB] rounded-[10px] p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-[#16A865]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
              Connected
            </span>
          </div>
          <p className="font-mono text-[11px] text-[#6B7280] mb-1.5 break-all leading-relaxed">
            {truncateAddress(walletAddress || '', 8)}
          </p>
          {user && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-[4px]">
                {user.badge}
              </span>
              <span className="text-xs font-bold text-[#0F1117]">Score: {user.trustScore}</span>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
