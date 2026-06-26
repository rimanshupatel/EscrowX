import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowRight, Check, X, User } from 'lucide-react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { proposalService, escrowService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useEscrowContract } from '../hooks/useEscrowContract';
import { sorobanClient } from '../lib/soroban';

export default function ClientHireRequestsPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user: currentUser, walletAddress } = useAuthStore();
  const { markInProgress } = useEscrowContract();

  const fetchReceivedProposals = async () => {
    try {
      const data = await proposalService.getReceivedProposals();
      setProposals(data);
    } catch (err) {
      console.error('Error fetching received proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivedProposals();
  }, []);

  const handleReview = async (proposalId: string, status: 'accept' | 'reject') => {
    if (!window.confirm(`Are you sure you want to ${status} this proposal?`)) return;
    try {
      if (status === 'accept') {
        const proposal = proposals.find(p => p._id === proposalId);
        if (!proposal) {
          alert('Proposal not found');
          return;
        }

        const listingId = proposal.projectId?._id || proposal.projectId;
        if (!listingId) {
          alert('Listing not found for this proposal');
          return;
        }

        // Fetch ProjectEscrow
        const projectEscrow = await escrowService.getProjectEscrowByListing(listingId);
        const escrowId = projectEscrow.escrowId;

        // Verify on-chain state before transaction
        const onChainEscrow = await sorobanClient.getEscrow(escrowId);
        if (onChainEscrow.status !== 'FUNDED') {
          alert(`On-chain escrow status must be FUNDED. Current status: ${onChainEscrow.status}`);
          return;
        }

        const activeWallet = walletAddress || currentUser?.walletAddress;
        if (!activeWallet) {
          alert('Please connect your Freighter wallet first.');
          return;
        }

        const res = await markInProgress(escrowId, activeWallet, proposal.freelancerId?.walletAddress || '', projectEscrow._id);
        if (!res.success) {
          alert(res.error || 'Failed to execute markInProgress on-chain.');
          return;
        }

        await proposalService.acceptProposal(proposalId, { txHash: res.txHash });
        alert('Proposal accepted and contract marked in progress successfully!');
        fetchReceivedProposals();
      } else {
        await proposalService.rejectProposal(proposalId);
        alert('Proposal rejected successfully.');
        fetchReceivedProposals();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to update proposal status');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-black text-[#0F172A] tracking-tight">Hire Requests / Incoming Proposals</h1>
          <p className="text-xs text-[#64748B] mt-0.5">Review and accept freelancer proposals submitted to your active projects.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#7C3AED]"></div>
          </div>
        ) : proposals.length === 0 ? (
          <div className="bg-white border border-[#E4E8F0] rounded-xl p-12 text-center max-w-xl mx-auto shadow-2xs space-y-3">
            <ClipboardList className="w-10 h-10 text-[#94A3B8] mx-auto" />
            <h3 className="text-xs font-bold text-[#0F172A]">No Proposals Received</h3>
            <p className="text-xs text-[#64748B]">No freelancers have applied to your project listings yet.</p>
            <Link to="/client/listings" className="inline-block mt-2 px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-xs">
              Manage My Listings
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-[#E4E8F0] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#E4E8F0] text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="px-6 py-4">Freelancer</th>
                    <th className="px-6 py-4">Project Listing</th>
                    <th className="px-6 py-4">Bid Amount</th>
                    <th className="px-6 py-4">Delivery</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date Applied</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-xs text-[#334155]">
                  {proposals.map((prop) => (
                    <tr key={prop._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <Link to={`/u/${prop.freelancerUsername}`} className="hover:opacity-80 transition-opacity">
                            <img
                              src={prop.freelancerId?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${prop.freelancerUsername}`}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover border"
                            />
                          </Link>
                          <div>
                            <span className="font-bold text-[#0F172A] block hover:text-[#7C3AED] transition-colors">
                              <Link to={`/u/${prop.freelancerUsername}`}>{prop.freelancerId?.name || prop.freelancerUsername}</Link>
                            </span>
                            <span className="font-mono text-[9px] text-gray-400 select-all" title={prop.freelancerWallet}>
                              {prop.freelancerWallet.slice(0, 6)}...{prop.freelancerWallet.slice(-4)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700">
                        <Link to={`/listing/${prop.projectId?._id || prop.projectId}`} className="hover:text-[#7C3AED] transition-colors line-clamp-1">
                          {prop.projectId?.title || 'Project'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-800">{prop.bidAmount} XLM</td>
                      <td className="px-6 py-4 font-semibold text-slate-600">{prop.expectedDelivery} Days</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                          prop.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          prop.status === 'REJECTED' ? 'bg-red-50 text-red-600 border border-red-100' :
                          'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {prop.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-400">{new Date(prop.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {prop.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleReview(prop._id, 'accept')}
                                className="p-1.5 rounded-lg border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors cursor-pointer"
                                title="Accept Proposal"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleReview(prop._id, 'reject')}
                                className="p-1.5 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                                title="Reject Proposal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <Link
                            to={`/u/${prop.freelancerUsername}`}
                            className="p-1.5 rounded-lg border border-[#E4E8F0] hover:bg-slate-100 text-[#475569] transition-colors"
                            title="View Profile"
                          >
                            <User className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
