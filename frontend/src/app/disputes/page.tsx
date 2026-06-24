'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, MessageSquare, FileText, Link2, PlusCircle, AlertCircle, Scale, Star } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { truncateAddress, formatDate, timeAgo } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { disputeService } from '@/services/api';

type DisputeTab = 'active' | 'resolved' | 'arbitration';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  under_review: { label: 'Under Review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  escalated: { label: 'Escalated', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

const EVIDENCE_ICONS = {
  text: MessageSquare,
  file: FileText,
  link: Link2,
};

export default function DisputesPage() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<DisputeTab>('active');
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);

  // Auth Guard redirect
  useEffect(() => {
    if (!token || !user) {
      navigate('/auth/login');
    }
  }, [token, user, navigate]);
  
  // API states
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Evidence Form States
  const [evidenceType, setEvidenceType] = useState<'text' | 'link'>('text');
  const [evidenceContent, setEvidenceContent] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [submittingEvidence, setSubmittingEvidence] = useState(false);

  // Resolution Form States
  const [clientPayout, setClientPayout] = useState(0);
  const [freelancerPayout, setFreelancerPayout] = useState(0);
  const [arbiterNotes, setArbiterNotes] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [resolvingDispute, setResolvingDispute] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const data = await disputeService.getDisputes();
      setDisputes(data);
      // Refresh details panel if it's currently open
      if (selectedDispute) {
        const updated = data.find((d: any) => d._id === selectedDispute._id);
        if (updated) {
          setSelectedDispute(updated);
        }
      }
    } catch (err) {
      console.error('Error fetching disputes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisputes();
  }, []);

  // Initialize payout sizes when drawer is opened
  useEffect(() => {
    if (selectedDispute) {
      const amount = selectedDispute.escrow?.amount || 0;
      setClientPayout(Math.floor(amount / 2));
      setFreelancerPayout(amount - Math.floor(amount / 2));
      setArbiterNotes('');
      setResolutionText('');
      setShowResolveForm(false);
    }
  }, [selectedDispute]);

  const handlePostEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceContent || !selectedDispute) return;
    setSubmittingEvidence(true);
    try {
      await disputeService.submitEvidence(selectedDispute._id, {
        type: evidenceType,
        content: evidenceContent,
        url: evidenceType === 'link' ? evidenceUrl : undefined
      });
      alert('Evidence submitted successfully!');
      setEvidenceContent('');
      setEvidenceUrl('');
      
      // Reload details and list
      const data = await disputeService.getDisputes();
      setDisputes(data);
      const updated = data.find((d: any) => d._id === selectedDispute._id);
      if (updated) {
        setSelectedDispute(updated);
      }
    } catch (err) {
      alert('Failed to submit evidence');
    } finally {
      setSubmittingEvidence(false);
    }
  };

  const handleResolveDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;
    const totalAmount = selectedDispute.escrow?.amount || 0;
    if (clientPayout + freelancerPayout !== totalAmount) {
      alert(`Split payout sum (${clientPayout + freelancerPayout}) must equal total escrow vault size (${totalAmount})`);
      return;
    }

    setResolvingDispute(true);
    try {
      const txHash = 'mock_stellar_dispute_resolution_' + Math.random().toString(36).slice(2);
      await disputeService.resolveDispute(selectedDispute._id, {
        clientPayout,
        freelancerPayout,
        arbitratorNotes: arbiterNotes,
        resolution: resolutionText || `Dispute settled. Client: ${clientPayout} XLM. Freelancer: ${freelancerPayout} XLM.`,
        txHash
      });
      alert('Dispute resolved and funds split on Stellar ledger!');
      setShowResolveForm(false);
      loadDisputes();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Resolution failed');
    } finally {
      setResolvingDispute(false);
    }
  };

  const filteredDisputes = disputes.filter((d) => {
    if (activeTab === 'active') return d.status !== 'resolved';
    if (activeTab === 'resolved') return d.status === 'resolved';
    if (activeTab === 'arbitration') return d.status === 'escalated';
    return true;
  });

  return (
    <AppLayout title="Disputes">
      <div className="relative">
        {/* Tab bar */}
        <div className="flex items-center gap-1 bg-[#F8F9FB] rounded-[10px] p-1 mb-6 max-w-fit border border-[#E4E8F0]">
          {(['active', 'resolved', 'arbitration'] as DisputeTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-[8px] text-sm font-semibold capitalize transition-all duration-150 ${
                activeTab === tab
                  ? 'bg-white text-[#5B6BF8] shadow-sm'
                  : 'text-[#9CA3AF] hover:text-[#6B7280]'
              }`}
            >
              {tab === 'active' ? 'Active Disputes' : tab === 'resolved' ? 'Resolved' : 'Arbitration Queue'}
              {tab === 'active' && (
                <span className="ml-2 text-[10px] font-bold bg-red-50 text-red-500 px-1.5 py-0.5 rounded-[4px]">
                  {disputes.filter(d => d.status !== 'resolved').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table + drawer layout */}
        <div className={`transition-all duration-300 ${selectedDispute ? 'xl:pr-[420px]' : ''}`}>
          <motion.div
            className="bg-white rounded-[16px] border border-[#E4E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_32px_rgba(91,107,248,0.08)] overflow-hidden"
          >
            {loading ? (
              <div className="py-20 text-center text-xs text-gray-400">Loading disputes from Stellar ledger...</div>
            ) : filteredDisputes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-[#EEF0FF] flex items-center justify-center mb-4">
                  <span className="text-2xl">⚖️</span>
                </div>
                <p className="text-[#0F1117] font-semibold mb-1">No disputes found</p>
                <p className="text-sm text-[#9CA3AF]">All your escrows are running smoothly</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_120px_180px_140px_120px_100px] gap-4 px-5 py-3 border-b border-[#E4E8F0]">
                  {['Escrow', 'Amount', 'Filed By', 'Date', 'Status', 'Action'].map((col) => (
                    <span key={col} className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                      {col}
                    </span>
                  ))}
                </div>

                {filteredDisputes.map((dispute, i) => {
                  const statusConf = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.under_review;
                  return (
                    <motion.div
                      key={dispute._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedDispute(dispute._id === selectedDispute?._id ? null : dispute)}
                      className={`grid grid-cols-[1fr_120px_180px_140px_120px_100px] gap-4 px-5 py-4 border-b border-[#F2F4F8] hover:bg-[#F8F9FB] cursor-pointer transition-colors ${
                        selectedDispute?._id === dispute._id ? 'bg-[#EEF0FF]/50' : ''
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#0F1117] leading-snug">
                          {dispute.escrow?.job?.title || 'Stellar Escrow Contract'}
                        </p>
                        <p className="text-[11px] font-mono text-[#9CA3AF]">{dispute.escrow?._id}</p>
                      </div>
                      <div className="flex items-center">
                        <span className="font-mono text-sm font-semibold text-[#0F1117]">
                          {dispute.escrow?.amount} {dispute.escrow?.tokenType || 'XLM'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                            {dispute.raisedBy?.role || 'CLIENT'}
                          </p>
                          <p className="font-mono text-xs text-[#6B7280]">
                            {truncateAddress(dispute.raisedBy?.walletAddress || '')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-[#6B7280]">{formatDate(dispute.createdAt, 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-[6px] text-[11px] font-semibold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}>
                          {statusConf.label}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <button className="flex items-center gap-1 text-sm font-semibold text-[#5B6BF8] hover:text-[#4757E8] transition-colors">
                          Review
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Detail drawer */}
        <AnimatePresence>
          {selectedDispute && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed right-0 top-0 h-full w-[420px] bg-white border-l border-[#E4E8F0] shadow-2xl overflow-y-auto z-50"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between p-5 border-b border-[#E4E8F0] sticky top-0 bg-white z-10">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">Dispute Case ID</p>
                  <h2 className="text-[16px] font-bold text-[#0F1117] leading-tight">
                    {selectedDispute.escrow?.job?.title || 'Contract Dispute'}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedDispute(null)}
                  className="p-2 rounded-[8px] hover:bg-[#F2F4F8] transition-colors text-[#9CA3AF]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Status + amount */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-[6px] text-[11px] font-semibold border ${
                    (STATUS_CONFIG[selectedDispute.status] || STATUS_CONFIG.under_review).bg
                  } ${(STATUS_CONFIG[selectedDispute.status] || STATUS_CONFIG.under_review).text} ${
                    (STATUS_CONFIG[selectedDispute.status] || STATUS_CONFIG.under_review).border
                  }`}>
                    {(STATUS_CONFIG[selectedDispute.status] || STATUS_CONFIG.under_review).label}
                  </span>
                  <span className="font-mono text-lg font-bold text-[#0F1117]">
                    {selectedDispute.escrow?.amount} {selectedDispute.escrow?.tokenType || 'XLM'}
                  </span>
                </div>

                {/* Dispute Reason */}
                <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[10px] p-4 space-y-1">
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">Dispute Complaint</h4>
                  <p className="text-xs text-amber-900 leading-relaxed font-semibold">"{selectedDispute.reason}"</p>
                </div>

                {/* Parties */}
                <div className="bg-[#F8F9FB] rounded-[12px] border border-[#E4E8F0] p-4 space-y-3">
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">Parties</h4>
                  {[
                    { label: 'Client (Buyer)', address: selectedDispute.escrow?.client?.walletAddress },
                    { label: 'Freelancer (Provider)', address: selectedDispute.escrow?.freelancer?.walletAddress },
                    { label: 'Arbitrator', address: selectedDispute.escrow?.arbitrator?.walletAddress },
                  ].map(({ label, address }) => (
                    <div key={label}>
                      <p className="text-[10px] font-semibold uppercase text-[#9CA3AF] mb-0.5">{label}</p>
                      <p className="font-mono text-xs text-[#6B7280] break-all">{address || 'No wallet address listed'}</p>
                    </div>
                  ))}
                </div>

                {/* Evidence */}
                <div>
                  <h4 className="text-[13px] font-bold text-[#0F1117] mb-3">Evidence Submitted</h4>
                  {selectedDispute.evidence.length === 0 ? (
                    <p className="text-xs text-gray-400 italic mb-4">No evidence has been uploaded to this case yet.</p>
                  ) : (
                    <div className="space-y-2.5 mb-4">
                      {selectedDispute.evidence.map((ev: any, idx: number) => {
                        const EvidenceIcon = EVIDENCE_ICONS[ev.type as 'text' | 'file' | 'link'] || MessageSquare;
                        return (
                          <div key={idx} className="border border-[#E4E8F0] rounded-[10px] p-3.5 bg-white">
                            <div className="flex items-center gap-2 mb-2">
                              <EvidenceIcon className="w-3.5 h-3.5 text-[#9CA3AF]" />
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                                {ev.type}
                              </span>
                              <span className="ml-auto text-[10px] font-mono text-[#9CA3AF]">{timeAgo(ev.submittedAt)}</span>
                            </div>
                            <p className="text-xs text-[#6B7280] leading-relaxed break-all">{ev.content}</p>
                            {ev.url && (
                              <a href={ev.url} target="_blank" rel="noreferrer" className="text-[10px] text-[#5B6BF8] hover:underline flex items-center gap-1 mt-1">
                                <Link2 className="w-3 h-3" /> View Attachment/Link
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add evidence form */}
                  {selectedDispute.status !== 'resolved' && (
                    <form onSubmit={handlePostEvidence} className="border-t border-[#E4E8F0] pt-4 space-y-3">
                      <h5 className="text-xs font-bold text-[#0F172A]">Submit Additional Evidence</h5>
                      <div className="flex gap-2">
                        {(['text', 'link'] as const).map((t) => (
                          <button
                            type="button"
                            key={t}
                            onClick={() => setEvidenceType(t)}
                            className={`px-3 py-1 rounded-[6px] text-[10px] font-bold capitalize border ${
                              evidenceType === t
                                ? 'bg-[#5B6BF8]/10 text-[#5B6BF8] border-[#5B6BF8]/20'
                                : 'bg-white border-[#E4E8F0] text-gray-400'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      <div>
                        <textarea
                          placeholder={evidenceType === 'link' ? "Describe the linked artifact..." : "Type description or evidence text here..."}
                          value={evidenceContent}
                          onChange={(e) => setEvidenceContent(e.target.value)}
                          required
                          rows={2}
                          className="w-full px-3 py-2 border border-[#E4E8F0] rounded-[8px] text-xs bg-white text-[#0F172A] resize-none"
                        />
                      </div>
                      {evidenceType === 'link' && (
                        <div>
                          <input
                            type="url"
                            placeholder="https://example.com/evidence-link"
                            value={evidenceUrl}
                            onChange={(e) => setEvidenceUrl(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-[#E4E8F0] rounded-[8px] text-xs bg-white text-[#0F172A]"
                          />
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={submittingEvidence}
                        className="w-full py-2 bg-[#0F172A] text-white hover:bg-[#1E293B] text-xs font-bold rounded-[8px] transition-colors"
                      >
                        {submittingEvidence ? 'Uploading...' : 'Submit Evidence File'}
                      </button>
                    </form>
                  )}
                </div>

                {/* Arbiter notes */}
                {selectedDispute.arbitratorNotes && (
                  <div className="bg-[#EEF0FF] border border-[#BCC5FF] rounded-[10px] p-4">
                    <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5B6BF8] mb-2">
                      Arbiter Notes
                    </h4>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{selectedDispute.arbitratorNotes}</p>
                  </div>
                )}

                {/* Resolution */}
                {selectedDispute.resolution && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-[10px] p-4">
                    <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#16A865] mb-2">
                      Resolution Decision
                    </h4>
                    <p className="text-sm text-emerald-700 leading-relaxed font-semibold">{selectedDispute.resolution}</p>
                    {selectedDispute.resolvedAt && (
                      <p className="text-[10px] font-mono text-emerald-600 mt-2">
                        Settled: {formatDate(selectedDispute.resolvedAt, 'PPP')}
                      </p>
                    )}
                  </div>
                )}

                {/* Arbitrator settling operations */}
                {selectedDispute.status !== 'resolved' && user?.role === 'ARBITRATOR' && (
                  <div className="border-t border-[#E4E8F0] pt-4 space-y-4">
                    {!showResolveForm ? (
                      <button
                        onClick={() => setShowResolveForm(true)}
                        className="w-full py-2.5 rounded-[10px] bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Scale className="w-4 h-4" /> Render Arbitration Decision
                      </button>
                    ) : (
                      <form onSubmit={handleResolveDispute} className="space-y-4 bg-gray-50 border border-gray-200 rounded-[12px] p-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-gray-700">Arbitration Payout Split</h4>
                          <button type="button" onClick={() => setShowResolveForm(false)} className="text-[10px] text-gray-400 underline">Cancel</button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Client Payout</label>
                            <input
                              type="number"
                              min="0"
                              max={selectedDispute.escrow?.amount}
                              value={clientPayout}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setClientPayout(val);
                                setFreelancerPayout((selectedDispute.escrow?.amount || 0) - val);
                              }}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-[6px] text-xs bg-white text-[#0F172A]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Freelancer Payout</label>
                            <input
                              type="number"
                              min="0"
                              max={selectedDispute.escrow?.amount}
                              value={freelancerPayout}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setFreelancerPayout(val);
                                setClientPayout((selectedDispute.escrow?.amount || 0) - val);
                              }}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-[6px] text-xs bg-white text-[#0F172A]"
                            />
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-500 font-semibold">
                          Total Escrow Amount: {selectedDispute.escrow?.amount} {selectedDispute.escrow?.tokenType || 'XLM'}
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Arbitrator Decision Summary</label>
                          <textarea
                            placeholder="State key reasons for settlement..."
                            value={resolutionText}
                            onChange={(e) => setResolutionText(e.target.value)}
                            required
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-200 rounded-[6px] text-xs bg-white text-[#0F172A] resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Arbitrator Internal Notes (Optional)</label>
                          <textarea
                            placeholder="Technical analysis, witness reviews, escrow guidelines..."
                            value={arbiterNotes}
                            onChange={(e) => setArbiterNotes(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-200 rounded-[6px] text-xs bg-white text-[#0F172A] resize-none"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={resolvingDispute}
                          className="w-full py-2 bg-[#16A865] hover:bg-emerald-600 text-white text-xs font-bold rounded-[8px] transition-colors"
                        >
                          {resolvingDispute ? 'Transmitting to Stellar...' : 'Confirm Resolution Split'}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
