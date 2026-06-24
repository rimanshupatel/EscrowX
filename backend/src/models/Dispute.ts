import { Schema, model, Document } from 'mongoose';

export interface IEvidence {
  type: 'text' | 'file' | 'link';
  content: string;
  url?: string;
  submittedBy: Schema.Types.ObjectId;
  submittedAt: Date;
}

export interface IDispute extends Document {
  escrow: Schema.Types.ObjectId;
  raisedBy: Schema.Types.ObjectId;
  reason: string;
  evidence: IEvidence[];
  status: 'under_review' | 'escalated' | 'resolved';
  arbitratorNotes?: string;
  resolution?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

const EvidenceSchema = new Schema<IEvidence>({
  type: { type: String, enum: ['text', 'file', 'link'], required: true },
  content: { type: String, required: true },
  url: { type: String },
  submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  submittedAt: { type: Date, default: Date.now },
});

const DisputeSchema = new Schema<IDispute>({
  escrow: { type: Schema.Types.ObjectId, ref: 'Escrow', required: true },
  raisedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  evidence: [EvidenceSchema],
  status: { type: String, enum: ['under_review', 'escalated', 'resolved'], default: 'under_review' },
  arbitratorNotes: { type: String, default: '' },
  resolution: { type: String, default: '' },
  resolvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export const Dispute = model<IDispute>('Dispute', DisputeSchema);
