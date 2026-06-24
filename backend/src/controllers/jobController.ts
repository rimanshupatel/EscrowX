import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Job, Application } from '../models/Job';
import { User } from '../models/User';
import { emitToUser } from '../sockets/chatSocket';

// Client posts a new job
export async function createJob(req: AuthRequest, res: Response) {
  try {
    const { title, description, budget, tokenType } = req.body;
    const clientId = req.user?.userId;

    if (!title || !description || !budget) {
      return res.status(400).json({ error: 'Title, description, and budget are required' });
    }

    const job = new Job({
      title,
      description,
      client: clientId,
      budget,
      tokenType: tokenType || 'XLM',
      status: 'draft', // default to draft
    });
    await job.save();

    return res.status(201).json(job);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Freelancer/Client browses all open jobs (with search, filter, and pagination)
export async function getJobs(req: AuthRequest, res: Response) {
  try {
    const { search, tokenType, minBudget, maxBudget, page = 1, limit = 10 } = req.query;

    const query: any = { status: 'open' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (tokenType) {
      query.tokenType = tokenType;
    }

    if (minBudget || maxBudget) {
      query.budget = {};
      if (minBudget) query.budget.$gte = Number(minBudget);
      if (maxBudget) query.budget.$lte = Number(maxBudget);
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skipNum = (pageNum - 1) * limitNum;

    const totalJobs = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .populate('client', 'username walletAddress trustScore badge')
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum);

    return res.json({
      jobs,
      pagination: {
        total: totalJobs,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalJobs / limitNum)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Client gets all jobs they posted
export async function getMyJobs(req: AuthRequest, res: Response) {
  try {
    const clientId = req.user?.userId;
    const jobs = await Job.find({ client: clientId })
      .populate('client', 'username walletAddress trustScore badge')
      .sort({ createdAt: -1 });
    return res.json(jobs);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Client edits a job
export async function updateJob(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, description, budget, tokenType } = req.body;
    const clientId = req.user?.userId;

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.client.toString() !== clientId) {
      return res.status(403).json({ error: 'Access denied. You do not own this job posting.' });
    }

    if (!['draft', 'open'].includes(job.status)) {
      return res.status(400).json({ error: 'You can only edit jobs that are drafts or open' });
    }

    if (title !== undefined) job.title = title;
    if (description !== undefined) job.description = description;
    if (budget !== undefined) job.budget = budget;
    if (tokenType !== undefined) job.tokenType = tokenType;

    await job.save();
    return res.json(job);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Client deletes a job
export async function deleteJob(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const clientId = req.user?.userId;

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.client.toString() !== clientId) {
      return res.status(403).json({ error: 'Access denied. You do not own this job posting.' });
    }

    await Application.deleteMany({ job: id });
    await Job.findByIdAndDelete(id);

    return res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Client publishes a draft job to open status
export async function publishJob(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const clientId = req.user?.userId;

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.client.toString() !== clientId) {
      return res.status(403).json({ error: 'Access denied. You do not own this job posting.' });
    }

    if (job.status !== 'draft') {
      return res.status(400).json({ error: 'Job is already published or in progress' });
    }

    job.status = 'open';
    await job.save();

    return res.json(job);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Get single job details with applications
export async function getJobDetails(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const job = await Job.findById(id).populate('client', 'username walletAddress trustScore badge');
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    return res.json(job);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Freelancer applies to a job
export async function applyToJob(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params; // job ID
    const { bidAmount, coverLetter } = req.body;
    const freelancerId = req.user?.userId;

    if (!bidAmount || !coverLetter) {
      return res.status(400).json({ error: 'Bid amount and cover letter are required' });
    }

    // Check if freelancer already applied
    const existingApp = await Application.findOne({ job: id, freelancer: freelancerId });
    if (existingApp) {
      return res.status(400).json({ error: 'You have already applied to this job' });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    if (job.status !== 'open') {
      return res.status(400).json({ error: 'This job is no longer accepting applications' });
    }

    const application = new Application({
      job: id,
      freelancer: freelancerId,
      bidAmount,
      coverLetter,
      status: 'pending',
    });
    await application.save();

    // Notify the client in real-time
    const clientUser = await User.findById(job.client);
    if (clientUser) {
      emitToUser(clientUser.walletAddress, 'notification', {
        title: 'New Job Application',
        message: `A freelancer has applied to your job "${job.title}" for ${bidAmount} ${job.tokenType}.`,
        link: `/jobs/${job._id}`
      });
    }

    return res.status(201).json(application);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Client lists all applications for their job post
export async function getJobApplications(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params; // job ID
    const clientId = req.user?.userId;

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Verify requesting user is the job owner
    if (job.client.toString() !== clientId) {
      return res.status(403).json({ error: 'Access denied. You do not own this job posting.' });
    }

    const applications = await Application.find({ job: id })
      .populate('freelancer', 'username walletAddress trustScore badge profilePhoto')
      .sort({ createdAt: -1 });

    return res.json(applications);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Client accepts or rejects an application
export async function updateApplicationStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params; // application ID
    const { status } = req.body; // 'accepted' | 'rejected'
    const clientId = req.user?.userId;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid application status update' });
    }

    const application = await Application.findById(id).populate('job');
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const job = await Job.findById(application.job);
    if (!job) {
      return res.status(404).json({ error: 'Associated job not found' });
    }

    if (job.client.toString() !== clientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    application.status = status;
    await application.save();

    // If accepted, update the job status and reject other pending applications
    if (status === 'accepted') {
      job.status = 'in_progress';
      await job.save();

      // Reject other applications
      await Application.updateMany(
        { job: job._id, _id: { $ne: application._id }, status: 'pending' },
        { status: 'rejected' }
      );
    }

    // Notify freelancer
    const freelancerUser = await User.findById(application.freelancer);
    if (freelancerUser) {
      emitToUser(freelancerUser.walletAddress, 'notification', {
        title: status === 'accepted' ? 'Application Accepted! 🎉' : 'Application Update',
        message: status === 'accepted' 
          ? `Your bid for "${job.title}" has been accepted. Create/Accept the escrow contract next.`
          : `Your application to "${job.title}" has been rejected.`,
        link: status === 'accepted' ? `/dashboard` : `/jobs`
      });
    }

    return res.json(application);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Freelancer gets all their own applications with status
export async function getMyApplications(req: AuthRequest, res: Response) {
  try {
    const freelancerId = req.user?.userId;
    const applications = await Application.find({ freelancer: freelancerId })
      .populate({ path: 'job', populate: { path: 'client', select: 'username walletAddress trustScore' } })
      .sort({ createdAt: -1 });
    return res.json(applications);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Freelancer withdraws a pending application
export async function withdrawApplication(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params; // application ID
    const freelancerId = req.user?.userId;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.freelancer.toString() !== freelancerId) {
      return res.status(403).json({ error: 'Access denied. This is not your application.' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending applications can be withdrawn' });
    }

    await Application.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Application withdrawn successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

