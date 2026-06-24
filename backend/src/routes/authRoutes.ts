import { Router } from 'express';
import { 
  getChallenge, 
  verifySignature, 
  register, 
  login,
  checkWallet,
  signup,
  signin,
  logout,
  me
} from '../controllers/authController';
import { verifyToken } from '../middleware/auth';

const router = Router();

// Existing endpoints for backward compatibility
router.post('/challenge', getChallenge);
router.post('/verify', verifySignature);
router.post('/register', register);
router.post('/login', login);

// New REST Endpoints for Hybrid Authentication
router.get('/check-wallet', checkWallet);
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/logout', logout);
router.get('/me', verifyToken as any, me);

export default router;
