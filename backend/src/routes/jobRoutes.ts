import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth';
import {
  createJob,
  getJobs,
  getMyJobs,
  getJobDetails,
  updateJob,
  deleteJob,
  publishJob,
  applyToJob,
  getMyApplications,
  withdrawApplication,
  getJobApplications,
  updateApplicationStatus,
} from '../controllers/jobController';

const router = Router();

// Client: get their own jobs (drafts + published)
router.get('/my', verifyToken, requireRole(['CLIENT']), getMyJobs);

// Public / Authenticated - browse open jobs with search/filter/pagination
router.get('/', verifyToken, getJobs);
router.get('/:id', verifyToken, getJobDetails);

// Client-only CRUD
router.post('/', verifyToken, requireRole(['CLIENT']), createJob);
router.put('/:id', verifyToken, requireRole(['CLIENT']), updateJob);
router.delete('/:id', verifyToken, requireRole(['CLIENT']), deleteJob);
router.put('/:id/publish', verifyToken, requireRole(['CLIENT']), publishJob);

// Client: view and manage applications
router.get('/:id/applications', verifyToken, requireRole(['CLIENT']), getJobApplications);
router.put('/applications/:id', verifyToken, requireRole(['CLIENT']), updateApplicationStatus);

// Freelancer-only applying
router.post('/:id/apply', verifyToken, requireRole(['FREELANCER']), applyToJob);

// Freelancer: manage their own applications
router.get('/applications/my', verifyToken, requireRole(['FREELANCER']), getMyApplications);
router.delete('/applications/:id/withdraw', verifyToken, requireRole(['FREELANCER']), withdrawApplication);

export default router;

