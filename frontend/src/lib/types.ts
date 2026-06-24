export type EscrowStatus = 
  | 'created' 
  | 'funded' 
  | 'delivered' 
  | 'approved' 
  | 'disputed' 
  | 'refunded' 
  | 'complete';

export type MilestoneType = 'single' | 'milestone';

export type DisputeStatus = 'under_review' | 'escalated' | 'resolved';

export interface Escrow {
  id: string;
  contractId: string;
  title: string;
  description: string;
  buyerAddress: string;
  sellerAddress: string;
  amount: number;
  status: EscrowStatus;
  deadline: string;
  createdAt: string;
  milestoneType: MilestoneType;
  deliveryHash?: string;
  ipfsHash?: string;
  githubLink?: string;
  txHistory: Transaction[];
}

export interface Transaction {
  id: string;
  type: 'created' | 'funded' | 'delivered' | 'approved' | 'disputed' | 'refunded';
  amount?: number;
  txHash: string;
  timestamp: string;
  from?: string;
  to?: string;
  note?: string;
}

export interface Dispute {
  id: string;
  escrowId: string;
  escrowTitle: string;
  amount: number;
  filedBy: string;
  filedByRole: 'buyer' | 'seller';
  respondent: string;
  status: DisputeStatus;
  createdAt: string;
  evidence: Evidence[];
  arbiterNotes?: string;
  resolution?: string;
  resolvedAt?: string;
}

export interface Evidence {
  id: string;
  type: 'text' | 'file' | 'link';
  content: string;
  submittedBy: string;
  submittedAt: string;
}

export interface ActivityItem {
  id: string;
  type: 'funded' | 'delivered' | 'approved' | 'disputed' | 'refunded' | 'created';
  escrowId: string;
  escrowTitle: string;
  amount?: number;
  timestamp: string;
  actor?: string;
}

export interface AnalyticsData {
  volumeOverTime: { date: string; volume: number; count: number }[];
  outcomeBreakdown: { name: string; value: number; color: string }[];
  categoryBreakdown: { name: string; value: number; color: string }[];
  topSellers: TopSeller[];
  kpis: {
    totalVolume: number;
    successRate: number;
    avgCompletionDays: number;
    activeUsers: number;
  };
}

export interface TopSeller {
  address: string;
  completedEscrows: number;
  totalVolume: number;
  successRate: number;
}
