import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  walletAddress: string;
  role: 'CLIENT' | 'FREELANCER' | 'ADMIN';
  avatar?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Legacy fields for backward compatibility
  username?: string;
  trustScore: number;
  badge: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  profilePhoto?: string;
}

export interface IWallet extends Document {
  user: Schema.Types.ObjectId;
  walletAddress: string;
  balanceXLM: number;
  balanceUSDC: number;
  lastConnected: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  walletAddress: { type: String, required: true, unique: true, index: true },
  role: { 
    type: String, 
    enum: ['CLIENT', 'FREELANCER', 'ADMIN'], 
    required: true 
  },
  avatar: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  // Legacy fields fallback values
  username: { type: String },
  trustScore: { type: Number, default: 80, min: 0, max: 100 },
  badge: { 
    type: String, 
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], 
    default: 'Bronze' 
  },
  profilePhoto: { type: String, default: '' },
}, { 
  timestamps: true 
});

const WalletSchema = new Schema<IWallet>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  walletAddress: { type: String, required: true, unique: true },
  balanceXLM: { type: Number, default: 0 },
  balanceUSDC: { type: Number, default: 0 },
  lastConnected: { type: Date, default: Date.now },
});

export const User = model<IUser>('User', UserSchema);
export const Wallet = model<IWallet>('Wallet', WalletSchema);
