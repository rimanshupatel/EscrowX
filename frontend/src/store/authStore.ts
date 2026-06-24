import { create } from 'zustand';

export interface UserProfile {
  id: string;
  name?: string;
  username?: string;
  email: string;
  walletAddress: string;
  role: 'CLIENT' | 'FREELANCER' | 'ARBITRATOR' | 'ADMIN';
  trustScore: number;
  badge: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  avatar?: string;
  isVerified?: boolean;
  isActive?: boolean;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  walletAddress: string | null;
  role: 'CLIENT' | 'FREELANCER' | 'ARBITRATOR' | 'ADMIN' | null;
  isAuthenticated: boolean;
  isConnected: boolean; // Alias compatibility
  loading: boolean;
  setAuth: (token: string, user: UserProfile) => void;
  setWallet: (address: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('escrowx_user') || 'null'),
  token: localStorage.getItem('escrowx_token'),
  walletAddress: localStorage.getItem('escrowx_wallet'),
  role: (localStorage.getItem('escrowx_role') as 'CLIENT' | 'FREELANCER' | 'ARBITRATOR' | 'ADMIN') || null,
  isAuthenticated: !!localStorage.getItem('escrowx_token'),
  isConnected: !!localStorage.getItem('escrowx_wallet'), // Alias compatibility
  loading: false,

  setAuth: (token, user) => {
    localStorage.setItem('escrowx_token', token);
    localStorage.setItem('escrowx_user', JSON.stringify(user));
    localStorage.setItem('escrowx_wallet', user.walletAddress);
    localStorage.setItem('escrowx_role', user.role);
    set({ 
      token, 
      user, 
      walletAddress: user.walletAddress, 
      role: user.role, 
      isAuthenticated: true,
      isConnected: true 
    });
  },

  setWallet: (address) => {
    if (address) {
      localStorage.setItem('escrowx_wallet', address);
      set({ walletAddress: address, isConnected: true });
    } else {
      localStorage.removeItem('escrowx_wallet');
      set({ walletAddress: null, isConnected: false });
    }
  },

  setLoading: (loading) => {
    set({ loading });
  },

  logout: () => {
    localStorage.removeItem('escrowx_token');
    localStorage.removeItem('escrowx_user');
    localStorage.removeItem('escrowx_wallet');
    localStorage.removeItem('escrowx_role');
    localStorage.removeItem('selectedRole');
    set({ 
      token: null, 
      user: null, 
      walletAddress: null, 
      role: null, 
      isAuthenticated: false,
      isConnected: false 
    });
  },
}));
