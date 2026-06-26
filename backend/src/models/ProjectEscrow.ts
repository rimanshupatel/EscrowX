import mongoose, { Schema, model, Document } from 'mongoose';

export interface IProjectEscrow extends Document {
  escrowId: string;
  transactionHash: string;
  clientWallet: string;
  budget: number;
  platformFee: number;
  totalAmount: number;
  status: 'FUNDED' | 'LOCKED' | 'RELEASED' | 'REFUNDED' | 'IN_PROGRESS' | 'DELIVERED' | 'COMPLETED';
  escrowStatus: 'LOCKED' | 'RELEASED' | 'REFUNDED';
  projectStatus: 'OPEN_FOR_PROPOSALS' | 'WORKING' | 'COMPLETED';
  projectId: Schema.Types.ObjectId; // References the Listing/Project created
  createdAt: Date;
  updatedAt: Date;
}

const ProjectEscrowSchema = new Schema<IProjectEscrow>({
  escrowId: { type: String, required: true, unique: true },
  transactionHash: { type: String, required: true },
  clientWallet: { type: String, required: true },
  budget: { type: Number, required: true },
  platformFee: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['FUNDED', 'LOCKED', 'RELEASED', 'REFUNDED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED'], default: 'FUNDED' },
  escrowStatus: { type: String, enum: ['LOCKED', 'RELEASED', 'REFUNDED'], default: 'LOCKED' },
  projectStatus: { type: String, enum: ['OPEN_FOR_PROPOSALS', 'WORKING', 'COMPLETED'], default: 'OPEN_FOR_PROPOSALS' },
  projectId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
}, {
  timestamps: true
});

export const ProjectEscrow = mongoose.models.ProjectEscrow || model<IProjectEscrow>('ProjectEscrow', ProjectEscrowSchema, 'project_escrows');
