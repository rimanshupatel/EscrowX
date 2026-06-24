import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth';
import {
  raiseDispute,
  submitEvidence,
  resolveDispute,
  getDisputes,
} from '../controllers/disputeController';

const router = Router();

router.get('/', verifyToken, getDisputes);
router.post('/', verifyToken, raiseDispute);
router.post('/:id/evidence', verifyToken, submitEvidence);

// Arbitrator-only resolving
router.put('/:id/resolve', verifyToken, requireRole(['ARBITRATOR', 'ADMIN']), resolveDispute);

export default router;
