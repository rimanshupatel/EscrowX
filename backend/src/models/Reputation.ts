import { Schema, model, Document } from 'mongoose';

export interface IReputation extends Document {
  user: Schema.Types.ObjectId;
  completedJobs: number;
  successRate: number; // percentage (e.g. 98)
  avgResponseTime: number; // in hours
  disputesWon: number;
  disputesLost: number;
  ratingAverage: number;
  updatedAt: Date;
}

const ReputationSchema = new Schema<IReputation>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  completedJobs: { type: Number, default: 0 },
  successRate: { type: Number, default: 100 },
  avgResponseTime: { type: Number, default: 2 }, // default 2 hours
  disputesWon: { type: Number, default: 0 },
  disputesLost: { type: Number, default: 0 },
  ratingAverage: { type: Number, default: 5.0 },
  updatedAt: { type: Date, default: Date.now }
});

export const Reputation = model<IReputation>('Reputation', ReputationSchema);
