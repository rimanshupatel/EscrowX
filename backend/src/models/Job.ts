import { Schema, model, Document } from 'mongoose';

export interface IJob extends Document {
  title: string;
  description: string;
  client: Schema.Types.ObjectId;
  budget: number;
  tokenType: 'XLM' | 'USDC';
  status: 'draft' | 'open' | 'in_progress' | 'completed';
  createdAt: Date;
}

export interface IApplication extends Document {
  job: Schema.Types.ObjectId;
  freelancer: Schema.Types.ObjectId;
  bidAmount: number;
  coverLetter: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

const JobSchema = new Schema<IJob>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  budget: { type: Number, required: true },
  tokenType: { type: String, enum: ['XLM', 'USDC'], default: 'XLM' },
  status: { type: String, enum: ['draft', 'open', 'in_progress', 'completed'], default: 'draft' },
  createdAt: { type: Date, default: Date.now },
});

const ApplicationSchema = new Schema<IApplication>({
  job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  freelancer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bidAmount: { type: Number, required: true },
  coverLetter: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

export const Job = model<IJob>('Job', JobSchema);
export const Application = model<IApplication>('Application', ApplicationSchema);
