import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'escrowx_jwt_secret_key_12345';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    walletAddress: string;
    role: 'CLIENT' | 'FREELANCER' | 'ARBITRATOR' | 'ADMIN';
  };
}

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Session token is missing.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      userId: decoded.userId,
      walletAddress: decoded.walletAddress,
      role: decoded.role
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Session token has expired or is invalid.' });
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User is not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
}

export function requireClient(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'User is not authenticated' });
  }
  if (req.user.role !== 'CLIENT' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Client role required.' });
  }
  next();
}

export function requireFreelancer(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'User is not authenticated' });
  }
  if (req.user.role !== 'FREELANCER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Freelancer role required.' });
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'User is not authenticated' });
  }
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
}
