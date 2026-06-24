'use client';

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, ArrowLeft, Copy, ExternalLink, CheckCircle2, Wallet, Shield, Zap } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StepProgress } from '@/components/shared/StepProgress';
import { MOCK_WALLET } from '@/lib/mock-data';
import { formatXLM, xlmToUSD, formatUSD } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Details' },
  { id: 2, label: 'Deposit' },
  { id: 3, label: 'Confirm' },
];

const step1Schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Please describe the project'),
  sellerAddress: z
    .string()
    .min(56, 'Invalid Stellar address')
    .max(56, 'Invalid Stellar address')
    .regex(/^G/, 'Must start with G (Stellar public key)'),
  deadline: z.string().min(1, 'Please set a deadline'),
  milestoneType: z.enum(['single', 'milestone']),
});

type Step1Data = z.infer<typeof step1Schema>;

// Realistic mock contract IDs for the confirmation step
const MOCK_CONTRACT = 'CAQZ5VRMGHPKMHWRJTPQNXW4DBMCPQZQH8JKZRS4MVYHQFB2UQXJVTM';

export default function CreateEscrowPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [xlmAmount, setXlmAmount] = useState<number>(0);
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const walletBalance = 10842.50;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      milestoneType: 'single',
    },
  });

  const onStep1Submit = (data: Step1Data) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  const escrowFee = xlmAmount * 0.005;
  const networkFee = 0.00001;
  const total = xlmAmount + escrowFee + networkFee;

  const handleConfirm = () => {
    setConfirmed(true);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(MOCK_CONTRACT);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AppLayout title="Create Escrow" showNewEscrow={false}>
      <div className="max-w-[640px] mx-auto">
        {/* Step progress */}
        <div className="mb-8">
          <StepProgress steps={STEPS} currentStep={currentStep} />
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Project Details */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="bg-white rounded-[16px] border border-[#E4E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_32px_rgba(91,107,248,0.08)] p-8">
                <div className="mb-6">
                  <h2 className="text-[20px] font-bold text-[#0F1117] mb-1">Project Details</h2>
                  <p className="text-sm text-[#9CA3AF]">Define the scope and parties of this escrow agreement</p>
                </div>

                <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-2">
                      Project Title
                    </label>
                    <input
                      {...register('title')}
                      placeholder="Logo Design for SaaS startup"
                      className={`w-full px-4 py-3 rounded-[10px] border text-sm bg-white text-[#0F1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5B6BF8]/30 focus:border-[#5B6BF8] transition-all ${
                        errors.title ? 'border-red-400' : 'border-[#E4E8F0]'
                      }`}
                    />
                    {errors.title && (
                      <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-2">
                      Description
                    </label>
                    <textarea
                      {...register('description')}
                      placeholder="Describe the deliverables, requirements, and acceptance criteria..."
                      rows={3}
                      className={`w-full px-4 py-3 rounded-[10px] border text-sm bg-white text-[#0F1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5B6BF8]/30 focus:border-[#5B6BF8] transition-all resize-none ${
                        errors.description ? 'border-red-400' : 'border-[#E4E8F0]'
                      }`}
                    />
                    {errors.description && (
                      <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
                    )}
                  </div>

                  {/* Seller address */}
                  <div>
                    <label className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-2">
                      Seller Wallet Address
                    </label>
                    <div className="relative">
                      <input
                        {...register('sellerAddress')}
                        placeholder="GDKPQN5XCZK8MNBRTV2H..."
                        className={`w-full px-4 py-3 rounded-[10px] border text-sm font-mono bg-white text-[#0F1117] placeholder:text-[#9CA3AF] placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-[#5B6BF8]/30 focus:border-[#5B6BF8] transition-all pr-10 ${
                          errors.sellerAddress ? 'border-red-400' : 'border-[#E4E8F0]'
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Shield className="w-4 h-4 text-[#9CA3AF]" />
                      </div>
                    </div>
                    {errors.sellerAddress && (
                      <p className="text-xs text-red-500 mt-1">{errors.sellerAddress.message}</p>
                    )}
                    <p className="text-[11px] text-[#9CA3AF] mt-1">Stellar public key starting with G</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Deadline */}
                    <div>
                      <label className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-2">
                        Deadline
                      </label>
                      <input
                        {...register('deadline')}
                        type="date"
                        className={`w-full px-4 py-3 rounded-[10px] border text-sm bg-white text-[#0F1117] focus:outline-none focus:ring-2 focus:ring-[#5B6BF8]/30 focus:border-[#5B6BF8] transition-all ${
                          errors.deadline ? 'border-red-400' : 'border-[#E4E8F0]'
                        }`}
                      />
                    </div>

                    {/* Milestone type */}
                    <div>
                      <label className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-2">
                        Payment Type
                      </label>
                      <select
                        {...register('milestoneType')}
                        className="w-full px-4 py-3 rounded-[10px] border border-[#E4E8F0] text-sm bg-white text-[#0F1117] focus:outline-none focus:ring-2 focus:ring-[#5B6BF8]/30 focus:border-[#5B6BF8] transition-all"
                      >
                        <option value="single">Single Payment</option>
                        <option value="milestone">Milestone-based</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-[10px] bg-[#5B6BF8] text-white font-semibold hover:bg-[#4757E8] transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-[#5B6BF8]/20 hover:-translate-y-px"
                  >
                    Next — Set Amount
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Deposit */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="bg-white rounded-[16px] border border-[#E4E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_32px_rgba(91,107,248,0.08)] p-8">
                <div className="mb-6">
                  <h2 className="text-[20px] font-bold text-[#0F1117] mb-1">Deposit Funds</h2>
                  <p className="text-sm text-[#9CA3AF]">Set the XLM amount to lock into the escrow vault</p>
                </div>

                {/* Big XLM input */}
                <div className="bg-[#F8F9FB] rounded-[14px] border border-[#E4E8F0] p-6 mb-5 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF] mb-4">
                    You are locking
                  </p>
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <input
                      type="number"
                      value={xlmAmount || ''}
                      onChange={(e) => setXlmAmount(Number(e.target.value))}
                      placeholder="0"
                      className="text-center text-[48px] font-extrabold font-mono text-[#0F1117] bg-transparent border-none outline-none w-44 placeholder:text-[#E4E8F0]"
                    />
                    <span className="text-[24px] font-bold text-[#7B68EE]">XLM</span>
                  </div>
                  {xlmAmount > 0 && (
                    <p className="text-sm text-[#9CA3AF]">
                      ≈ {formatUSD(xlmToUSD(xlmAmount))}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Wallet className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <span className="text-xs text-[#9CA3AF]">
                      Balance: <span className="font-semibold text-[#6B7280]">{walletBalance.toLocaleString()} XLM</span>
                    </span>
                  </div>

                  {/* Quick amount buttons */}
                  <div className="flex items-center justify-center gap-2 mt-3">
                    {[100, 250, 500, 1000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setXlmAmount(amount)}
                        className={`px-3 py-1 rounded-[6px] text-xs font-semibold border transition-all ${
                          xlmAmount === amount
                            ? 'bg-[#5B6BF8] border-[#5B6BF8] text-white'
                            : 'border-[#E4E8F0] text-[#9CA3AF] hover:border-[#5B6BF8] hover:text-[#5B6BF8]'
                        }`}
                      >
                        {amount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fee breakdown */}
                <div className="bg-[#F8F9FB] rounded-[10px] p-4 mb-5 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Escrow amount</span>
                    <span className="font-mono font-semibold text-[#0F1117]">{formatXLM(xlmAmount)} XLM</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">EscrowX fee (0.5%)</span>
                    <span className="font-mono font-semibold text-[#0F1117]">{formatXLM(escrowFee)} XLM</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Stellar network fee</span>
                    <span className="font-mono font-semibold text-[#16A865]">~$0.00001</span>
                  </div>
                  <div className="border-t border-[#E4E8F0] pt-2.5 flex justify-between text-sm font-bold">
                    <span className="text-[#0F1117]">Total</span>
                    <span className="font-mono text-[#0F1117]">{formatXLM(total)} XLM</span>
                  </div>
                </div>

                {/* Wallet pill */}
                <div className="flex items-center gap-2 p-3 bg-[#EEF0FF] rounded-[10px] border border-[#DDE2FF] mb-5">
                  <div className="w-2 h-2 rounded-full bg-[#16A865]" />
                  <span className="text-xs font-semibold text-[#5B6BF8]">Freighter Wallet Connected</span>
                  <span className="ml-auto font-mono text-[11px] text-[#7B68EE]">
                    {MOCK_WALLET.slice(0, 8)}...{MOCK_WALLET.slice(-4)}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center gap-2 px-4 py-3 rounded-[10px] border border-[#E4E8F0] text-sm font-semibold text-[#6B7280] hover:bg-[#F8F9FB] transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={() => xlmAmount > 0 && setCurrentStep(3)}
                    disabled={xlmAmount <= 0}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-[10px] bg-[#5B6BF8] text-white font-semibold hover:bg-[#4757E8] disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-px"
                  >
                    Deposit Funds
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Confirm */}
          {currentStep === 3 && !confirmed && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="bg-white rounded-[16px] border border-[#E4E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_32px_rgba(91,107,248,0.08)] p-8">
                <div className="mb-6">
                  <h2 className="text-[20px] font-bold text-[#0F1117] mb-1">Confirm & Lock</h2>
                  <p className="text-sm text-[#9CA3AF]">Review all details before deploying the smart contract</p>
                </div>

                {/* Summary card */}
                <div className="bg-[#F8F9FB] rounded-[12px] border border-[#E4E8F0] p-5 mb-5 space-y-3.5">
                  <SummaryRow label="Project" value={step1Data?.title || '—'} />
                  <SummaryRow label="Amount" value={`${formatXLM(xlmAmount)} XLM`} mono />
                  <SummaryRow label="Milestone Type" value={step1Data?.milestoneType === 'milestone' ? 'Milestone-based' : 'Single Payment'} />
                  <SummaryRow label="Deadline" value={step1Data?.deadline || '—'} />
                  <div className="border-t border-[#E4E8F0] pt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF] mb-1.5">Seller</p>
                    <p className="font-mono text-xs text-[#6B7280] break-all leading-relaxed">
                      {step1Data?.sellerAddress}
                    </p>
                  </div>
                </div>

                {/* Contract address */}
                <div className="mb-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF] mb-2">Contract Address</p>
                  <div className="flex items-center gap-2 bg-[#F8F9FB] rounded-[10px] border border-[#E4E8F0] p-3">
                    <span className="font-mono text-xs text-[#6B7280] flex-1 truncate">{MOCK_CONTRACT}</span>
                    <button
                      onClick={handleCopy}
                      className="p-1 rounded-[5px] hover:bg-[#EEF0FF] text-[#9CA3AF] hover:text-[#5B6BF8] transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href="#"
                      className="p-1 rounded-[5px] hover:bg-[#EEF0FF] text-[#9CA3AF] hover:text-[#5B6BF8] transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  {copied && <p className="text-xs text-[#16A865] mt-1">Copied to clipboard!</p>}
                </div>

                {/* Warning */}
                <div className="flex gap-3 p-3.5 bg-amber-50 rounded-[10px] border border-amber-200 mb-6">
                  <Shield className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Once confirmed, funds will be locked in the Soroban smart contract and cannot be recovered without seller delivery or dispute resolution.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="flex items-center gap-2 px-4 py-3 rounded-[10px] border border-[#E4E8F0] text-sm font-semibold text-[#6B7280] hover:bg-[#F8F9FB] transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-[10px] bg-[#5B6BF8] text-white font-semibold hover:bg-[#4757E8] transition-all hover:-translate-y-px shadow-sm hover:shadow-md hover:shadow-[#5B6BF8]/20"
                  >
                    <Zap className="w-4 h-4" />
                    Confirm & Lock Funds
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* SUCCESS state */}
          {confirmed && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <div className="bg-white rounded-[16px] border border-[#E4E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_32px_rgba(91,107,248,0.08)] p-8 text-center">
                {/* Animated check */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  className="w-16 h-16 rounded-full bg-[#16A865] mx-auto mb-6 flex items-center justify-center shadow-lg shadow-emerald-200"
                >
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </motion.div>

                <h2 className="text-[24px] font-extrabold text-[#0F1117] mb-2">Escrow Created! 🎉</h2>
                <p className="text-sm text-[#9CA3AF] mb-6 max-w-[360px] mx-auto">
                  Your funds are now locked in the Soroban smart contract. The seller will be notified to begin work.
                </p>

                <div className="bg-[#F8F9FB] rounded-[10px] border border-[#E4E8F0] p-4 mb-6 text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF] mb-1">Transaction Hash</p>
                  <p className="font-mono text-xs text-[#6B7280]">
                    a3f8b2c7d1e4f9a0b5c8d2e7f1a4b9c0d3e6f8a1...
                  </p>
                </div>

                <div className="flex gap-3">
                  <Link
                    to="/dashboard"
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-[10px] border border-[#E4E8F0] text-sm font-semibold text-[#6B7280] hover:bg-[#F8F9FB] transition-all"
                  >
                    View Dashboard
                  </Link>
                  <Link
                    to="/escrow/ESC-001"
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-[10px] bg-[#5B6BF8] text-white text-sm font-semibold hover:bg-[#4757E8] transition-all hover:-translate-y-px"
                  >
                    View Escrow
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}

function SummaryRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-[12px] font-semibold uppercase tracking-[0.07em] text-[#9CA3AF] shrink-0">{label}</span>
      <span className={`text-sm text-right text-[#0F1117] font-semibold ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
