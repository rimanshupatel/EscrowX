import mongoose, { Schema, model, Document } from 'mongoose';

export interface IDeliveryVersion {
  versionNumber: number;
  notes: string;
  demoLink?: string;
  files: string[];      // Vault files (source code / final assets)
  previewFiles: string[]; // Preview files (screenshots / mockups)
  submittedAt: Date;
}

export interface IDeliveryComment {
  userId: Schema.Types.ObjectId;
  username: string;
  message: string;
  timestamp: Date;
}

export interface IDelivery extends Document {
  escrowId: string;
  projectId: Schema.Types.ObjectId;
  freelancerId: Schema.Types.ObjectId;
  clientId: Schema.Types.ObjectId;
  status: 'working' | 'delivered' | 'approved' | 'revision_requested' | 'REFUNDED';
  budget: number;
  deadline: Date;
  notes: string;
  demoLink: string;
  files: string[];      // Vault files (source code / final assets)
  previewFiles: string[]; // Preview files (screenshots / mockups)
  versions: IDeliveryVersion[];
  comments: IDeliveryComment[];
  revisionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryVersionSchema = new Schema<IDeliveryVersion>({
  versionNumber: { type: Number, required: true },
  notes: { type: String, required: true },
  demoLink: { type: String, default: '' },
  files: { type: [String], default: [] },
  previewFiles: { type: [String], default: [] },
  submittedAt: { type: Date, default: Date.now }
});

const DeliveryCommentSchema = new Schema<IDeliveryComment>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const DeliverySchema = new Schema<IDelivery>({
  escrowId: { type: String, required: false, unique: true, sparse: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
  freelancerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['working', 'delivered', 'approved', 'revision_requested', 'REFUNDED'],
    default: 'working',
    required: true
  },
  budget: { type: Number, required: true },
  deadline: { type: Date, required: true },
  notes: { type: String, default: '' },
  demoLink: { type: String, default: '' },
  files: { type: [String], default: [] },
  previewFiles: { type: [String], default: [] },
  versions: [DeliveryVersionSchema],
  comments: [DeliveryCommentSchema],
  revisionReason: { type: String, default: '' }
}, {
  timestamps: true
});

export const Delivery = mongoose.models.ProjectDelivery || model<IDelivery>('ProjectDelivery', DeliverySchema, 'project_deliveries');
