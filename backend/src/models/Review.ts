import { Schema, model, Document } from 'mongoose';

export interface IReview extends Document {
  reviewer: Schema.Types.ObjectId;
  reviewee: Schema.Types.ObjectId;
  rating: number; // 1 to 5
  comment: string;
  escrow: Schema.Types.ObjectId;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  escrow: { type: Schema.Types.ObjectId, ref: 'Escrow', required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Review = model<IReview>('Review', ReviewSchema);
