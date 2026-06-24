import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Wallet } from '../models/User';
import { Reputation } from '../models/Reputation';
import { verifyStellarSignature } from '../utils/stellarAuth';

const JWT_SECRET = process.env.JWT_SECRET || 'escrowx_jwt_secret_key_12345';

// ==================================================
// New REST APIs for Hybrid Authentication System
// ==================================================

// GET /api/auth/check-wallet?walletAddress=...
export async function checkWallet(req: Request, res: Response) {
  try {
    const { walletAddress } = req.query;
    if (!walletAddress) {
      return res.status(400).json({ error: 'walletAddress query parameter is required' });
    }
    const user = await User.findOne({ walletAddress: String(walletAddress) });
    return res.json({ exists: !!user });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// POST /api/auth/signup
export async function signup(req: Request, res: Response) {
  try {
    const { name, email, password, walletAddress, role } = req.body;

    if (!name || !email || !password || !walletAddress || !role) {
      return res.status(400).json({ error: 'All fields (name, email, password, walletAddress, role) are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // Check unique email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // Check unique walletAddress
    const existingWallet = await User.findOne({ walletAddress });
    if (existingWallet) {
      return res.status(400).json({ error: 'This wallet is already linked with another account.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user model
    const user = new User({
      name,
      email,
      password: hashedPassword,
      walletAddress,
      role,
      username: name || email.split('@')[0],
      avatar: '',
      isVerified: false,
      isActive: true,
      trustScore: 80,
      badge: 'Bronze'
    });
    await user.save();

    // Create Starting Wallet
    const wallet = new Wallet({
      user: user._id,
      walletAddress,
      balanceXLM: 1000,
      balanceUSDC: 500,
      lastConnected: new Date()
    });
    await wallet.save();

    // Create Starting Reputation
    const reputation = new Reputation({
      user: user._id,
      completedJobs: 0,
      successRate: 100,
      disputesWon: 0,
      disputesLost: 0,
      ratingAverage: 5.0
    });
    await reputation.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, walletAddress: user.walletAddress, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
        isActive: user.isActive,
        trustScore: user.trustScore,
        badge: user.badge
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// POST /api/auth/signin
export async function signin(req: Request, res: Response) {
  try {
    const { email, password, walletAddress } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!walletAddress) {
      return res.status(400).json({ error: 'Connect your wallet before signing in.' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare walletAddress
    if (user.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({ error: 'This wallet does not belong to this account.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, walletAddress: user.walletAddress, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      status: 'SUCCESS',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
        isActive: user.isActive,
        trustScore: user.trustScore,
        badge: user.badge
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// POST /api/auth/logout
export async function logout(req: Request, res: Response) {
  return res.json({ status: 'SUCCESS', message: 'Logged out successfully' });
}

// GET /api/auth/me
export async function me(req: any, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
        isActive: user.isActive,
        trustScore: user.trustScore,
        badge: user.badge
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// ==================================================
// Existing Legacy APIs for Backward Compatibility
// ==================================================

export async function getChallenge(req: Request, res: Response) {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress || walletAddress.length !== 56 || !walletAddress.startsWith('G')) {
      return res.status(400).json({ error: 'Invalid Stellar public wallet address' });
    }

    const timestamp = Date.now();
    const challenge = `EscrowX Auth Request for ${walletAddress} at timestamp ${timestamp}`;
    
    return res.json({ challenge });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function verifySignature(req: Request, res: Response) {
  try {
    const { walletAddress, challenge, signature } = req.body;
    if (!walletAddress || !challenge || !signature) {
      return res.status(400).json({ error: 'Missing signature verification parameters' });
    }

    const match = challenge.match(/at timestamp (\d+)$/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid challenge structure' });
    }
    const timestamp = parseInt(match[1]);
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      return res.status(400).json({ error: 'Challenge challenge has expired' });
    }

    const isValid = verifyStellarSignature(walletAddress, challenge, signature);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid cryptographic signature' });
    }

    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.json({ status: 'NEW_USER', message: 'Wallet signature verified. Profile creation required.' });
    }

    return res.json({
      status: 'EXISTING_USER',
      email: user.email,
      message: 'Wallet signature verified. Password verification required.'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { walletAddress, challenge, signature, email, password, role, username } = req.body;
    
    if (!walletAddress || !challenge || !signature || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing profile registration inputs' });
    }

    const isValid = verifyStellarSignature(walletAddress, challenge, signature);
    if (!isValid) {
      return res.status(401).json({ error: 'Signature verification failed' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const existingWallet = await User.findOne({ walletAddress });
    if (existingWallet) {
      return res.status(400).json({ error: 'Wallet address is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name: username || email.split('@')[0],
      walletAddress,
      email,
      password: hashedPassword,
      role,
      username: username || email.split('@')[0],
      avatar: '',
      isVerified: false,
      isActive: true,
      trustScore: 80,
      badge: 'Bronze'
    });
    await user.save();

    const wallet = new Wallet({
      user: user._id,
      walletAddress,
      balanceXLM: 1000,
      balanceUSDC: 500,
      lastConnected: new Date()
    });
    await wallet.save();

    const reputation = new Reputation({
      user: user._id,
      completedJobs: 0,
      successRate: 100,
      disputesWon: 0,
      disputesLost: 0,
      ratingAverage: 5.0
    });
    await reputation.save();

    const token = jwt.sign(
      { userId: user._id, walletAddress: user.walletAddress, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        email: user.email,
        role: user.role,
        username: user.username,
        trustScore: user.trustScore,
        badge: user.badge,
        profilePhoto: user.profilePhoto,
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password, walletAddress, challenge, signature } = req.body;
    
    if (!email || !password || !walletAddress || !challenge || !signature) {
      return res.status(400).json({ error: 'Missing email, password, or wallet signature verification details' });
    }

    const isValid = verifyStellarSignature(walletAddress, challenge, signature);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid cryptographic signature' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.walletAddress !== walletAddress) {
      return res.status(401).json({ error: 'Wallet address does not match this account' });
    }

    const token = jwt.sign(
      { userId: user._id, walletAddress: user.walletAddress, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      status: 'SUCCESS',
      token,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        email: user.email,
        role: user.role,
        username: user.username,
        trustScore: user.trustScore,
        badge: user.badge,
        profilePhoto: user.profilePhoto,
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
