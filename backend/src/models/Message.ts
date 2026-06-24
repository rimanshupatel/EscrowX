import { Schema, model, Document } from 'mongoose';

export interface IMessage extends Document {
  sender: Schema.Types.ObjectId;
  recipient: Schema.Types.ObjectId; // User receiving
  content: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'file';
  readAt?: Date;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, required: true },
  attachmentUrl: { type: String, default: '' },
  attachmentType: { type: String, enum: ['image', 'file'] },
  readAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export const Message = model<IMessage>('Message', MessageSchema);
