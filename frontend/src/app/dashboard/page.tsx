import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle, Briefcase, Shield, CreditCard, Star, Settings as SettingsIcon,
  Edit3, Trash2, CheckCircle, XCircle, Search, Filter, ChevronLeft, ChevronRight,
  Eye, AlertTriangle, TrendingUp, Lock, DollarSign, Award, Users
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../hooks/useSocket';
import { jobService, escrowService, disputeService, reviewService } from '../../services/api';

interface DashboardPageProps {
  tab?: 'overview' | 'jobs' | 'escrows' | 'payments' | 'reviews' | 'settings' | 'disputes' | 'applications';
}

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-500',
  open: 'bg-emerald-50 text-emerald-600',
  in_progress: 'bg-blue-50 text-blue-600',
  completed: 'bg-purple-50 text-purple-600',
  CREATED: 'bg-gray-100 text-gray-500',
  FUNDED: 'bg-blue-50 text-blue-600',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-600',
  DELIVERED: 'bg-amber-50 text-amber-600',
  UNDER_REVIEW: 'bg-orange-50 text-orange-600',
  DISPUTED: 'bg-red-50 text-red-600',
  COMPLETED: 'bg-emerald-50 text-emerald-600',
  REFUNDED: 'bg-gray-100 text-gray-500',
};

