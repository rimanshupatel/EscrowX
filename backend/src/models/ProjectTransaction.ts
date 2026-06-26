import mongoose, { Schema, model, Document } from 'mongoose';

export interface IProjectTransaction extends Document {
  escrowId: string;
  transactionHash: string;
  clientWallet: string;
  amount: number;
  platformFee: number;
  totalPaid: number;
  status: 'FUNDED' | 'LOCKED' | 'RELEASED' | 'REFUNDED' | 'IN_PROGRESS' | 'DELIVERED' | 'COMPLETED';
  date: Date;
}

const ProjectTransactionSchema = new Schema<IProjectTransaction>({
  escrowId: { type: String, required: true },
  transactionHash: { type: String, required: true },
  clientWallet: { type: String, required: true },
  amount: { type: Number, required: true },
  platformFee: { type: Number, required: true },
  totalPaid: { type: Number, required: true },
  status: { type: String, enum: ['FUNDED', 'LOCKED', 'RELEASED', 'REFUNDED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED'], required: true },
  date: { type: Date, default: Date.now }
});

export const ProjectTransaction = mongoose.models.ProjectTransaction || model<IProjectTransaction>('ProjectTransaction', ProjectTransactionSchema, 'project_transactions');
