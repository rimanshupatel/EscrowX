import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import {
  submitReview,
  getUserReviews,
  getEscrowReviews
} from '../controllers/reviewController';

const router = Router();

router.post('/', verifyToken, submitReview);
router.get('/user/:userId', verifyToken, getUserReviews);
router.get('/escrow/:escrowId', verifyToken, getEscrowReviews);

export default router;