export default function DashboardPage({ tab: initialTab = 'overview' }: DashboardPageProps) {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  useSocket();

  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab when route changes via prop
  useEffect(() => { setActiveTab(initialTab); }, [initialTab]);

  // Data
  const [jobs, setJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [escrows, setEscrows] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search / filter / pagination for browse jobs (freelancer)
  const [search, setSearch] = useState('');
  const [filterToken, setFilterToken] = useState('');
  const [filterMinBudget, setFilterMinBudget] = useState('');
  const [filterMaxBudget, setFilterMaxBudget] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searching, setSearching] = useState(false);

  // Job CRUD state
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobBudget, setJobBudget] = useState(100);
  const [jobToken, setJobToken] = useState<'XLM' | 'USDC'>('XLM');
  const [savingJob, setSavingJob] = useState(false);
  const [deletingJob, setDeletingJob] = useState<string | null>(null);
  const [publishingJob, setPublishingJob] = useState<string | null>(null);

  // Bid state (freelancer)
  const [bidAmounts, setBidAmounts] = useState<Record<string, number>>({});
  const [coverLetters, setCoverLetters] = useState<Record<string, string>>({});
  const [submittingBid, setSubmittingBid] = useState<string | null>(null);

  // Dispute resolution state
  const [clientPayout, setClientPayout] = useState(0);
  const [freelancerPayout, setFreelancerPayout] = useState(0);
  const [arbiterNotes, setArbiterNotes] = useState('');
  const [resolvingDisputeId, setResolvingDisputeId] = useState<string | null>(null);

  // Load all data
  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (user.role === 'CLIENT') {
        const [myJobsData, escrowsData] = await Promise.all([
          jobService.getMyJobs(),
          escrowService.getMyEscrows(),
        ]);
        setMyJobs(myJobsData);
        setEscrows(escrowsData);
      } else if (user.role === 'FREELANCER') {
        const [jobsData, escrowsData] = await Promise.all([
          jobService.getJobs({ page: 1, limit: 10 }),
          escrowService.getMyEscrows(),
        ]);
        setJobs(jobsData.jobs || []);
        setTotalPages(jobsData.pagination?.pages || 1);
        setEscrows(escrowsData);
      } else if (user.role === 'ARBITRATOR' || user.role === 'ADMIN') {
        const [disputesData, escrowsData] = await Promise.all([
          disputeService.getDisputes(),
          escrowService.getMyEscrows(),
        ]);
        setDisputes(disputesData);
        setEscrows(escrowsData);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Search/filter jobs (freelancer)
  const handleSearch = async () => {
    setSearching(true);
    setPage(1);
    try {
      const res = await jobService.getJobs({
        search: search || undefined,
        tokenType: filterToken || undefined,
        minBudget: filterMinBudget ? Number(filterMinBudget) : undefined,
        maxBudget: filterMaxBudget ? Number(filterMaxBudget) : undefined,
        page: 1,
        limit: 10,
      });
      setJobs(res.jobs || []);
      setTotalPages(res.pagination?.pages || 1);
    } catch (err) {
      console.error('Error searching jobs:', err);
    }
    setSearching(false);
  };

  const handlePageChange = async (newPage: number) => {
    setPage(newPage);
    try {
      const res = await jobService.getJobs({
        search: search || undefined,
        tokenType: filterToken || undefined,
        minBudget: filterMinBudget ? Number(filterMinBudget) : undefined,
        maxBudget: filterMaxBudget ? Number(filterMaxBudget) : undefined,
        page: newPage,
        limit: 10,
      });
      setJobs(res.jobs || []);
      setTotalPages(res.pagination?.pages || 1);
    } catch (err) {
      console.error('Error paginating jobs:', err);
    }
  };

  // Create/edit job
  const openNewJobForm = () => {
    setEditingJob(null);
    setJobTitle('');
    setJobDesc('');
    setJobBudget(100);
    setJobToken('XLM');
    setShowJobForm(true);
  };

  const openEditJobForm = (job: any) => {
    setEditingJob(job);
    setJobTitle(job.title);
    setJobDesc(job.description);
    setJobBudget(job.budget);
    setJobToken(job.tokenType);
    setShowJobForm(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingJob(true);
    try {
      if (editingJob) {
        await jobService.updateJob(editingJob._id, { title: jobTitle, description: jobDesc, budget: jobBudget, tokenType: jobToken });
      } else {
        await jobService.createJob({ title: jobTitle, description: jobDesc, budget: jobBudget, tokenType: jobToken });
      }
      setShowJobForm(false);
      const data = await jobService.getMyJobs();
      setMyJobs(data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save job');
    }
    setSavingJob(false);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Delete this job and all its applications?')) return;
    setDeletingJob(jobId);
    try {
      await jobService.deleteJob(jobId);
      setMyJobs(prev => prev.filter(j => j._id !== jobId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete job');
    }
    setDeletingJob(null);
  };

  const handlePublishJob = async (jobId: string) => {
    setPublishingJob(jobId);
    try {
      await jobService.publishJob(jobId);
      const data = await jobService.getMyJobs();
      setMyJobs(data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to publish job');
    }
    setPublishingJob(null);
  };

  // Apply to job (freelancer)
  const handleApply = async (jobId: string) => {
    const bid = bidAmounts[jobId] || 50;
    const letter = coverLetters[jobId] || '';
    if (!letter) { alert('Cover letter is required'); return; }
    setSubmittingBid(jobId);
    try {
      await jobService.applyToJob(jobId, bid, letter);
      alert('Application submitted successfully!');
      setCoverLetters(prev => ({ ...prev, [jobId]: '' }));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit application');
    }
    setSubmittingBid(null);
  };

  // Resolve dispute (arbitrator)
  const handleResolveDispute = async (disputeId: string, totalAmount: number) => {
    if (clientPayout + freelancerPayout !== totalAmount) {
      alert(`Split payouts must equal total escrow: ${totalAmount} XLM`);
      return;
    }
    setResolvingDisputeId(disputeId);
    try {
      await disputeService.resolveDispute(disputeId, {
        clientPayout,
        freelancerPayout,
        arbitratorNotes: arbiterNotes,
        resolution: `Split: Client ${clientPayout} XLM, Freelancer ${freelancerPayout} XLM.`,
        txHash: 'mock_arbitration_tx_' + Date.now(),
      });
      const data = await disputeService.getDisputes();
      setDisputes(data);
    } catch (err) {
      alert('Dispute resolution failed');
    }
    setResolvingDisputeId(null);
  };

  if (!user) return null;

  const tabTitle: Record<string, string> = {
    overview: `${user.role} Dashboard`,
    jobs: user.role === 'FREELANCER' ? 'Browse Jobs' : 'My Jobs',
    escrows: user.role === 'FREELANCER' ? 'My Contracts' : 'My Escrows',
    payments: user.role === 'FREELANCER' ? 'Earnings' : 'Payments',
    reviews: user.role === 'FREELANCER' ? 'Reputation' : 'Reviews',
    settings: 'Settings',
    disputes: 'Resolve Disputes',
  };

  return (
    <AppLayout title={tabTitle[activeTab] || 'Dashboard'}>
      <div className="space-y-6">

        {/* ============ OVERVIEW TAB ============ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Client Overview */}
            {user.role === 'CLIENT' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { label: 'Active Escrows', value: escrows.filter(e => !['COMPLETED','REFUNDED'].includes(e.status)).length, icon: Shield, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Completed', value: escrows.filter(e => e.status === 'COMPLETED').length, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Funds Locked (XLM)', value: escrows.reduce((s,e) => !['COMPLETED','REFUNDED'].includes(e.status) ? s + e.amount : s, 0).toLocaleString(), icon: Lock, color: 'text-purple-600 bg-purple-50' },
                    { label: 'Pending Review', value: escrows.filter(e => e.status === 'DELIVERED').length, icon: Eye, color: 'text-amber-600 bg-amber-50' },
                  ].map(stat => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-sm">
                      <div className={`w-9 h-9 rounded-[8px] ${stat.color} flex items-center justify-center mb-3`}>
                        <stat.icon className="w-4 h-4" />
                      </div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">{stat.label}</p>
                      <p className="text-xl font-bold text-[#0F172A] mt-1">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Quick Actions</h3>
                    <Link to="/jobs" className="text-xs text-[#5B6BF8] font-semibold hover:underline">Manage Jobs →</Link>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link to="/jobs" className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#5B6BF8] text-white text-xs font-bold hover:bg-[#4757E8] transition-all">
                      <Briefcase className="w-3.5 h-3.5" /> Post a Job
                    </Link>
                    <Link to="/escrow/new" className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#0F172A] text-white text-xs font-bold hover:bg-[#1E293B] transition-all">
                      <PlusCircle className="w-3.5 h-3.5" /> Create Escrow
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Freelancer Overview */}
            {user.role === 'FREELANCER' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { label: 'Earnings (XLM)', value: escrows.reduce((s,e) => e.status === 'COMPLETED' ? s + e.amount : s, 0).toLocaleString(), icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Active Contracts', value: escrows.filter(e => !['COMPLETED','REFUNDED'].includes(e.status)).length, icon: Shield, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Trust Score', value: `${user.trustScore}/100`, icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
                    { label: 'Badge', value: user.badge, icon: Award, color: 'text-amber-600 bg-amber-50' },
                  ].map(stat => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-sm">
                      <div className={`w-9 h-9 rounded-[8px] ${stat.color} flex items-center justify-center mb-3`}>
                        <stat.icon className="w-4 h-4" />
                      </div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">{stat.label}</p>
                      <p className="text-xl font-bold text-[#0F172A] mt-1">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Work Orders</h3>
                    <Link to="/jobs" className="text-xs text-[#5B6BF8] font-semibold hover:underline">Browse Jobs →</Link>
                  </div>
                  {escrows.filter(e => ['FUNDED','IN_PROGRESS'].includes(e.status)).length === 0
                    ? <p className="text-xs text-gray-400 italic">No active work orders. Browse open jobs to apply.</p>
                    : escrows.filter(e => ['FUNDED','IN_PROGRESS'].includes(e.status)).map(e => (
                        <div key={e._id} className="flex items-center justify-between border border-[#E5E7EB] rounded-[12px] p-4 bg-[#FAFAFA] mb-3">
                          <div>
                            <p className="text-xs font-bold text-[#0F172A]">{e.job?.title || 'Milestone Task'}</p>
                            <p className="text-[10px] text-gray-400 mt-1">Locked: {e.amount} {e.tokenType}</p>
                          </div>
                          <Link to={`/escrow/${e._id}`} className="px-3.5 py-1.5 rounded-[8px] bg-[#7C3AED] text-white text-xs font-bold hover:bg-[#6D28D9]">Submit Work</Link>
                        </div>
                      ))
                  }
                </div>
              </div>
            )}

            {/* Arbitrator Overview */}
            {(user.role === 'ARBITRATOR' || user.role === 'ADMIN') && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {[
                    { label: 'Open Cases', value: disputes.filter(d => d.status !== 'resolved').length, color: 'text-red-500' },
                    { label: 'Resolved Cases', value: disputes.filter(d => d.status === 'resolved').length, color: 'text-emerald-600' },
                    { label: 'Total Disputes', value: disputes.length, color: 'text-[#0F172A]' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-sm">
                      <p className="text-[10px] uppercase font-bold text-gray-400">{stat.label}</p>
                      <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Disputes Queue</h3>
                  {disputes.filter(d => d.status !== 'resolved').length === 0
                    ? <p className="text-xs text-gray-400 italic">No open dispute cases. Queue is clear.</p>
                    : disputes.filter(d => d.status !== 'resolved').slice(0, 3).map(d => (
                        <div key={d._id} className="flex items-center justify-between border border-[#E5E7EB] rounded-[12px] p-4 bg-[#FAFAFA] mb-3">
                          <div>
                            <p className="text-xs font-bold text-[#0F172A]">{d.escrow?.job?.title || 'Dispute'}</p>
                            <p className="text-[10px] text-gray-400 mt-1">Amount: {d.escrow?.amount} XLM</p>
                          </div>
                          <Link to="/disputes" className="px-3.5 py-1.5 rounded-[8px] bg-[#0F172A] text-white text-xs font-bold hover:bg-[#1E293B]">Resolve</Link>
                        </div>
                      ))
                  }
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ JOBS TAB ============ */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            {/* CLIENT: My Jobs list with CRUD */}
            {user.role === 'CLIENT' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#0F172A]">My Job Postings</h3>
                  <button onClick={openNewJobForm} className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#5B6BF8] text-white text-xs font-bold hover:bg-[#4757E8] transition-all">
                    <PlusCircle className="w-3.5 h-3.5" /> New Job
                  </button>
                </div>

                {/* Job Create/Edit Form */}
                <AnimatePresence>
                  {showJobForm && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-white border border-[#5B6BF8]/30 rounded-[16px] p-6 shadow-md"
                    >
                      <h4 className="text-sm font-bold text-[#0F172A] mb-4">{editingJob ? 'Edit Job' : 'Create New Job'}</h4>
                      <form onSubmit={handleSaveJob} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Project Title</label>
                          <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} required placeholder="UI/UX Design for Stellar App"
                            className="w-full px-3 py-2 border border-[#E5E7EB] rounded-[8px] text-xs focus:outline-none focus:ring-1 focus:ring-[#5B6BF8]" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</label>
                          <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} required rows={3} placeholder="Detailed project requirements..."
                            className="w-full px-3 py-2 border border-[#E5E7EB] rounded-[8px] text-xs focus:outline-none focus:ring-1 focus:ring-[#5B6BF8] resize-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Budget</label>
                            <input type="number" value={jobBudget} onChange={e => setJobBudget(Number(e.target.value))} required
                              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-[8px] text-xs focus:outline-none focus:ring-1 focus:ring-[#5B6BF8]" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Token</label>
                            <select value={jobToken} onChange={e => setJobToken(e.target.value as any)}
                              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-[8px] text-xs focus:outline-none focus:ring-1 focus:ring-[#5B6BF8]">
                              <option value="XLM">XLM</option>
                              <option value="USDC">USDC</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button type="submit" disabled={savingJob}
                            className="flex-1 py-2.5 rounded-[8px] bg-[#5B6BF8] text-white text-xs font-bold hover:bg-[#4757E8] disabled:opacity-40 transition-all">
                            {savingJob ? 'Saving...' : editingJob ? 'Update Job' : 'Save as Draft'}
                          </button>
                          <button type="button" onClick={() => setShowJobForm(false)}
                            className="px-4 py-2.5 rounded-[8px] border border-[#E5E7EB] text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all">
                            Cancel
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Jobs List */}
                {myJobs.length === 0
                  ? (
                    <div className="text-center py-16 bg-white border border-dashed border-[#E5E7EB] rounded-[16px]">
                      <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-gray-400">No jobs yet</p>
                      <p className="text-xs text-gray-400 mt-1">Create your first job posting to attract freelancers.</p>
                      <button onClick={openNewJobForm} className="mt-4 px-4 py-2 rounded-[8px] bg-[#5B6BF8] text-white text-xs font-bold">Post a Job</button>
                    </div>
                  )
                  : (
                    <div className="grid gap-4">
                      {myJobs.map(job => (
                        <motion.div key={job._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_COLOR[job.status]}`}>{job.status}</span>
                                <span className="text-[10px] text-gray-400 font-mono">{job.tokenType}</span>
                              </div>
                              <h4 className="text-sm font-bold text-[#0F172A]">{job.title}</h4>
                              <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{job.description}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold text-[#0F172A]">{job.budget} {job.tokenType}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#E5E7EB]">
                            {job.status === 'draft' && (
                              <button onClick={() => handlePublishJob(job._id)} disabled={publishingJob === job._id}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-40 transition-all">
                                <CheckCircle className="w-3 h-3" />
                                {publishingJob === job._id ? 'Publishing...' : 'Publish'}
                              </button>
                            )}
                            {['draft', 'open'].includes(job.status) && (
                              <>
                                <button onClick={() => openEditJobForm(job)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#E5E7EB] text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all">
                                  <Edit3 className="w-3 h-3" /> Edit
                                </button>
                                <button onClick={() => handleDeleteJob(job._id)} disabled={deletingJob === job._id}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-red-200 text-xs font-bold text-red-500 hover:bg-red-50 disabled:opacity-40 transition-all">
                                  <Trash2 className="w-3 h-3" />
                                  {deletingJob === job._id ? 'Deleting...' : 'Delete'}
                                </button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )
                }
              </div>
            )}

            {/* FREELANCER: Browse Jobs with search, filter, pagination */}
            {user.role === 'FREELANCER' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#0F172A]">Browse Open Projects</h3>

                {/* Search & Filters */}
                <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-4 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2 relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="Search jobs by title or description..."
                        className="w-full pl-9 pr-3 py-2 border border-[#E5E7EB] rounded-[8px] text-xs focus:outline-none focus:ring-1 focus:ring-[#5B6BF8]" />
                    </div>
                    <select value={filterToken} onChange={e => setFilterToken(e.target.value)}
                      className="px-3 py-2 border border-[#E5E7EB] rounded-[8px] text-xs focus:outline-none focus:ring-1 focus:ring-[#5B6BF8]">
                      <option value="">All Tokens</option>
                      <option value="XLM">XLM</option>
                      <option value="USDC">USDC</option>
                    </select>
                    <div className="flex gap-2">
                      <input type="number" value={filterMinBudget} onChange={e => setFilterMinBudget(e.target.value)} placeholder="Min budget"
                        className="flex-1 px-2 py-2 border border-[#E5E7EB] rounded-[8px] text-xs focus:outline-none focus:ring-1 focus:ring-[#5B6BF8]" />
                      <input type="number" value={filterMaxBudget} onChange={e => setFilterMaxBudget(e.target.value)} placeholder="Max"
                        className="flex-1 px-2 py-2 border border-[#E5E7EB] rounded-[8px] text-xs focus:outline-none focus:ring-1 focus:ring-[#5B6BF8]" />
                    </div>
                  </div>
                  <button onClick={handleSearch} disabled={searching}
                    className="mt-3 flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#5B6BF8] text-white text-xs font-bold hover:bg-[#4757E8] disabled:opacity-40 transition-all">
                    <Filter className="w-3.5 h-3.5" />
                    {searching ? 'Searching...' : 'Apply Filters'}
                  </button>
                </div>

                {/* Job Cards */}
                {jobs.length === 0
                  ? (
                    <div className="text-center py-16 bg-white border border-dashed border-[#E5E7EB] rounded-[16px]">
                      <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-gray-400">No jobs match your criteria</p>
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters.</p>
                    </div>
                  )
                  : (
                    <div className="grid gap-4">
                      {jobs.map(job => (
                        <div key={job._id} className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 shadow-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-bold text-[#0F172A]">{job.title}</h4>
                              <p className="text-[11px] text-gray-400 mt-1">Client: {job.client?.username} · Trust: {job.client?.trustScore}%</p>
                            </div>
                            <span className="text-xs font-bold text-[#5B6BF8] bg-[#5B6BF8]/10 px-3 py-1 rounded-full">{job.budget} {job.tokenType}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-3 leading-relaxed">{job.description}</p>
                          <div className="border-t border-[#E5E7EB] pt-4 mt-4">
                            <div className="flex items-end gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Your Bid</label>
                                <input type="number" value={bidAmounts[job._id] || 50}
                                  onChange={e => setBidAmounts(prev => ({ ...prev, [job._id]: Number(e.target.value) }))}
                                  className="w-24 px-2 py-1.5 border border-[#E5E7EB] rounded-[6px] text-xs focus:outline-none" />
                              </div>
                              <div className="flex-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cover Letter</label>
                                <input type="text" value={coverLetters[job._id] || ''}
                                  onChange={e => setCoverLetters(prev => ({ ...prev, [job._id]: e.target.value }))}
                                  placeholder="Briefly describe your approach..."
                                  className="w-full px-3 py-1.5 border border-[#E5E7EB] rounded-[6px] text-xs focus:outline-none" />
                              </div>
                              <button onClick={() => handleApply(job._id)} disabled={submittingBid === job._id}
                                className="px-4 py-2 rounded-[8px] bg-[#5B6BF8] text-white text-xs font-bold hover:bg-[#4757E8] disabled:opacity-40 transition-all whitespace-nowrap">
                                {submittingBid === job._id ? 'Applying...' : 'Apply Now'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button onClick={() => handlePageChange(page - 1)} disabled={page <= 1}
                      className="p-2 rounded-[8px] border border-[#E5E7EB] text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-all">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-gray-600">Page {page} of {totalPages}</span>
                    <button onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages}
                      className="p-2 rounded-[8px] border border-[#E5E7EB] text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============ ESCROWS TAB ============ */}
        {activeTab === 'escrows' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A]">{user.role === 'FREELANCER' ? 'My Active Contracts' : 'My Escrow Contracts'}</h3>
            {escrows.length === 0
              ? (
                <div className="text-center py-16 bg-white border border-dashed border-[#E5E7EB] rounded-[16px]">
                  <Shield className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-400">No escrow contracts yet</p>
                  {user.role === 'CLIENT' && <Link to="/escrow/new" className="mt-4 inline-block px-4 py-2 rounded-[8px] bg-[#5B6BF8] text-white text-xs font-bold">Create Escrow</Link>}
                </div>
              )
              : (
                <div className="grid gap-3">
                  {escrows.map(e => (
                    <div key={e._id} className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-sm flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_COLOR[e.status]}`}>{e.status}</span>
                        </div>
                        <h4 className="text-xs font-bold text-[#0F172A]">{e.job?.title || 'Stellar Contract'}</h4>
                        <p className="text-[10px] font-mono text-gray-400 mt-0.5 truncate max-w-[200px]">{e.contractId}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-xs font-bold text-[#0F172A]">{e.amount} {e.tokenType}</span>
                        <Link to={`/escrow/${e._id}`} className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#E5E7EB] text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all">
                          Manage →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* ============ PAYMENTS TAB ============ */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A]">{user.role === 'FREELANCER' ? 'Earnings History' : 'Payment History'}</h3>
            {escrows.length === 0
              ? (
                <div className="text-center py-16 bg-white border border-dashed border-[#E5E7EB] rounded-[16px]">
                  <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-400">No payment history yet</p>
                </div>
              )
              : (
                <div className="bg-white border border-[#E5E7EB] rounded-[16px] shadow-sm overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-[#F8F9FB] border-b border-[#E5E7EB]">
                      <tr>
                        <th className="text-left px-5 py-3 text-[10px] font-bold uppercase text-gray-400 tracking-wider">Project</th>
                        <th className="text-left px-5 py-3 text-[10px] font-bold uppercase text-gray-400 tracking-wider">Status</th>
                        <th className="text-left px-5 py-3 text-[10px] font-bold uppercase text-gray-400 tracking-wider">Amount</th>
                        <th className="text-left px-5 py-3 text-[10px] font-bold uppercase text-gray-400 tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {escrows.map(e => (
                        <tr key={e._id} className="hover:bg-[#FAFAFA] transition-colors">
                          <td className="px-5 py-3.5 font-semibold text-[#0F172A]">{e.job?.title || 'Contract'}</td>
                          <td className="px-5 py-3.5">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_COLOR[e.status]}`}>{e.status}</span>
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold">{e.amount} {e.tokenType}</td>
                          <td className="px-5 py-3.5">
                            <Link to={`/escrow/${e._id}`} className="text-[#5B6BF8] font-bold hover:underline">View →</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>
        )}

        {/* ============ REVIEWS TAB ============ */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-gray-400">Trust Score</p>
                <p className="text-3xl font-bold text-[#0F172A] mt-1">{user.trustScore}<span className="text-sm text-gray-400">/100</span></p>
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-gray-400">Badge Level</p>
                <p className="text-xl font-bold mt-1">
                  {user.badge === 'Platinum' && <span className="text-[#E5E4E2]">⬡</span>}
                  {user.badge === 'Gold' && <span className="text-amber-400">⬡</span>}
                  {user.badge === 'Silver' && <span className="text-gray-400">⬡</span>}
                  {user.badge === 'Bronze' && <span className="text-orange-700">⬡</span>}
                  <span className="ml-1 text-[#0F172A]">{user.badge}</span>
                </p>
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-gray-400">Completed Jobs</p>
                <p className="text-3xl font-bold text-[#0F172A] mt-1">{escrows.filter(e => e.status === 'COMPLETED').length}</p>
              </div>
            </div>
            {reviews.length === 0
              ? (
                <div className="text-center py-16 bg-white border border-dashed border-[#E5E7EB] rounded-[16px]">
                  <Star className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-400">No reviews yet</p>
                  <p className="text-xs text-gray-400 mt-1">Reviews will appear after completed escrow contracts.</p>
                </div>
              ) : null
            }
          </div>
        )}

        {/* ============ SETTINGS TAB ============ */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-xl">
            <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#0F172A] mb-4">Account Information</h3>
              <div className="space-y-3">
                {[
                  { label: 'Username', value: user.username || '—' },
                  { label: 'Email', value: user.email || '—' },
                  { label: 'Role', value: user.role },
                  { label: 'Wallet Address', value: user.walletAddress, mono: true },
                ].map(f => (
                  <div key={f.label} className="flex items-center justify-between py-2 border-b border-[#E5E7EB] last:border-0">
                    <span className="text-[10px] uppercase font-bold text-gray-400">{f.label}</span>
                    <span className={`text-xs font-semibold text-[#0F172A] ${f.mono ? 'font-mono text-[10px]' : ''} max-w-[220px] truncate`}>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#0F172A] mb-2">Notification Preferences</h3>
              <p className="text-xs text-gray-400">Real-time Socket.IO notifications are always enabled for escrow events and messages.</p>
            </div>
          </div>
        )}

        {/* ============ DISPUTES TAB (Arbitrator/Admin) ============ */}
        {activeTab === 'disputes' && (user.role === 'ARBITRATOR' || user.role === 'ADMIN') && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-[#0F172A]">Open Dispute Cases</h3>
            {disputes.filter(d => d.status !== 'resolved').length === 0
              ? (
                <div className="text-center py-16 bg-white border border-dashed border-[#E5E7EB] rounded-[16px]">
                  <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-400">No open disputes</p>
                </div>
              )
              : disputes.filter(d => d.status !== 'resolved').map(d => (
                <div key={d._id} className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 shadow-sm grid md:grid-cols-[1fr_280px] gap-6">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#0F172A]">{d.escrow?.job?.title || 'Dispute'}</h4>
                    <p className="text-[10px] text-gray-400">Raised by: {d.raisedBy?.username} · Reason: {d.reason}</p>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Evidence</p>
                      {d.evidence?.map((ev: any, idx: number) => (
                        <div key={idx} className="border border-[#E5E7EB] rounded-[8px] p-3 text-xs bg-[#FAFAFA]">
                          <p className="font-semibold text-gray-600">{ev.type?.toUpperCase()}: {ev.content}</p>
                          {ev.url && <a href={ev.url} target="_blank" rel="noreferrer" className="text-blue-500 underline mt-1 block">View Resource</a>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-l border-[#E5E7EB] pl-6 space-y-4">
                    <h4 className="text-xs font-bold text-[#0F172A]">Settlement Split</h4>
                    <p className="text-[10px] text-gray-400">Total locked: {d.escrow?.amount} XLM</p>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">To Client (XLM)</label>
                        <input type="number" value={clientPayout} onChange={e => setClientPayout(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded-[6px] text-xs" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">To Freelancer (XLM)</label>
                        <input type="number" value={freelancerPayout} onChange={e => setFreelancerPayout(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded-[6px] text-xs" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Decision Notes</label>
                        <input type="text" value={arbiterNotes} onChange={e => setArbiterNotes(e.target.value)} placeholder="Reason for split..."
                          className="w-full px-2.5 py-1.5 border border-[#E5E7EB] rounded-[6px] text-xs" />
                      </div>
                    </div>
                    <button onClick={() => handleResolveDispute(d._id, d.escrow?.amount)} disabled={resolvingDisputeId === d._id}
                      className="w-full py-2.5 rounded-[8px] bg-[#10B981] text-white text-xs font-bold hover:bg-[#059669] disabled:opacity-40 transition-all">
                      {resolvingDisputeId === d._id ? 'Executing...' : 'Execute Payout Split'}
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

      </div>
    </AppLayout>
  );
}
