import { Schema, model, Document } from 'mongoose';

export type EscrowStatus =
  | 'CREATED'
  | 'FUNDED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'UNDER_REVIEW'
  | 'DISPUTED'
  | 'COMPLETED'
  | 'REFUNDED';

export interface ITimelineEvent {
  status: EscrowStatus;
  timestamp: Date;
  txHash?: string;
  note?: string;
}

export interface IEscrow extends Document {
  job: Schema.Types.ObjectId;
  contractId: string; // Soroban contract Address / hash
  client: Schema.Types.ObjectId;
  freelancer: Schema.Types.ObjectId;
  arbitrator: Schema.Types.ObjectId;
  amount: number;
  tokenType: 'XLM' | 'USDC';
  status: EscrowStatus;
  deadline: Date;
  txHash: string; // creation or funding tx hash
  timeline: ITimelineEvent[];
}

export interface IDelivery extends Document {
  escrow: Schema.Types.ObjectId;
  ipfsHash: string;
  githubLink?: string;
  notes: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ITransaction extends Document {
  escrow: Schema.Types.ObjectId;
  type: 'fund' | 'release' | 'refund' | 'dispute' | 'resolution';
  txHash: string;
  amount: number;
  tokenType: 'XLM' | 'USDC';
  timestamp: Date;
}

const EscrowSchema = new Schema<IEscrow>({
  job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  contractId: { type: String, required: true },
  client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  freelancer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  arbitrator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  tokenType: { type: String, enum: ['XLM', 'USDC'], default: 'XLM' },
  status: { 
    type: String, 
    enum: ['CREATED', 'FUNDED', 'IN_PROGRESS', 'DELIVERED', 'UNDER_REVIEW', 'DISPUTED', 'COMPLETED', 'REFUNDED'],
    default: 'CREATED' 
  },
  deadline: { type: Date, required: true },
  txHash: { type: String, default: '' },
  timeline: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    txHash: { type: String },
    note: { type: String }
  }]
});

const DeliverySchema = new Schema<IDelivery>({
  escrow: { type: Schema.Types.ObjectId, ref: 'Escrow', required: true },
  ipfsHash: { type: String, required: true },
  githubLink: { type: String, default: '' },
  notes: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
});

const TransactionSchema = new Schema<ITransaction>({
  escrow: { type: Schema.Types.ObjectId, ref: 'Escrow', required: true },
  type: { type: String, enum: ['fund', 'release', 'refund', 'dispute', 'resolution'], required: true },
  txHash: { type: String, required: true },
  amount: { type: Number, required: true },
  tokenType: { type: String, enum: ['XLM', 'USDC'], required: true },
  timestamp: { type: Date, default: Date.now }
});

export const Escrow = model<IEscrow>('Escrow', EscrowSchema);
export const Delivery = model<IDelivery>('Delivery', DeliverySchema);
export const Transaction = model<ITransaction>('Transaction', TransactionSchema);
