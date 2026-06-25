import React from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  useClientStats,
  useEscrows,
  useActivities,
  useMessages,
} from '../../hooks/useDashboard';
import { StatCard } from './shared/StatCard';
import { EscrowTable } from './shared/EscrowTable';
import { ActivityFeed } from './shared/ActivityFeed';
import { MessagesPreview } from './shared/MessagesPreview';
import { QuickActions } from './shared/QuickActions';
import { Shield, Clock, CheckCircle, Coins } from 'lucide-react';

export const ClientDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const clientName = user?.name || 'Priya Shah';

  const { data: stats, isLoading: statsLoading, isError: statsError } = useClientStats();
  const { data: escrows, isLoading: escrowsLoading, isError: escrowsError } = useEscrows();
  const { data: activities, isLoading: activitiesLoading } = useActivities();
  const { data: messages, isLoading: messagesLoading } = useMessages();

  // Filter client's escrows
  const clientEscrows = escrows ? escrows.filter((esc) => esc.clientName === clientName) : [];

  if (statsError || escrowsError) {
    return (
      <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-center my-8">
        <h3 className="font-semibold text-lg mb-2">Error Loading Client Dashboard</h3>
        <p className="text-sm text-red-400/80">
          Please check that your mock server is running on port 3001 (`npm run mock-api`).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* SECTION 1 - TOP STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Escrows Created"
          value={stats?.totalEscrows}
          icon={Shield}
          color="purple"
          trend="+12%"
          isLoading={statsLoading}
        />
        <StatCard
          title="Active Escrows"
          value={stats?.activeEscrows}
          icon={Clock}
          color="amber"
          trend="+4%"
          isLoading={statsLoading}
        />
        <StatCard
          title="Completed Jobs"
          value={stats?.completedJobs}
          icon={CheckCircle}
          color="green"
          trend="+18%"
          isLoading={statsLoading}
        />
        <StatCard
          title="Total XLM Spent"
          value={stats ? `${stats.totalXlmSpent} XLM` : undefined}
          icon={Coins}
          color="blue"
          trend="+22%"
          isLoading={statsLoading}
        />
      </div>

      {/* SECTION 2 - MY ACTIVE ESCROWS */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-[#0F1117]">My Active Escrows</h3>
          <span className="text-xs text-slate-400 font-mono">
            {clientEscrows.length} total escrows
          </span>
        </div>
        <EscrowTable escrows={clientEscrows} isLoading={escrowsLoading} />
      </div>

      {/* SECTION 3 - TWO COLUMN ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-6">
          <ActivityFeed activities={activities} isLoading={activitiesLoading} />
        </div>
        <div className="lg:col-span-4 flex flex-col gap-6">
          <QuickActions role="CLIENT" />
          <MessagesPreview messages={messages} isLoading={messagesLoading} />
        </div>
      </div>
    </div>
  );
};
export default ClientDashboard;
