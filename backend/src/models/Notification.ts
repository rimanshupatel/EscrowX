import { Schema, model, Document } from 'mongoose';

export interface INotification extends Document {
  user: Schema.Types.ObjectId;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  link: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export const Notification = model<INotification>('Notification', NotificationSchema);
