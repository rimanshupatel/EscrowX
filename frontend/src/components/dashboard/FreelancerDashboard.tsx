import React from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  useFreelancerStats,
  useEscrows,
  useGigs,
  useActivities,
  useMessages,
} from '../../hooks/useDashboard';
import { StatCard } from './shared/StatCard';
import { ActivityFeed } from './shared/ActivityFeed';
import { MessagesPreview } from './shared/MessagesPreview';
import { QuickActions } from './shared/QuickActions';
import {
  Briefcase,
  Clock,
  CheckCircle,
  TrendingUp,
  Sparkles,
  Star,
  Eye,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow, differenceInDays, format } from 'date-fns';

export const FreelancerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const freelancerName = user?.name || 'Alex Rivera';

  const { data: stats, isLoading: statsLoading, isError: statsError } = useFreelancerStats();
  const { data: escrows, isLoading: escrowsLoading, isError: escrowsError } = useEscrows();
  const { data: gigs, isLoading: gigsLoading, isError: gigsError } = useGigs();
  const { data: activities, isLoading: activitiesLoading } = useActivities();
  const { data: messages, isLoading: messagesLoading } = useMessages();

  // Filter freelancer's incoming escrows (excluding RELEASED/REFUNDED for active work screen)
  const freelancerEscrows = escrows
    ? escrows.filter(
        (esc) =>
          esc.freelancerName === freelancerName &&
          (esc.status === 'PENDING' || esc.status === 'DELIVERED' || esc.status === 'DISPUTED')
      )
    : [];

  // Filter activities for freelancer events
  const freelancerActivities = activities
    ? activities.filter((act) => {
        const msg = act.message.toLowerCase();
        return (
          msg.includes('freelancer') ||
          msg.includes('delivery') ||
          msg.includes('approved your') ||
          msg.includes('your gig') ||
          msg.includes('released')
        );
      })
    : [];

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={12}
            className={i < Math.round(rating) ? 'fill-amber-500 text-amber-500' : 'text-white/10'}
          />
        ))}
        <span className="text-xs text-white/50 ml-1.5 font-mono">{rating}</span>
      </div>
    );
  };

  const renderViewsBar = (views: number) => {
    const maxViews = 200;
    const widthPercentage = Math.min((views / maxViews) * 100, 100);
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/80 font-mono w-8">{views}</span>
        <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-indigo-500 rounded-full"
            style={{ width: `${widthPercentage}%` }}
          />
        </div>
      </div>
    );
  };

  if (statsError || escrowsError || gigsError) {
    return (
      <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-center my-8">
        <h3 className="font-semibold text-lg mb-2">Error Loading Freelancer Dashboard</h3>
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
          title="Active Orders"
          value={stats?.activeOrders}
          icon={Briefcase}
          color="amber"
          trend="+2"
          isLoading={statsLoading}
        />
        <StatCard
          title="Pending Deliveries"
          value={stats?.pendingDeliveries}
          icon={Clock}
          color="red"
          trend="+1"
          isLoading={statsLoading}
        />
        <StatCard
          title="Completed Orders"
          value={stats?.completedOrders}
          icon={CheckCircle}
          color="green"
          trend="+5"
          isLoading={statsLoading}
        />
        <StatCard
          title="Total XLM Earned"
          value={stats ? `${stats.totalXlmEarned} XLM` : undefined}
          icon={TrendingUp}
          color="purple"
          trend="+15%"
          isLoading={statsLoading}
        />
      </div>

      {/* SECTION 2 - INCOMING ESCROWS (Cards Layout with Hover Glow) */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-[#0F1117]">Incoming & Active Escrows</h3>
        {escrowsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-44 bg-white border border-[#E4E8F0] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : freelancerEscrows.length === 0 ? (
          <div className="rounded-xl border border-[#E4E8F0] bg-white p-8 text-center text-[#9CA3AF] text-sm">
            No active incoming escrows at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {freelancerEscrows.map((escrow) => {
              const deadlineDate = new Date(escrow.deadline);
              const daysLeft = differenceInDays(deadlineDate, new Date());
              const isUrgent = daysLeft >= 0 && daysLeft < 3;
              const countdown = isNaN(deadlineDate.getTime())
                ? escrow.deadline
                : formatDistanceToNow(deadlineDate, { addSuffix: true });

              return (
                <div
                  key={escrow.id}
                  className="group relative rounded-xl border border-[#E4E8F0] bg-white p-5 transition-all duration-300 hover:border-teal-450 hover:shadow-md hover:shadow-teal-500/5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header: Client Avatar + Job Title */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={escrow.clientAvatar}
                          alt={escrow.clientName}
                          className="w-7 h-7 rounded-full bg-slate-50 border border-[#E4E8F0]"
                        />
                        <div>
                          <h5 className="text-[10px] uppercase tracking-wider text-slate-400">Client</h5>
                          <p className="text-xs font-semibold text-slate-700">{escrow.clientName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-teal-50 text-teal-650 text-xs font-bold px-2 py-1 rounded-lg border border-teal-200">
                        <Sparkles size={11} />
                        <span>{escrow.amountLocked} XLM</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#0F1117] group-hover:text-teal-600 transition-colors duration-200">
                        {escrow.jobTitle}
                      </h4>
                    </div>

                    {/* Deadline & Countdown */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar size={13} className={isUrgent ? 'text-red-500' : ''} />
                      <span className={isUrgent ? 'text-red-500 font-semibold' : ''}>
                        Deadline: {format(deadlineDate, 'MMMM dd, yyyy')} ({countdown})
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-[#E4E8F0]">
                    <button
                      onClick={() => alert(`Accepted escrow ${escrow.id}`)}
                      className="flex-1 text-center py-2 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 transition-colors duration-150 active:scale-95 cursor-pointer"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => alert(`Viewing details for ${escrow.id}`)}
                      className="flex-1 text-center py-2 rounded-lg text-xs font-bold text-slate-750 hover:text-[#0F1117] bg-transparent border border-[#E4E8F0] hover:bg-[#F8F9FB] transition-all duration-150 active:scale-95 cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3 - MY GIGS PERFORMANCE */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-[#0F1117]">My Gigs Performance</h3>
        <div className="rounded-xl border border-[#E4E8F0] bg-white overflow-hidden">
          {gigsLoading ? (
            <div className="p-6 space-y-3 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/4"></div>
              <div className="h-3 bg-slate-100 rounded w-full"></div>
              <div className="h-3 bg-slate-100 rounded w-5/6"></div>
            </div>
          ) : !gigs || gigs.length === 0 ? (
            <div className="p-6 text-center text-[#9CA3AF] text-sm">No gigs found.</div>
          ) : (
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E4E8F0] bg-[#F8F9FB]/50">
                  <th className="p-4 text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Gig Title</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Views This Week</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Orders</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E8F0]">
                {gigs.map((gig) => (
                  <tr key={gig.id} className="hover:bg-[#F8F9FB] transition-colors">
                    <td className="p-4 font-medium text-slate-700">{gig.title}</td>
                    <td className="p-4">{renderViewsBar(gig.viewsThisWeek)}</td>
                    <td className="p-4 font-mono font-semibold text-slate-800">{gig.ordersReceived}</td>
                    <td className="p-4">{renderStars(gig.rating)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION 4 - TWO COLUMN ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-6">
          <ActivityFeed activities={freelancerActivities} isLoading={activitiesLoading} />
        </div>
        <div className="lg:col-span-4 flex flex-col gap-6">
          <QuickActions role="FREELANCER" />
          <MessagesPreview messages={messages} isLoading={messagesLoading} />
        </div>
      </div>
    </div>
  );
};
export default FreelancerDashboard;
