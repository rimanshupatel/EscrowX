import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth';
import {
  initiateDelivery,
  getDelivery,
  submitDelivery,
  approveDelivery,
  rejectDelivery,
  addComment,
  getDeliveries,
  refundDelivery
} from '../controllers/deliveryController';

const router = Router();

// Get all deliveries for current user
router.get('/', verifyToken, getDeliveries);

// Initiate delivery record (Internal / Contract Start)
router.post('/initiate', verifyToken, initiateDelivery);

// Get single delivery detail
router.get('/:escrowId', verifyToken, getDelivery);

// Submit deliverables (Freelancer only)
router.post('/:escrowId/submit', verifyToken, requireRole(['FREELANCER']), submitDelivery);

// Client review actions
router.put('/:escrowId/approve', verifyToken, requireRole(['CLIENT']), approveDelivery);
router.put('/:escrowId/reject', verifyToken, requireRole(['CLIENT']), rejectDelivery);
router.put('/:escrowId/refund', verifyToken, requireRole(['CLIENT']), refundDelivery);

// Comment system
router.post('/:escrowId/comments', verifyToken, addComment);

export default router;
