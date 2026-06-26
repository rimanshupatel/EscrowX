import React, { useState, useEffect, useRef } from 'react';
import { getAddress } from '@stellar/freighter-api';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Clock,
  Send,
  CheckCircle,
  AlertTriangle,
  FileText,
  Lock,
  Unlock,
  Link2,
  ExternalLink,
  Calendar,
  PlusCircle,
  MessageSquare,
  History,
  AlertCircle,
  X,
  Check,
  User
} from 'lucide-react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { deliveryService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useEscrowContract } from '../hooks/useEscrowContract';
import { sorobanClient } from '../lib/soroban';

export default function DeliveryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, walletAddress } = useAuthStore();
  const { markDelivered, approveDelivery, requestRefund, refundEscrow } = useEscrowContract();

  const [delivery, setDelivery] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onChainStatus, setOnChainStatus] = useState<string | null>(null);

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Submit delivery form state
  const [notes, setNotes] = useState('');
  const [demoLink, setDemoLink] = useState('');
  const [vaultFilesInput, setVaultFilesInput] = useState('');
  const [previewFilesInput, setPreviewFilesInput] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Revision form state
  const [revisionReason, setRevisionReason] = useState('');
  const [revisionError, setRevisionError] = useState<string | null>(null);

  // Comment form state
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Active tab inside page
  const [activeTab, setActiveTab] = useState<'deliverables' | 'comments' | 'history'>('deliverables');

  const fetchDeliveryDetails = async () => {
    try {
      if (!id) return;
      const data = await deliveryService.getDelivery(id);
      setDelivery(data);
      if (data.escrowId) {
        try {
          const esc = await sorobanClient.getEscrow(data.escrowId);
          setOnChainStatus(esc.status);
        } catch (e) {
          console.error('Error fetching on-chain escrow status:', e);
          setOnChainStatus('NOT_FOUND');
        }
      }
    } catch (err: any) {
      console.error('Error fetching delivery:', err);
      setError(err.response?.data?.error || 'Failed to load delivery workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryDetails();
  }, [id]);

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setActionLoading(true);

    try {
      const parsedVaultFiles = vaultFilesInput
        .split(',')
        .map(f => f.trim())
        .filter(Boolean);
      const parsedPreviewFiles = previewFilesInput
        .split(',')
        .map(f => f.trim())
        .filter(Boolean);

      if (parsedVaultFiles.length === 0 && parsedPreviewFiles.length === 0) {
        setSubmitError('Please specify at least one preview file or locked vault file.');
        setActionLoading(false);
        return;
      }

      const escrowId = delivery.escrowId;
      if (!escrowId) {
        setSubmitError('No on-chain escrow ID found for this project.');
        setActionLoading(false);
        return;
      }

      let activeWallet = walletAddress || currentUser?.walletAddress;
      try {
        const res = await getAddress();
        if (res) {
          if (typeof res === 'string') {
            activeWallet = res;
            useAuthStore.getState().setWallet(res);
          } else if (typeof res === 'object' && 'address' in res && res.address) {
            activeWallet = res.address;
            useAuthStore.getState().setWallet(res.address);
          }
        }
      } catch (e) {
        console.warn("Could not get address from Freighter directly:", e);
      }

      if (!activeWallet) {
        setSubmitError('Please connect your wallet first.');
        setActionLoading(false);
        return;
      }

      // Always verify state on-chain before executing transaction
      const onChainEscrow = await sorobanClient.getEscrow(escrowId);
      if (onChainEscrow.status !== 'IN_PROGRESS') {
        setSubmitError(`Invalid contract state: ${onChainEscrow.status}. Expected IN_PROGRESS.`);
        setActionLoading(false);
        return;
      }

      if (activeWallet.toLowerCase() !== onChainEscrow.freelancer.toLowerCase()) {
        setSubmitError(`Connected wallet (${activeWallet}) does not match the assigned freelancer's wallet (${onChainEscrow.freelancer}). Please switch to the correct account in Freighter.`);
        setActionLoading(false);
        return;
      }

      // Call markDelivered on contract which also submits deliverables to backend
      const res = await markDelivered(
        escrowId,
        activeWallet,
        id!,
        {
          ipfsHash: parsedVaultFiles[0] || 'mock_ipfs_hash',
          githubLink: demoLink,
          notes,
          previewFiles: parsedPreviewFiles
        },
        true // isProjectDelivery
      );

      if (!res.success) {
        setSubmitError(res.error || 'Failed to submit deliverables to the smart contract.');
        setActionLoading(false);
        return;
      }

      alert('Work submitted successfully on-chain!');
      setUploadModalOpen(false);
      // Reset fields
      setNotes('');
      setDemoLink('');
      setVaultFilesInput('');
      setPreviewFilesInput('');
      fetchDeliveryDetails();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit delivery.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this delivery? This will release locked escrow funds to the freelancer.')) return;
    
    const escrowId = delivery.escrowId;
    if (!escrowId) {
      alert('No on-chain escrow ID found for this project.');
      return;
    }

    let activeWallet = walletAddress || currentUser?.walletAddress;
    try {
      const res = await getAddress();
      if (res) {
        if (typeof res === 'string') {
          activeWallet = res;
          useAuthStore.getState().setWallet(res);
        } else if (typeof res === 'object' && 'address' in res && res.address) {
          activeWallet = res.address;
          useAuthStore.getState().setWallet(res.address);
        }
      }
    } catch (e) {
      console.warn("Could not get address from Freighter directly:", e);
    }

    if (!activeWallet) {
      alert('Please connect your wallet first.');
      return;
    }

    setActionLoading(true);
    try {
      // Always verify state on-chain before executing transaction
      const onChainEscrow = await sorobanClient.getEscrow(escrowId);
      if (onChainEscrow.status !== 'DELIVERED') {
        alert(`Invalid contract state: ${onChainEscrow.status}. Expected DELIVERED.`);
        setActionLoading(false);
        return;
      }

      if (activeWallet.toLowerCase() !== onChainEscrow.client.toLowerCase()) {
        alert(`Connected wallet (${activeWallet}) does not match the client's wallet (${onChainEscrow.client}). Please switch to the correct account in Freighter.`);
        setActionLoading(false);
        return;
      }

      const res = await approveDelivery(
        escrowId,
        activeWallet,
        id!,
        true // isProjectDelivery
      );

      if (res.success) {
        alert('Delivery approved and funds released successfully!');
        fetchDeliveryDetails();
      } else {
        alert(`Failed to approve delivery: ${res.error}`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve delivery.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!window.confirm('Are you sure you want to cancel this milestone and refund the locked funds to your wallet? This action is final.')) return;

    const escrowId = delivery.escrowId;
    if (!escrowId) {
      alert('No on-chain escrow ID found for this project.');
      return;
    }

    // Get the latest address directly from Freighter to handle extension account switching
    let activeWallet = walletAddress || currentUser?.walletAddress;
    try {
      const res = await getAddress();
      if (res) {
        if (typeof res === 'string') {
          activeWallet = res;
          useAuthStore.getState().setWallet(res);
        } else if (typeof res === 'object' && 'address' in res && res.address) {
          activeWallet = res.address;
          useAuthStore.getState().setWallet(res.address);
        }
      }
    } catch (e) {
      console.warn("Could not get address from Freighter directly:", e);
    }

    if (!activeWallet) {
      alert('Please connect your wallet first.');
      return;
    }

    setActionLoading(true);
    try {
      // Always verify state on-chain before executing transaction
      const onChainEscrow = await sorobanClient.getEscrow(escrowId);
      const allowedOnChain = ['FUNDED', 'IN_PROGRESS', 'DELIVERED', 'REVISION_REQUESTED'];
      if (!allowedOnChain.includes(onChainEscrow.status)) {
        alert(`Invalid contract state: ${onChainEscrow.status}. Cannot refund.`);
        setActionLoading(false);
        return;
      }

      if (activeWallet.toLowerCase() !== onChainEscrow.client.toLowerCase()) {
        alert(`Connected wallet (${activeWallet}) does not match the client's wallet (${onChainEscrow.client}). Please switch to the correct account in Freighter.`);
        setActionLoading(false);
        return;
      }

      const res = await refundEscrow(
        escrowId,
        activeWallet,
        id!,
        true // isProjectDelivery
      );

      if (res.success) {
        alert('Milestone cancelled. Funds successfully refunded to your wallet!');
        fetchDeliveryDetails();
      } else {
        alert(`Failed to execute refund: ${res.error}`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to request refund.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionReason.trim()) {
      setRevisionError('Please provide notes detailing what revisions are required.');
      return;
    }

    const escrowId = delivery.escrowId;
    if (!escrowId) {
      setRevisionError('No on-chain escrow ID found for this project.');
      return;
    }

    const activeWallet = walletAddress || currentUser?.walletAddress;
    if (!activeWallet) {
      setRevisionError('Please connect your wallet first.');
      return;
    }

    setRevisionError(null);
    setActionLoading(true);
    try {
      const res = await requestRefund(
        escrowId,
        activeWallet,
        id!,
        revisionReason,
        true // isProjectDelivery
      );

      if (res.success) {
        alert('Revision request submitted successfully.');
        setRevisionModalOpen(false);
        setRevisionReason('');
        fetchDeliveryDetails();
      } else {
        setRevisionError(res.error || 'Failed to submit revision request.');
      }
    } catch (err: any) {
      setRevisionError(err.message || 'Failed to request revisions.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommentLoading(true);
    try {
      await deliveryService.addComment(id!, newComment);
      setNewComment('');
      fetchDeliveryDetails();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to post comment.');
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7C3AED]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !delivery) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto text-center py-12 bg-white border border-[#E4E8F0] rounded-xl shadow-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-sm font-bold text-[#0F172A]">Error Loading Workspace</h3>
          <p className="text-xs text-[#64748B]">{error || 'Workspace could not be found.'}</p>
          <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-xs text-[#7C3AED] font-bold hover:underline">
            Back to Marketplace
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const project = delivery.projectId;
  const freelancer = delivery.freelancerId;
  const client = delivery.clientId;

  const isFreelancer = currentUser?.id === freelancer?._id || currentUser?.id === freelancer?.id;
  const isClient = currentUser?.id === client?._id || currentUser?.id === client?.id;

  // Status badges config
  const statusConfig: any = {
    working: { label: 'Working', style: 'bg-amber-50 text-amber-600 border-amber-200' },
    delivered: { label: 'Delivered', style: 'bg-green-50 text-green-600 border-green-200 animate-pulse' },
    approved: { label: 'Approved', style: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    revision_requested: { label: 'Revision Requested', style: 'bg-rose-50 text-rose-600 border-rose-200' },
    REFUNDED: { label: 'Refunded', style: 'bg-rose-100 text-rose-800 border-rose-300' }
  };
  const activeStatus = statusConfig[delivery.status] || { label: delivery.status, style: 'bg-slate-100 text-slate-500' };
  const hasUploadedDeliveries = delivery.versions && delivery.versions.length > 0;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER HERO PANEL */}
        <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${activeStatus.style}`}>
                {activeStatus.label}
              </span>
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Workspace ID: {delivery._id.slice(-8).toUpperCase()}
              </span>
            </div>
            <h1 className="text-lg font-black tracking-tight">{project?.title || 'Project Deliverables'}</h1>
            <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{project?.description}</p>
          </div>

          <div className="flex flex-col items-end gap-2 text-right">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Milestone Value</p>
            <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 font-mono">
              {project?.budget || '0'} XLM
            </p>
            {project?.deliveryDays && (
              <span className="text-[10px] text-slate-400 font-semibold">Target: {project.deliveryDays} Days limit</span>
            )}
          </div>
        </div>

        {/* 2-COLUMN VIEW WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Main Delivery Workspace (span 8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Tabs selector */}
            <div className="flex border-b border-[#E4E8F0]">
              <button
                onClick={() => setActiveTab('deliverables')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'deliverables' ? 'border-[#7C3AED] text-[#7C3AED]' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Briefcase className="w-4 h-4" /> Deliverables
              </button>
              <button
                onClick={() => {
                  if (isClient && !hasUploadedDeliveries) return;
                  setActiveTab('comments');
                }}
                disabled={isClient && !hasUploadedDeliveries}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 relative ${
                  isClient && !hasUploadedDeliveries
                    ? 'opacity-40 cursor-not-allowed text-slate-300'
                    : 'cursor-pointer text-slate-400 hover:text-slate-600'
                } ${
                  activeTab === 'comments' ? 'border-[#7C3AED] text-[#7C3AED]' : 'border-transparent'
                }`}
              >
                <MessageSquare className="w-4 h-4" /> Feedback Discussion
                {delivery.comments?.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[8px] bg-[#7C3AED] text-white font-bold ml-1">
                    {delivery.comments.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'history' ? 'border-[#7C3AED] text-[#7C3AED]' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <History className="w-4 h-4" /> Version History ({delivery.versions?.length || 0})
              </button>
            </div>

            {/* TAB CONTENT: DELIVERABLES */}
            {activeTab === 'deliverables' && (
              <div className="space-y-6">
                
                {/* Status messages info alert */}
                {delivery.status === 'working' && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs flex gap-2.5 leading-relaxed">
                    <Clock className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                    <div>
                      <strong className="text-slate-800 font-bold block mb-0.5">Project in Progress</strong>
                      The freelancer is currently working on your milestone. Once submitted, client can preview watermarked assets and approve the releases.
                    </div>
                  </div>
                )}

                {delivery.status === 'revision_requested' && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex gap-2.5 leading-relaxed">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                    <div>
                      <strong className="text-rose-800 font-bold block mb-0.5">Revision Requested</strong>
                      Client submitted feedback asking for adjustments:
                      <p className="font-medium text-rose-900 mt-1.5 p-2.5 bg-white border border-rose-100 rounded-lg whitespace-pre-wrap">{delivery.revisionReason}</p>
                    </div>
                  </div>
                )}

                {delivery.status === 'approved' && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs flex gap-2.5 leading-relaxed">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                    <div>
                      <strong className="text-emerald-800 font-bold block mb-0.5">Delivery Accepted & Approved</strong>
                      Escrow funds have been authorized for release. Original final files inside the Delivery Vault are fully decrypted and available to the client below.
                    </div>
                  </div>
                )}

                {delivery.status === 'REFUNDED' && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex gap-2.5 leading-relaxed">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                    <div>
                      <strong className="text-rose-800 font-bold block mb-0.5">Project Cancelled & Refunded</strong>
                      This milestone has been cancelled. Locked escrow funds have been returned to the client's wallet.
                    </div>
                  </div>
                )}

                {/* Main Deliverables Box */}
                {(delivery.status === 'delivered' || delivery.status === 'approved' || delivery.versions?.length > 0) ? (
                  <div className="bg-white border border-[#E4E8F0] rounded-2xl p-6 shadow-sm space-y-6">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Current Work Submission</h3>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-wrap">
                        {delivery.notes || "No submission notes provided."}
                      </p>
                    </div>

                    {delivery.demoLink && (
                      <div className="p-4 bg-[#FAF9FF] border border-[#7C3AED]/10 rounded-xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Link2 className="w-4 h-4 text-[#7C3AED]" />
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Live Demo Link</span>
                            <a href={delivery.demoLink} target="_blank" rel="noreferrer" className="text-xs text-[#7C3AED] font-semibold hover:underline truncate max-w-[300px] block">
                              {delivery.demoLink}
                            </a>
                          </div>
                        </div>
                        <a href={delivery.demoLink} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}

                    {/* VAULT FILE VAULT BOX */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Vault Files (Locked Final Assets)</h4>
                        {delivery.status === 'approved' ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                            <Unlock className="w-3 h-3" /> Unlocked
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Locked until Approved
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {delivery.status === 'approved' ? (
                          // Unlocked view
                          delivery.files?.length > 0 ? (
                            delivery.files.map((file: string, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-3 border border-[#E4E8F0] rounded-xl hover:border-slate-300 transition-colors">
                                <div className="flex items-center gap-2 truncate">
                                  <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                                  <span className="text-xs text-slate-700 font-medium truncate">{file}</span>
                                </div>
                                <a
                                  href={`https://ipfs.io/ipfs/${file}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] font-bold text-[#7C3AED] hover:underline"
                                >
                                  Download
                                </a>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic">No files specified in this submission version.</p>
                          )
                        ) : (
                          // Locked view
                          // Show dummy lock files representing the files freelancer uploaded (which are hidden from Client on controller)
                          isFreelancer && delivery.files?.length > 0 ? (
                            delivery.files.map((file: string, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-3 border border-purple-100 rounded-xl bg-purple-50/20">
                                <div className="flex items-center gap-2 truncate">
                                  <FileText className="w-4 h-4 text-[#7C3AED] shrink-0" />
                                  <span className="text-xs text-slate-700 font-medium truncate">{file}</span>
                                </div>
                                <span className="text-[9px] text-[#7C3AED] font-bold">Uploaded (Locked for Client)</span>
                              </div>
                            ))
                          ) : isClient ? (
                            // Client sees locked vault preview
                            <div className="md:col-span-2 p-6 border border-dashed border-amber-200 bg-amber-50/30 rounded-xl text-center space-y-2">
                              <Lock className="w-6 h-6 text-amber-500 mx-auto" />
                              <h5 className="text-xs font-bold text-amber-800">Final Deliverables Hidden</h5>
                              <p className="text-[10px] text-amber-600 max-w-sm mx-auto leading-relaxed">
                                Original source files, builds, or assets are locked in the Delivery Vault. They will automatically decrypt and unlock once you confirm and accept the work.
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No files submitted yet.</p>
                          )
                        )}
                      </div>
                    </div>

                    {/* PREVIEW FILES VIEW BOX */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Preview Assets (Accessible Anytime)</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {delivery.previewFiles?.length > 0 ? (
                          delivery.previewFiles.map((file: string, idx: number) => {
                            const isImage = file.match(/\.(jpg|jpeg|png|gif|svg)/i);
                            return (
                              <div key={idx} className="border border-[#E4E8F0] rounded-xl overflow-hidden bg-slate-50 flex flex-col justify-between">
                                {isImage ? (
                                  <div className="aspect-video bg-slate-100 relative">
                                    <img src={file} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-xs flex items-center justify-center">
                                      <span className="text-[8px] font-black tracking-widest text-white/50 uppercase select-none rotate-12 scale-120">PREVIEW VAULT</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs text-slate-600 truncate font-semibold">{file}</span>
                                  </div>
                                )}
                                <div className="p-2.5 bg-white border-t border-[#F1F5F9] flex items-center justify-between text-[10px]">
                                  <span className="text-slate-400 truncate max-w-[120px] font-mono">{file}</span>
                                  <a href={file} target="_blank" rel="noreferrer" className="font-bold text-[#7C3AED] hover:underline">
                                    Open Preview
                                  </a>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="md:col-span-2 p-6 border border-dashed border-slate-200 bg-slate-50/50 rounded-xl text-center text-xs text-slate-400 italic">
                            No preview mockups or screenshots uploaded.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-3">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="text-xs font-bold text-[#0F172A]">Oops! No delivery submitted yet.</h4>
                    <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
                      Freelancer has not posted any deliverables for this project yet. They can submit work using the "Deliver Work" panel.
                    </p>
                  </div>
                )}

              </div>
            )}

            {/* TAB CONTENT: DISCUSSION */}
            {activeTab === 'comments' && (
              <div className="bg-white border border-[#E4E8F0] rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Discussion Feed</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Exchange feedback, request updates, and resolve revision details here.</p>
                </div>

                {/* Comment list */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {delivery.comments && delivery.comments.length > 0 ? (
                    delivery.comments.map((comm: any, idx: number) => {
                      const commIsFreelancer = comm.userId === freelancer?._id || comm.userId === freelancer?.id;
                      return (
                        <div key={idx} className={`flex gap-3 items-start ${comm.userId === currentUser?.id ? 'justify-end' : ''}`}>
                          <div className={`flex gap-3 max-w-[80%] ${comm.userId === currentUser?.id ? 'flex-row-reverse' : ''}`}>
                            <div className="w-7 h-7 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-[10px] font-bold uppercase shrink-0">
                              {comm.username.slice(0, 2)}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                <span className="font-bold text-slate-600">{comm.username}</span>
                                <span className="px-1.5 py-0.2 rounded-sm bg-slate-100 text-slate-500 text-[8px] font-semibold">
                                  {commIsFreelancer ? 'Freelancer' : 'Client'}
                                </span>
                                <span>•</span>
                                <span>{new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                comm.userId === currentUser?.id
                                  ? 'bg-[#7C3AED] text-white rounded-tr-none'
                                  : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none'
                              }`}>
                                {comm.message}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-400 italic">No feedback posts submitted. Start the discussion below.</div>
                  )}
                </div>

                {/* Post comment form */}
                {isClient && !hasUploadedDeliveries ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500 font-medium">
                    Posting comments is disabled until freelancer submits work.
                  </div>
                ) : (
                  <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-4 border-t border-slate-100">
                    <input
                      type="text"
                      disabled={isClient && !hasUploadedDeliveries}
                      placeholder={isClient && !hasUploadedDeliveries ? "Comments are disabled..." : "Ask a question or provide delivery feedback..."}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#7C3AED] disabled:bg-slate-50 disabled:text-slate-400"
                    />
                    <button
                      type="submit"
                      disabled={commentLoading || (isClient && !hasUploadedDeliveries)}
                      className="px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" /> Post
                    </button>
                  </form>
                )}

              </div>
            )}

            {/* TAB CONTENT: VERSION HISTORY */}
            {activeTab === 'history' && (
              <div className="bg-white border border-[#E4E8F0] rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Submission History</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Explore older delivery iterations and client revision markers.</p>
                </div>

                {delivery.versions && delivery.versions.length > 0 ? (
                  <div className="space-y-4">
                    {delivery.versions.map((ver: any) => (
                      <div key={ver._id} className="p-4 border border-[#E2E8F0] rounded-xl bg-[#FAFAFA] space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                          <span className="text-xs font-black text-[#7C3AED]">Version #{ver.versionNumber}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {new Date(ver.submittedAt).toLocaleDateString()} at {new Date(ver.submittedAt).toLocaleTimeString()}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Freelancer Delivery Notes</span>
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{ver.notes}</p>
                        </div>

                        {ver.demoLink && (
                          <div className="text-xs flex items-center gap-1.5 text-blue-600">
                            <Link2 className="w-3.5 h-3.5" />
                            <a href={ver.demoLink} target="_blank" rel="noreferrer" className="underline font-semibold">{ver.demoLink}</a>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                          {/* Historical preview files */}
                          {ver.previewFiles?.map((file: string, fIdx: number) => (
                            <div key={fIdx} className="p-2 border border-slate-100 rounded-lg bg-white flex items-center justify-between text-[10px] truncate">
                              <span className="text-slate-500 truncate max-w-[150px]">{file}</span>
                              <a href={file} target="_blank" rel="noreferrer" className="font-bold text-[#7C3AED]">Preview</a>
                            </div>
                          ))}
                          {/* Locked source files in history */}
                          {isFreelancer && ver.files?.map((file: string, fIdx: number) => (
                            <div key={fIdx} className="p-2 border border-purple-50 rounded-lg bg-purple-50/10 flex items-center justify-between text-[10px] truncate">
                              <span className="text-slate-500 truncate max-w-[150px]">{file}</span>
                              <span className="text-[#7C3AED] font-bold">Source Locked</span>
                            </div>
                          ))}
                          {isClient && ver.files?.length > 0 && (
                            <div className="col-span-2 p-2.5 border border-dashed border-amber-100 bg-amber-50/20 text-center rounded-lg text-[9px] text-amber-700 font-medium">
                              🔒 Historical source vault files ({ver.files.length}) locked for client until approval.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-xs text-slate-400 italic">No prior version submissions saved in ledger history.</div>
                )}

              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Action Cards & Info (span 4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Participant info card */}
            <div className="bg-white border border-[#E4E8F0] rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Workspace Participants</h3>
              
              <div className="space-y-3.5">
                {/* Freelancer details */}
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Assigned Freelancer</span>
                  <div className="flex items-center gap-2">
                    <img
                      src={freelancer?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${freelancer?.username}`}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover border border-slate-100 shrink-0"
                    />
                    <div className="truncate">
                      <span className="text-xs font-bold text-[#0F172A] block hover:text-[#7C3AED] transition-colors">
                        <Link to={`/u/${freelancer?.username}`}>{freelancer?.name || freelancer?.username}</Link>
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono select-all truncate block" title={freelancer?.walletAddress}>
                        {freelancer?.walletAddress}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Client details */}
                <div className="pt-3.5 border-t border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Client</span>
                  <div className="flex items-center gap-2">
                    <img
                      src={client?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${client?.username}`}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover border border-slate-100 shrink-0"
                    />
                    <div className="truncate">
                      <span className="text-xs font-bold text-[#0F172A] block hover:text-[#7C3AED] transition-colors">
                        <Link to={`/u/${client?.username}`}>{client?.name || client?.username}</Link>
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono select-all truncate block" title={client?.walletAddress}>
                        {client?.walletAddress}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow Control actions panel */}
            <div className="bg-white border border-[#E4E8F0] rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Escrow Controls</h3>
              
              <div className="space-y-2.5">
                {/* FREELANCER ACTION: Submit delivery */}
                {isFreelancer && delivery.status !== 'approved' && delivery.status !== 'REFUNDED' && (
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    disabled={onChainStatus !== 'IN_PROGRESS'}
                    className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlusCircle className="w-4 h-4" /> Deliver Work
                  </button>
                )}

                {/* CLIENT ACTIONS: Approve / Request revisions */}
                {isClient && delivery.status === 'delivered' && (
                  <>
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading || onChainStatus !== 'DELIVERED'}
                      className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" /> Accept Project
                    </button>
                    <button
                      onClick={() => setRevisionModalOpen(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all cursor-pointer shadow-2xs mb-2"
                    >
                      <X className="w-4 h-4" /> Request Changes / Reject
                    </button>
                    <button
                      onClick={handleRefund}
                      disabled={actionLoading || onChainStatus !== 'DELIVERED'}
                      className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <AlertTriangle className="w-4 h-4" /> Cancel & Request Refund
                    </button>
                  </>
                )}

                {/* Empty State / Pending message */}
                {isClient && delivery.status === 'working' && (
                  <>
                    <div className="p-3 text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg font-medium text-center mb-2">
                      Oops! No delivery submitted yet.
                    </div>
                    <button
                      onClick={handleRefund}
                      disabled={actionLoading || (onChainStatus !== 'FUNDED' && onChainStatus !== 'IN_PROGRESS')}
                      className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <AlertTriangle className="w-4 h-4" /> Cancel & Request Refund
                    </button>
                  </>
                )}

                {isClient && delivery.status === 'revision_requested' && (
                  <>
                    <div className="p-3 text-[10px] text-amber-600 bg-amber-50/50 border border-amber-200 rounded-lg font-medium text-center mb-2">
                      Waiting for revised submission version...
                    </div>
                    <button
                      onClick={handleRefund}
                      disabled={actionLoading || (onChainStatus !== 'FUNDED' && onChainStatus !== 'IN_PROGRESS' && onChainStatus !== 'REVISION_REQUESTED')}
                      className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <AlertTriangle className="w-4 h-4" /> Cancel & Request Refund
                    </button>
                  </>
                )}

                {delivery.status === 'approved' && (
                  <div className="p-3 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg font-bold text-center flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Milestone Completed
                  </div>
                )}

                {delivery.status === 'REFUNDED' && (
                  <div className="p-3 text-[10px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg font-bold text-center flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Milestone Cancelled & Refunded
                  </div>
                )}
              </div>
            </div>

            {/* Smart contract status tracker details */}
            <div className="bg-[#FAF9FF] border border-[#7C3AED]/10 rounded-2xl p-4 text-[10.5px] text-slate-500 space-y-2">
              <h4 className="font-bold text-[#7C3AED] uppercase tracking-wider">Vault Smart Controls</h4>
              <p className="leading-relaxed">
                EscrowX delivery vault separates asset preview links from secure deliverable downloads. The final deliverables decrypt on the client side only after contract signature release.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* FREELANCER SUBMIT DELIVERABLES MODAL */}
      <AnimatePresence>
        {uploadModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-4.5 border-b border-[#F1F5F9] flex items-center justify-between">
                <h2 className="text-sm font-black text-[#0F172A] uppercase tracking-wider">Deliver Work Artifacts</h2>
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleDeliverySubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {submitError && (
                  <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs flex items-start gap-2 leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="bg-[#FAF9FF] border border-[#7C3AED]/10 rounded-xl p-3.5 text-[11px] text-slate-500 leading-relaxed">
                  <span className="font-bold text-[#7C3AED] uppercase block mb-1">⚠️ Delivery Vault Protection</span>
                  Specify preview files (screenshots, watermarked views) and locked final vault files (ZIP archives, builds, codebases). Vault files are locked until client accepts.
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Preview Files (Comma-separated URLs)</label>
                  <input
                    type="text"
                    placeholder="e.g. https://domain.com/preview.png, https://domain.com/mock.jpg"
                    value={previewFilesInput}
                    onChange={(e) => setPreviewFilesInput(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-xs bg-[#FAFAFA]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Original Source / Vault Files (Comma-separated IPFS/Hash references)</label>
                  <input
                    type="text"
                    placeholder="e.g. QmOriginalFileHash, QmSourceCodeBuildRef"
                    value={vaultFilesInput}
                    onChange={(e) => setVaultFilesInput(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-xs bg-[#FAFAFA] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Live Demo URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://figma.com/file/... or https://github.com/..."
                    value={demoLink}
                    onChange={(e) => setDemoLink(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-xs bg-[#FAFAFA]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Delivery Notes & Explanation</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide details about the completed work, installation guides, or details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-xs bg-[#FAFAFA] resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-3 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {actionLoading ? 'Uploading deliverables...' : 'Submit Deliverables'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLIENT REQUEST REVISIONS MODAL */}
      <AnimatePresence>
        {revisionModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4.5 border-b border-[#F1F5F9] flex items-center justify-between">
                <h2 className="text-sm font-black text-[#0F172A] uppercase tracking-wider">Request Revisions</h2>
                <button
                  type="button"
                  onClick={() => setRevisionModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
                {revisionError && (
                  <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs flex items-start gap-2 leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{revisionError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Revision Feedback / Required Adjustments</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="List the changes, fixes, or additions that the freelancer must complete..."
                    value={revisionReason}
                    onChange={(e) => setRevisionReason(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-xs bg-[#FAFAFA] resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {actionLoading ? 'Submitting request...' : 'Submit Revision Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRevisionModalOpen(false)}
                    className="px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
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
