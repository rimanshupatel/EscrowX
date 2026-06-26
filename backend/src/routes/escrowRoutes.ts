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
  createProjectEscrow,
  getProjectTransactions,
  getProjectEscrowByListing,
} from '../controllers/escrowController';
import {
  postEscrowUpdate,
  getEscrowUpdates,
  reviewEscrowUpdate,
} from '../controllers/escrowUpdateController';

const router = Router();

// Project Escrow Specific Routes (Registered before :id to prevent conflict)
router.post('/project-escrow', verifyToken, requireRole(['CLIENT']), createProjectEscrow);
router.get('/project-escrow/transactions', verifyToken, requireRole(['CLIENT']), getProjectTransactions);
router.get('/project-escrow/listing/:listingId', verifyToken, getProjectEscrowByListing);

router.get('/my', verifyToken, getMyEscrows);
router.get('/:id', verifyToken, getEscrowDetails);

// Client-only operations
router.post('/', verifyToken, requireRole(['CLIENT']), createEscrow);
router.put('/:id/fund', verifyToken, requireRole(['CLIENT']), fundEscrow);
router.put('/:id/approve', verifyToken, requireRole(['CLIENT']), approveEscrow);
router.put('/:id/refund', verifyToken, requireRole(['CLIENT']), refundEscrow);

// Freelancer-only operations
router.post('/:id/deliver', verifyToken, requireRole(['FREELANCER']), submitDelivery);

// Escrow Workspace progress updates
router.get('/:id/updates', verifyToken, getEscrowUpdates);
router.post('/:id/updates', verifyToken, requireRole(['FREELANCER']), postEscrowUpdate);
router.put('/updates/:id/review', verifyToken, requireRole(['CLIENT']), reviewEscrowUpdate);

export default router;
