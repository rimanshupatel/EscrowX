import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Copy, ExternalLink, CheckCircle, XCircle, Lock, Clock,
  ChevronDown, ChevronUp, Shield, Calendar, Globe, Star
} from 'lucide-react';
import { AppLayout } from '../../../components/layout/AppLayout';
import { useAuthStore } from '../../../store/authStore';
import { escrowService, disputeService, reviewService } from '../../../services/api';

const TIMELINE_STEPS = [
  { key: 'CREATED', label: 'Created' },
  { key: 'FUNDED', label: 'Funded' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'COMPLETED', label: 'Complete' },
];

const STATUS_ORDER = ['CREATED', 'FUNDED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED'];

export default function EscrowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();

  // Auth Guard redirect
  useEffect(() => {
    if (!token || !user) {
      navigate('/auth/login');
    }
  }, [token, user, navigate]);

  const [copiedId, setCopiedId] = useState(false);
  const [txOpen, setTxOpen] = useState<string | null>(null);

  // API states
  const [escrow, setEscrow] = useState<any>(null);
  const [delivery, setDelivery] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Delivery form states
  const [ipfsHash, setIpfsHash] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  // Dispute form state
  const [disputeReason, setDisputeReason] = useState('');
  const [raisingDispute, setRaisingDispute] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Load escrow details
  const loadDetails = async () => {
    if (!id) return;
    try {
      const data = await escrowService.getEscrow(id);
      setEscrow(data.escrow);
      setDelivery(data.delivery);
      setTransactions(data.transactions);
      try {
        const reviewsData = await reviewService.getEscrowReviews(id);
        setReviews(reviewsData);
      } catch (revErr) {
        console.error('Error fetching reviews:', revErr);
      }
    } catch (err) {
      console.error('Error fetching escrow details:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  if (loading) {
    return (
      <AppLayout title="Loading Escrow Details...">
        <div className="py-20 text-center text-xs text-gray-400">Loading details from Stellar ledger...</div>
      </AppLayout>
    );
  }

  if (!escrow) {
    return (
      <AppLayout title="Escrow Not Found">
        <div className="py-20 text-center">
          <p className="text-xs text-gray-400">Escrow detail record could not be loaded.</p>
          <Link to="/dashboard" className="text-xs text-[#7C3AED] underline mt-3 inline-block">Back to Dashboard</Link>
        </div>
      </AppLayout>
    );
  }

  const isClient = user?.id === escrow.client?._id;
  const isFreelancer = user?.id === escrow.freelancer?._id;

  const currentStatusIndex = STATUS_ORDER.indexOf(
    ['DISPUTED', 'REFUNDED'].includes(escrow.status) ? 'FUNDED' : escrow.status
  );

  const handleCopyId = async () => {
    navigator.clipboard.writeText(escrow.contractId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  // Client funds contract on-chain
  const handleFund = async () => {
    try {
      const txHash = 'mock_stellar_deposit_tx_hash_' + Math.random().toString(36).slice(2);
      await escrowService.fundEscrow(escrow._id, txHash);
      alert('Vault successfully funded on-chain!');
      loadDetails();
    } catch (err) {
      alert('Funding transaction failed');
    }
  };

  // Freelancer submits deliverables
  const handleDeliver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipfsHash || !deliveryNotes) return;
    setSubmittingDelivery(true);
    try {
      await escrowService.submitDelivery(escrow._id, {
        ipfsHash,
        githubLink,
        notes: deliveryNotes
      });
      alert('Milestone deliverable submitted successfully!');
      loadDetails();
    } catch (err) {
      alert('Failed to submit deliverable');
    }
    setSubmittingDelivery(false);
  };

  // Client approves and releases payment
  const handleApprove = async () => {
    try {
      const txHash = 'mock_stellar_payment_release_tx_hash_' + Math.random().toString(36).slice(2);
      await escrowService.approveEscrow(escrow._id, txHash);
      alert('Payment released! Smart contract completed.');
      loadDetails();
    } catch (err) {
      alert('Failed to release payment');
    }
  };

  // Raise dispute
  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason) return;
    setRaisingDispute(true);
    try {
      await disputeService.raiseDispute({
        escrowId: escrow._id,
        reason: disputeReason,
        evidenceContent: 'Initial dispute submission.'
      });
      alert('Dispute raised. Arbitrator notified.');
      loadDetails();
    } catch (err) {
      alert('Dispute creation failed');
    }
    setRaisingDispute(false);
  };

  // Submit review
  const handleLeaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment) return;
    setSubmittingReview(true);
    try {
      await reviewService.submitReview({
        escrowId: escrow._id,
        rating: reviewRating,
        comment: reviewComment
      });
      alert('Review submitted successfully! Reputation metrics updated.');
      setReviewComment('');
      setReviewRating(5);
      loadDetails();
    } catch (err) {
      alert('Failed to submit review');
    }
    setSubmittingReview(false);
  };

  return (
    <AppLayout title="Escrow Detail">
      <div className="space-y-5 max-w-5xl mx-auto">
        {/* Back link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header summary info */}
        <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-gray-400">Contract ID: {escrow.contractId}</span>
              <button onClick={handleCopyId} className="p-1 rounded hover:bg-gray-100 transition-colors">
                <Copy className="w-3.5 h-3.5 text-gray-400" />
              </button>
              {copiedId && <span className="text-[10px] text-green-500 font-bold">Copied!</span>}
            </div>
            <h2 className="text-base font-bold text-[#0F172A]">{escrow.job?.title}</h2>
            <div className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase bg-[#7C3AED]/10 text-[#7C3AED]">
              {escrow.status}
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-xl font-bold text-[#0F172A]">{escrow.amount} {escrow.tokenType}</p>
            <p className="text-[10px] text-gray-400 mt-1">Stellar network lockup</p>
          </div>
        </div>

        {/* Main page content grid */}
        <div className="grid md:grid-cols-[1fr_300px] gap-6">
          {/* Left panel */}
          <div className="space-y-6">
            
            {/* Timeline */}
            <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm">
              <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-6">Contract Status Stepper</h4>
              <div className="flex items-center justify-between">
                {TIMELINE_STEPS.map((step, idx) => {
                  const isDone = idx <= currentStatusIndex;
                  const isLast = idx === TIMELINE_STEPS.length - 1;
                  return (
                    <div key={step.key} className="flex-1 flex items-center last:flex-none">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold ${
                          isDone ? 'bg-[#7C3AED] border-[#7C3AED] text-white' : 'bg-white border-[#E5E7EB] text-gray-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-2">{step.label}</span>
                      </div>
                      {!isLast && (
                        <div className={`flex-1 h-0.5 mx-2 mb-4 ${idx < currentStatusIndex ? 'bg-[#7C3AED]' : 'bg-[#E5E7EB]'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions Board based on state */}
            {escrow.status === 'CREATED' && isClient && (
              <div className="bg-[#7C3AED]/5 border border-[#7C3AED]/20 rounded-[24px] p-6 text-center space-y-4">
                <h4 className="text-xs font-bold text-[#0F172A]">Fund Escrow Vault</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Deploy and fund this contract with {escrow.amount} {escrow.tokenType} on the Stellar Ledger using Freighter.
                </p>
                <button
                  onClick={handleFund}
                  className="px-6 py-3 rounded-[12px] bg-[#7C3AED] text-white text-xs font-bold hover:bg-[#6D28D9] transition-all shadow-sm"
                >
                  Fund Contract Now
                </button>
              </div>
            )}

            {escrow.status === 'FUNDED' && isFreelancer && (
              <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-[#0F172A]">Submit Milestone Deliverable</h4>
                <form onSubmit={handleDeliver} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">IPFS Artifact Hash</label>
                    <input
                      type="text"
                      placeholder="QmX7zB...5h2"
                      value={ipfsHash}
                      onChange={(e) => setIpfsHash(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-[8px] text-xs bg-white text-[#0F172A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">GitHub Repository Link (Optional)</label>
                    <input
                      type="text"
                      placeholder="https://github.com/user/repo"
                      value={githubLink}
                      onChange={(e) => setGithubLink(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-[8px] text-xs bg-white text-[#0F172A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Submission Notes</label>
                    <textarea
                      placeholder="Explain features and validation criteria..."
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-[8px] text-xs bg-white text-[#0F172A] resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingDelivery}
                    className="w-full py-2.5 rounded-[12px] bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold"
                  >
                    {submittingDelivery ? 'Uploading artifacts...' : 'Submit Deliverables'}
                  </button>
                </form>
              </div>
            )}

            {escrow.status === 'DELIVERED' && isClient && (
              <div className="bg-white border border-green-200 rounded-[24px] p-6 shadow-sm space-y-4 bg-green-50/20">
                <h4 className="text-xs font-bold text-[#0F172A]">Verify Deliverables</h4>
                {delivery && (
                  <div className="border border-[#E5E7EB] rounded-[12px] p-4 bg-white space-y-2">
                    <p className="text-xs text-gray-600 font-semibold">{delivery.notes}</p>
                    <div className="flex flex-wrap gap-3 text-[10px] text-gray-400">
                      <span className="font-mono">IPFS: {delivery.ipfsHash}</span>
                      {delivery.githubLink && <a href={delivery.githubLink} target="_blank" rel="noreferrer" className="underline text-blue-500">GitHub Link</a>}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={handleApprove}
                    className="flex-1 py-2.5 rounded-[12px] bg-[#10B981] text-white text-xs font-bold hover:bg-[#059669]"
                  >
                    Approve Work & Release Payment
                  </button>
                </div>
              </div>
            )}

            {/* Raise Dispute (available for client/freelancer when funded/delivered) */}
            {['FUNDED', 'DELIVERED'].includes(escrow.status) && (isClient || isFreelancer) && (
              <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-[#0F172A] text-red-500">Raise Dispute Case</h4>
                <p className="text-[11px] text-gray-400">If contract terms are violated, raise a dispute to hold funds for arbitration.</p>
                <form onSubmit={handleRaiseDispute} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Dispute reason..."
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    required
                    className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-[8px] text-xs bg-white text-[#0F172A]"
                  />
                  <button
                    type="submit"
                    disabled={raisingDispute}
                    className="px-4 py-2 rounded-[8px] bg-red-500 hover:bg-red-600 text-white text-xs font-bold"
                  >
                    {raisingDispute ? 'Disputing...' : 'Raise Dispute'}
                  </button>
                </form>
              </div>
            )}

            {/* Reviews Section (When COMPLETED or REFUNDED) */}
            {(escrow.status === 'COMPLETED' || escrow.status === 'REFUNDED') && (
              <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Marketplace Feedback & Reviews</h4>
                
                {/* Submitted reviews list */}
                {reviews.length > 0 && (
                  <div className="space-y-3">
                    {reviews.map((r: any) => (
                      <div key={r._id} className="border border-[#E5E7EB] rounded-[12px] p-4 bg-[#F9FAFB] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0F172A]">{r.reviewer?.username || 'User'}</span>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 italic">"{r.comment}"</p>
                        <p className="text-[9px] font-mono text-gray-400">Reviewer address: {r.reviewer?.walletAddress}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Submit new review form */}
                {(isClient || isFreelancer) && !reviews.some((r: any) => r.reviewer?._id === user?.id || r.reviewer === user?.id) && (
                  <form onSubmit={handleLeaveReview} className="space-y-4 border-t border-[#E5E7EB] pt-4">
                    <h5 className="text-xs font-bold text-gray-600">Rate your experience with the counterparty:</h5>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-gray-500">Rating:</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setReviewRating(star)}
                            className="p-0.5 rounded hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Feedback Comment</label>
                      <textarea
                        placeholder="Share details of your collaboration..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        required
                        rows={2}
                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-[8px] text-xs bg-white text-[#0F172A] resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-4 py-2 rounded-[8px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-colors"
                    >
                      {submittingReview ? 'Submitting Review...' : 'Submit Review'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Transaction Logs */}
            <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm">
              <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-4">Transaction History</h4>
              {transactions.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No transactions loaded.</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map(tx => (
                    <div key={tx._id} className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-xs font-bold uppercase text-[#7C3AED]">{tx.type}</p>
                        <p className="font-mono text-[9px] text-gray-400 mt-0.5">{tx.txHash}</p>
                      </div>
                      <span className="text-xs font-bold text-gray-500">{new Date(tx.timestamp).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            
            {/* Parties Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Parties involved</h4>
              
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Client</p>
                  <p className="text-xs font-bold text-[#0F172A]">{escrow.client?.username || 'Buyer'}</p>
                  <p className="font-mono text-[9px] text-gray-400 truncate">{escrow.client?.walletAddress}</p>
                </div>
                
                <div className="border-t border-[#E5E7EB] pt-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Freelancer</p>
                  <p className="text-xs font-bold text-[#0F172A]">{escrow.freelancer?.username || 'Provider'}</p>
                  <p className="font-mono text-[9px] text-gray-400 truncate">{escrow.freelancer?.walletAddress}</p>
                </div>

                <div className="border-t border-[#E5E7EB] pt-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Arbitrator</p>
                  <p className="text-xs font-bold text-[#0F172A]">{escrow.arbitrator?.username || 'Community Arbiter'}</p>
                  <p className="font-mono text-[9px] text-gray-400 truncate">{escrow.arbitrator?.walletAddress}</p>
                </div>
              </div>
            </div>

            {/* Deadline Countdown */}
            <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Contract Deadline</h4>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{new Date(escrow.deadline).toLocaleDateString()}</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-[10px]">
                <p className="text-[10px] font-bold text-amber-700">
                  Due in {Math.max(0, Math.ceil((new Date(escrow.deadline).getTime() - Date.now()) / 86400000))} days
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
