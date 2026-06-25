export type EscrowStatus = 'PENDING' | 'DELIVERED' | 'DISPUTED' | 'RELEASED' | 'REFUNDED';
export type ActivityType = 'DELIVERY' | 'DISPUTE' | 'RELEASE' | 'NEW_ESCROW';
export type UserRole = 'CLIENT' | 'FREELANCER' | 'ADMIN' | 'DAO';

export interface ClientStats {
  totalEscrows: number;
  activeEscrows: number;
  completedJobs: number;
  totalXlmSpent: number;
}

export interface FreelancerStats {
  activeOrders: number;
  pendingDeliveries: number;
  completedOrders: number;
  totalXlmEarned: number;
}

export interface AdminStats {
  totalPlatformEscrows: number;
  activeDisputes: number;
  totalXlmOnPlatform: number;
  flaggedUsers: number;
}

export interface Escrow {
  id: string;
  jobTitle: string;
  freelancerName: string;
  freelancerAvatar: string;
  clientName: string;
  clientAvatar: string;
  amountLocked: number;
  deadline: string;
  status: EscrowStatus;
  createdAt: string;
}

export interface Activity {
  id: string;
  message: string;
  type: ActivityType;
  timestamp: string;
}

export interface Message {
  id: string;
  from: string;
  avatar: string;
  preview: string;
  timestamp: string;
  unread: boolean;
}

export interface Gig {
  id: string;
  title: string;
  freelancerId: string;
  viewsThisWeek: number;
  ordersReceived: number;
  rating: number;
}

export interface Dispute {
  id: string;
  escrowId: string;
  jobTitle: string;
  clientName: string;
  freelancerName: string;
  amountLocked: number;
  openedAt: string;
  status: 'OPEN' | 'RESOLVED';
  assignedToDAO: boolean;
}

export interface User {
  id: string;
  name: string;
  walletAddress: string;
  joinedAt: string;
  flagged: boolean;
  role: UserRole;
}
