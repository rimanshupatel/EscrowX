import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth';
import {
  createEscrow,
  fundEscrow,
  submitDelivery,
  approveEscrow,
  refundEscrow,
  getEscrowDetails,
  getMyEscrows,
} from '../controllers/escrowController';

const router = Router();

router.get('/my', verifyToken, getMyEscrows);
router.get('/:id', verifyToken, getEscrowDetails);

// Client-only operations
router.post('/', verifyToken, requireRole(['CLIENT']), createEscrow);
router.put('/:id/fund', verifyToken, requireRole(['CLIENT']), fundEscrow);
router.put('/:id/approve', verifyToken, requireRole(['CLIENT']), approveEscrow);
router.put('/:id/refund', verifyToken, requireRole(['CLIENT']), refundEscrow);

// Freelancer-only operations
router.post('/:id/deliver', verifyToken, requireRole(['FREELANCER']), submitDelivery);

export default router;
