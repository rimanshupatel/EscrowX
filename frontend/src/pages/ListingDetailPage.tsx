import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Clock, MessageSquare, ArrowRight, ArrowLeft, CheckCircle2, ShieldAlert, X, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { listingService, chatService, proposalService, hireRequestService, escrowService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useEscrowContract } from '../hooks/useEscrowContract';
import { sorobanClient } from '../lib/soroban';

// Contact Info sharing check helper
const hasContactInfo = (text: string): boolean => {
  if (!text) return false;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
  const phoneRegex = /(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;
  const consecutiveDigitsRegex = /\b\d{8,15}\b/;
  const contactKeywordsRegex = /(whatsapp|telegram|discord|t\.me|wa\.me|discord\.gg|calendly|skype|zoom)/i;

  return emailRegex.test(text) || 
         phoneRegex.test(text) || 
         consecutiveDigitsRegex.test(text) || 
         contactKeywordsRegex.test(text);
};

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, walletAddress } = useAuthStore();
  const { markInProgress } = useEscrowContract();
  
  const [listing, setListing] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Proposal lists for owners
  const [applications, setApplications] = useState<any[]>([]);
  const [hireRequests, setHireRequests] = useState<any[]>([]);

  // Modals state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [hireModalOpen, setHireModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Apply form fields
  const [coverLetter, setCoverLetter] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [expectedDeliveryTime, setExpectedDeliveryTime] = useState(7);
  const [bidAmount, setBidAmount] = useState(100);
  const [previousExperience, setPreviousExperience] = useState('');

  // Hire request form fields
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [deadline, setDeadline] = useState('');
  const [budgetAmount, setBudgetAmount] = useState(100);

  const fetchDetails = async () => {
    try {
      if (!id) return;
      const data = await listingService.getListing(id);
      setListing(data);
      
      // If own listing, fetch proposals/hire requests
      const creator = data.createdBy;
      const isOwn = creator?._id === currentUser?.id || creator?.id === currentUser?.id;
      
      if (isOwn) {
        if (data.type === 'PROJECT') {
          const allProposals = await proposalService.getReceivedProposals();
          const apps = allProposals.filter((p: any) => (p.projectId?._id || p.projectId) === data._id);
          setApplications(apps);
        } else if (data.type === 'SERVICE') {
          const reqs = await hireRequestService.getMyHireRequests();
          const filtered = reqs.filter((r: any) => r.listing?._id === data._id || r.listing === data._id);
          setHireRequests(filtered);
        }
      }
    } catch (err: any) {
      console.error('Error loading listing details:', err);
      setError(err.response?.data?.error || 'Listing not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, currentUser]);

  const handleChatNow = async () => {
    if (!listing || !currentUser) return;
    setActionLoading(true);
    try {
      const sellerId = listing.createdBy?._id || listing.createdBy?.id;
      if (sellerId === currentUser.id) {
        alert("You cannot start a conversation with yourself!");
        return;
      }
      
      const conv = await chatService.getOrCreateConversation(sellerId, listing._id);
      navigate(`/chat?conversationId=${conv._id || conv.id}`);
    } catch (err) {
      console.error('Error starting conversation:', err);
      alert('Failed to start chat session');
    } finally {
      setActionLoading(false);
    }
  };

  // Freelancer submits application to project listing
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Scan for contact details
    if (hasContactInfo(coverLetter) || hasContactInfo(portfolioUrl) || hasContactInfo(previousExperience)) {
      setValidationError("External communication is not allowed. Please remove phone numbers, email addresses, or messaging links (WhatsApp, Telegram, Discord).");
      return;
    }

    setSubmitLoading(true);
    try {
      await proposalService.applyToProject(listing._id, {
        coverLetter,
        portfolio: portfolioUrl,
        expectedDelivery: expectedDeliveryTime,
        bidAmount,
        experienceNotes: previousExperience
      });
      alert('Application submitted successfully!');
      setApplyModalOpen(false);
      // Reset form
      setCoverLetter('');
      setPortfolioUrl('');
      setPreviousExperience('');
    } catch (err: any) {
      setValidationError(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Client submits hire request to freelancer service listing
  const handleHireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Scan for contact details
    if (hasContactInfo(projectTitle) || hasContactInfo(projectDescription) || hasContactInfo(requirements)) {
      setValidationError("External communication is not allowed. Please remove phone numbers, email addresses, or messaging links (WhatsApp, Telegram, Discord).");
      return;
    }

    if (!deadline) {
      setValidationError("Deadline is required");
      return;
    }

    setSubmitLoading(true);
    try {
      await hireRequestService.createHireRequest({
        listingId: listing._id,
        projectTitle,
        projectDescription,
        requirements,
        deadline,
        budgetAmount
      });
      alert('Hire request sent successfully!');
      setHireModalOpen(false);
      // Reset form
      setProjectTitle('');
      setProjectDescription('');
      setRequirements('');
      setDeadline('');
    } catch (err: any) {
      setValidationError(err.response?.data?.error || 'Failed to submit hire request');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReviewApplication = async (appId: string, status: 'ACCEPTED' | 'REJECTED') => {
    if (!listing) return;
    setActionLoading(true);
    try {
      if (status === 'ACCEPTED') {
        const app = applications.find(a => a._id === appId);
        if (!app) {
          alert('Application not found');
          setActionLoading(false);
          return;
        }

        // Fetch ProjectEscrow
        const projectEscrow = await escrowService.getProjectEscrowByListing(listing._id);
        const escrowId = projectEscrow.escrowId;

        // Always verify state on-chain before executing transaction
        const onChainEscrow = await sorobanClient.getEscrow(escrowId);
        if (onChainEscrow.status !== 'FUNDED') {
          alert(`On-chain escrow status must be FUNDED. Current status: ${onChainEscrow.status}`);
          setActionLoading(false);
          return;
        }

        const activeWallet = walletAddress || currentUser?.walletAddress;
        if (!activeWallet) {
          alert('Please connect your Freighter wallet first.');
          setActionLoading(false);
          return;
        }

        const res = await markInProgress(escrowId, activeWallet, app.freelancerId?.walletAddress || '', projectEscrow._id);
        if (!res.success) {
          alert(res.error || 'Failed to execute markInProgress on-chain.');
          setActionLoading(false);
          return;
        }

        await proposalService.acceptProposal(appId, { txHash: res.txHash });
      } else {
        await proposalService.rejectProposal(appId);
      }
      alert(`Proposal ${status.toLowerCase()} successfully!`);
      // Reload applications list
      const allProposals = await proposalService.getReceivedProposals();
      const apps = allProposals.filter((p: any) => (p.projectId?._id || p.projectId) === listing._id);
      setApplications(apps);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to review proposal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespondHireRequest = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    if (!listing) return;
    try {
      await hireRequestService.respondToHireRequest(requestId, status);
      alert(`Hire request ${status.toLowerCase()} successfully!`);
      // Reload requests
      const reqs = await hireRequestService.getMyHireRequests();
      const filtered = reqs.filter((r: any) => r.listing?._id === listing._id || r.listing === listing._id);
      setHireRequests(filtered);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update hire request');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7C3AED]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !listing) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto text-center py-12 bg-white border border-[#E4E8F0] rounded-xl shadow-sm space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-sm font-bold text-[#0F172A]">Error Loading Listing</h3>
          <p className="text-xs text-[#64748B]">{error || 'Something went wrong.'}</p>
          <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-xs text-[#7C3AED] font-bold hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Marketplace
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const creator = listing.createdBy;
  const isOwnListing = creator?._id === currentUser?.id || creator?.id === currentUser?.id;
  const displayPrice = listing.type === 'SERVICE' ? listing.price : listing.budget;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Link */}
        <div>
          <Link to="/marketplace" className="inline-flex items-center gap-1 text-xs text-[#64748B] hover:text-[#0F172A] transition-colors font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Marketplace
          </Link>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Seller Info (span 3) */}
          <div className="lg:col-span-3 bg-white border border-[#E4E8F0] rounded-xl p-5 shadow-sm space-y-5">
            <div className="text-center space-y-3">
              <Link to={`/u/${creator?.username || ''}`} className="relative inline-block hover:opacity-85 transition-opacity">
                <img
                  src={creator?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator?.name || 'User'}`}
                  alt={creator?.name}
                  className="w-16 h-16 rounded-full mx-auto border-2 border-slate-50 shadow-sm"
                />
                <span className="absolute bottom-0 right-1 w-3.5 h-3.5 bg-[#10B981] border-2 border-white rounded-full"></span>
              </Link>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] hover:text-[#7C3AED] transition-colors">
                  <Link to={`/u/${creator?.username || ''}`}>{creator?.name}</Link>
                </h3>
                <p className="text-[10px] text-[#64748B] font-medium uppercase mt-0.5">{creator?.role}</p>
              </div>
            </div>

            <div className="border-t border-[#F1F5F9] pt-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#64748B]">Reputation:</span>
                <span className="font-semibold text-amber-500 flex items-center gap-0.5">
                  ★ {creator?.trustScore ? (creator.trustScore / 20).toFixed(1) : '4.5'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#64748B]">Trust Score:</span>
                <span className="font-bold text-[#0F172A]">{creator?.trustScore || 85}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#64748B]">Badge Level:</span>
                <span className="font-bold text-[#7C3AED] bg-[#F5F3FF] px-2 py-0.5 rounded text-[10px]">
                  {creator?.badge || 'Bronze'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#64748B]">Wallet Address:</span>
                <span className="font-mono text-[10px] text-gray-500 truncate max-w-[120px] select-all" title={creator?.walletAddress}>
                  {creator?.walletAddress ? `${creator.walletAddress.slice(0, 6)}...${creator.walletAddress.slice(-4)}` : '—'}
                </span>
              </div>
            </div>

            {/* Seller Badges */}
            <div className="bg-[#FAFAFA] border border-[#E4E8F0] rounded-lg p-3 space-y-2 text-[10px] text-[#64748B]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Identity & Wallet Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Escrow Trust Rating: High</span>
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: Main Content (span 6) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Header / Media Card */}
            <div className="bg-white border border-[#E4E8F0] rounded-xl overflow-hidden shadow-sm">
              <div className="h-60 bg-slate-50 relative">
                <img
                  src={listing.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    listing.type === 'SERVICE' ? 'bg-emerald-500 text-white' : 'bg-purple-600 text-white'
                  }`}>
                    {listing.type === 'SERVICE' ? 'Freelance Service / Gig' : 'Client Requirement / Project'}
                  </span>
                  <span className="text-[10px] text-[#64748B] font-semibold font-mono uppercase">
                    Status: {listing.status}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">{listing.title}</h1>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white border border-[#E4E8F0] rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">About This Listing</h3>
              <p className="text-xs text-[#334155] leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Owner proposal review tables */}
            {isOwnListing && listing.type === 'PROJECT' && (
              <div className="bg-white border border-[#E4E8F0] rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Applications Received</h3>
                {applications.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] italic">No applications received yet.</p>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app) => (
                      <div key={app._id} className="p-4.5 border border-[#E2E8F0] rounded-xl space-y-3 bg-[#FAFAFA]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Link to={`/u/${app.freelancerUsername}`} className="hover:opacity-85 transition-opacity">
                              <img
                                src={app.freelancerId?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.freelancerUsername}`}
                                alt=""
                                className="w-6 h-6 rounded-full border border-slate-100 object-cover"
                              />
                            </Link>
                            <div>
                              <span className="text-xs font-bold text-[#0F172A] hover:text-[#7C3AED] transition-colors">
                                <Link to={`/u/${app.freelancerUsername}`}>{app.freelancerId?.name || app.freelancerUsername}</Link>
                              </span>
                              <span className="text-[10px] text-amber-500 ml-1.5">★ {app.freelancerId?.trustScore ? (app.freelancerId.trustScore / 20).toFixed(1) : '4.5'}</span>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-extrabold text-[#7C3AED]">{app.bidAmount} XLM</span>
                        </div>
                        <p className="text-xs text-[#334155] whitespace-pre-wrap"><strong className="text-slate-500 font-extrabold uppercase text-[9px] tracking-wide block mb-1">Cover Letter</strong> {app.coverLetter}</p>
                        {app.portfolio && <p className="text-xs text-blue-600 font-semibold"><strong className="text-slate-500 font-extrabold uppercase text-[9px] tracking-wide">Portfolio: </strong> <a href={app.portfolio} target="_blank" rel="noreferrer" className="underline">{app.portfolio}</a></p>}
                        {app.experienceNotes && <p className="text-xs text-[#334155]"><strong className="text-slate-500 font-extrabold uppercase text-[9px] tracking-wide block mb-1">Previous Experience</strong> {app.experienceNotes}</p>}
                        
                        <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5 text-[10px] text-slate-400">
                          <span>Delivery time: {app.expectedDelivery} Days</span>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                            app.status === 'ACCEPTED' ? 'bg-emerald-500 text-white' : app.status === 'REJECTED' ? 'bg-red-500 text-white' : 'bg-amber-100 text-amber-700'
                          }`}>{app.status}</span>
                        </div>
                        
                        {app.status === 'PENDING' && (
                          <div className="flex gap-2 pt-1">
                            <button
                                onClick={() => handleReviewApplication(app._id, 'ACCEPTED')}
                                className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 cursor-pointer"
                              >
                                Accept Proposal
                              </button>
                              <button
                                onClick={() => handleReviewApplication(app._id, 'REJECTED')}
                                className="px-3.5 py-2 rounded-lg border border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 cursor-pointer"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                          {app.status === 'ACCEPTED' && (
                            <button
                              onClick={() => navigate(`/escrow/create?listingId=${listing._id}&amount=${app.bidAmount}&counterpartyAddress=${app.freelancerWallet || ''}&counterpartyId=${app.freelancerId?._id || app.freelancerId?.id || app.freelancerId}&title=${encodeURIComponent(listing.title)}`)}
                              className="w-full py-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              Proceed to Escrow Funding <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isOwnListing && listing.type === 'SERVICE' && (
              <div className="bg-white border border-[#E4E8F0] rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Hire Requests Received</h3>
                {hireRequests.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] italic">No hire requests received yet.</p>
                ) : (
                  <div className="space-y-4">
                    {hireRequests.map((req) => (
                      <div key={req._id} className="p-4.5 border border-[#E2E8F0] rounded-xl space-y-3 bg-[#FAFAFA]">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-[#0F172A]">{req.projectTitle}</span>
                            <p className="text-[10px] text-slate-400 mt-0.5">From Client: {req.client?.name} (★ {req.client?.trustScore ? (req.client.trustScore / 20).toFixed(1) : '4.5'})</p>
                          </div>
                          <span className="text-xs font-mono font-extrabold text-[#7C3AED]">{req.budgetAmount} XLM</span>
                        </div>
                        <p className="text-xs text-[#334155] whitespace-pre-wrap"><strong className="text-slate-500 font-extrabold uppercase text-[9px] tracking-wide block mb-1">Project Info</strong> {req.projectDescription}</p>
                        <p className="text-xs text-[#334155]"><strong className="text-slate-500 font-extrabold uppercase text-[9px] tracking-wide block mb-1">Requirements</strong> {req.requirements}</p>
                        
                        <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5 text-[10px] text-slate-400">
                          <span>Deadline: {new Date(req.deadline).toLocaleDateString()}</span>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                            req.status === 'ACCEPTED' ? 'bg-emerald-500 text-white' : req.status === 'REJECTED' ? 'bg-red-500 text-white' : 'bg-amber-100 text-amber-700'
                          }`}>{req.status}</span>
                        </div>
                        
                        {req.status === 'PENDING' && (
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleRespondHireRequest(req._id, 'ACCEPTED')}
                              className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 cursor-pointer"
                            >
                              Accept Hire Request
                            </button>
                            <button
                              onClick={() => handleRespondHireRequest(req._id, 'REJECTED')}
                              className="px-3 py-2 rounded-lg border border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 cursor-pointer"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                        {req.status === 'ACCEPTED' && (
                          <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-emerald-800 text-[11px] font-bold text-center">
                            You accepted this request. Waiting for the client to deploy and fund the escrow contract.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Skills & Tags Card */}
            <div className="bg-white border border-[#E4E8F0] rounded-xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2.5">Skills Required</h3>
                <div className="flex flex-wrap gap-1.5">
                  {listing.skills && listing.skills.length > 0 ? (
                    listing.skills.map((skill: string) => (
                      <span key={skill} className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-md text-[10px] font-bold text-[#475569] uppercase">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#94A3B8] italic">No specific skills listed.</span>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2.5">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {listing.tags && listing.tags.length > 0 ? (
                    listing.tags.map((tag: string) => (
                      <span key={tag} className="px-2.5 py-1 bg-purple-50 text-[#7C3AED] rounded-md text-[10px] font-medium">
                        #{tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#94A3B8] italic">No tags.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Action Card (span 3) */}
          <div className="lg:col-span-3 space-y-5 lg:sticky lg:top-[88px]">
            <div className="bg-white border border-[#E4E8F0] rounded-xl p-5 shadow-sm space-y-4">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-[#64748B]">
                  {listing.type === 'SERVICE' ? 'Service Rate' : 'Estimated Budget'}
                </p>
                <p className="text-2xl font-extrabold text-[#0F172A] font-mono mt-1">
                  {displayPrice} XLM
                </p>
              </div>

              <div className="border-t border-[#F1F5F9] pt-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#94A3B8]" /> Delivery Time
                  </span>
                  <span className="font-bold text-[#0F172A]">{listing.deliveryDays} Days</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#94A3B8]" /> Escrow EscrowX
                  </span>
                  <span className="font-bold text-emerald-600">Active protection</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                {!isOwnListing ? (
                  <>
                    {listing.type === 'SERVICE' && currentUser?.role === 'CLIENT' && (
                      <button
                        onClick={() => setHireModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#7C3AED] text-white text-xs font-bold hover:bg-[#6D28D9] transition-all cursor-pointer shadow-sm"
                      >
                        Hire Freelancer <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {listing.type === 'PROJECT' && currentUser?.role === 'FREELANCER' && (
                      <button
                        onClick={() => setApplyModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#7C3AED] text-white text-xs font-bold hover:bg-[#6D28D9] transition-all cursor-pointer shadow-sm"
                      >
                        Apply Now <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    
                    <button
                      onClick={handleChatNow}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-[#E4E8F0] bg-white text-[#0F172A] text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {actionLoading ? 'Connecting...' : 'Chat Now'}
                    </button>
                  </>
                ) : (
                  <div className="bg-slate-50 rounded-lg p-3 text-[11px] text-[#64748B] text-center border border-dashed border-[#E2E8F0]">
                    This is your own listing. You can manage proposals and details here.
                  </div>
                )}
              </div>
            </div>

            {/* Stellar Safety Note */}
            <div className="bg-[#FAF9FF] border border-[#7C3AED]/10 rounded-xl p-4 text-[10px] text-[#64748B] space-y-1.5">
              <h4 className="font-bold text-[#7C3AED] uppercase tracking-wider">How EscrowX Works</h4>
              <p className="leading-relaxed">
                EscrowX acts as a trusted decentralized arbiter. Funds are locked in a Stellar smart contract draft and are only released when milestoned updates are fully completed and client-approved.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL 1: APPLY NOW (FREELANCER TO PROJECT) */}
      <AnimatePresence>
        {applyModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-4.5 border-b border-[#F1F5F9] flex items-center justify-between">
                <h2 className="text-sm font-black text-[#0F172A] uppercase tracking-wider">Submit Project Proposal</h2>
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleApplySubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {validationError && (
                  <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs flex items-start gap-2 leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}

                <div className="bg-[#FAF9FF] border border-[#7C3AED]/10 rounded-xl p-3.5 text-[11px] text-slate-500 leading-relaxed">
                  <span className="font-bold text-[#7C3AED] uppercase block mb-1">⚠️ Platform Policy Warning</span>
                  Sharing contact info (Telegram, WhatsApp, email, Skype, Zoom, or phone numbers) is strictly blocked to prevent fee circumvention and ensure Stellar escrow protection.
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Bid Amount (XLM)</label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs bg-[#FAFAFA]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Expected Delivery (Days)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={expectedDeliveryTime}
                      onChange={(e) => setExpectedDeliveryTime(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs bg-[#FAFAFA]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Portfolio URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://github.com/yourprofile or portfolio site"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs bg-[#FAFAFA]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Cover Letter</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Detail your solution, technical stack, and how you plan to complete this project..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs bg-[#FAFAFA] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Previous Experience (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Summarize similar Stellar smart contracts, Web3 projects, or apps you have built..."
                    value={previousExperience}
                    onChange={(e) => setPreviousExperience(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs bg-[#FAFAFA] resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="w-full py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {submitLoading ? 'Submitting proposal...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: HIRE FREELANCER (CLIENT TO SERVICE) */}
      <AnimatePresence>
        {hireModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-4.5 border-b border-[#F1F5F9] flex items-center justify-between">
                <h2 className="text-sm font-black text-[#0F172A] uppercase tracking-wider">Send Hire / Escrow Request</h2>
                <button
                  type="button"
                  onClick={() => setHireModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleHireSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {validationError && (
                  <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs flex items-start gap-2 leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}

                <div className="bg-[#FAF9FF] border border-[#7C3AED]/10 rounded-xl p-3.5 text-[11px] text-slate-500 leading-relaxed">
                  <span className="font-bold text-[#7C3AED] uppercase block mb-1">⚠️ Platform Policy Warning</span>
                  Do not provide external contact handles or links. Communication must remain on EscrowX to maintain escrow transaction protection.
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Project Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Build API connector for Stellar Soroban"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs bg-[#FAFAFA]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Budget Amount (XLM)</label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs bg-[#FAFAFA]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Target Deadline</label>
                    <input
                      type="date"
                      required
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs bg-[#FAFAFA] font-medium text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Project Description</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Detail the project goals, requirements, and deliverables..."
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs bg-[#FAFAFA] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Specific Requirements / Deliverables</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="List the criteria to evaluate completion (e.g. Unit tests, GitHub PR approval, IPFS metadata upload)..."
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs bg-[#FAFAFA] resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="w-full py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {submitLoading ? 'Sending request...' : 'Send Hire Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
