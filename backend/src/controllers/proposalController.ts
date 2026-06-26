import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Proposal } from '../models/Proposal';
import { Listing } from '../models/Listing';
import { User } from '../models/User';
import { Delivery } from '../models/Delivery';
import { emitToUser } from '../sockets/chatSocket';
import { hasContactInfo } from '../utils/contactBlocker';

// Freelancer applies to a client project listing
export async function applyToProject(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params; // Listing/Project ID
    const { coverLetter, portfolio, expectedDelivery, bidAmount, experienceNotes } = req.body;
    const freelancerId = req.user?.userId;

    if (!coverLetter || !expectedDelivery || !bidAmount) {
      return res.status(400).json({ error: 'Cover letter, expected delivery, and bid amount are required' });
    }

    // Security contact details check
    if (hasContactInfo(coverLetter) || hasContactInfo(portfolio) || hasContactInfo(experienceNotes)) {
      return res.status(400).json({
        error: 'External communication is not allowed. Please remove email addresses, phone numbers, or messaging links (WhatsApp, Telegram, Discord) to protect platform integrity.'
      });
    }

    // Fetch project listing
    const project = await Listing.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project listing not found' });
    }

    if (project.type !== 'PROJECT') {
      return res.status(400).json({ error: 'You can only submit proposals to project listings' });
    }

    // Check if freelancer already applied
    const existingProposal = await Proposal.findOne({ projectId: id, freelancerId });
    if (existingProposal) {
      return res.status(400).json({ error: 'You have already submitted a proposal to this project' });
    }

    // Fetch freelancer user details
    const freelancerUser = await User.findById(freelancerId);
    if (!freelancerUser) {
      return res.status(404).json({ error: 'Freelancer user not found' });
    }

    // Store proposal document
    const proposal = new Proposal({
      projectId: id,
      projectOwnerId: project.ownerId || project.createdBy,
      projectOwnerWallet: project.ownerWalletAddress || '',
      freelancerId,
      freelancerWallet: freelancerUser.walletAddress,
      freelancerUsername: freelancerUser.username || freelancerUser.name,
      coverLetter,
      portfolio: portfolio || '',
      expectedDelivery,
      bidAmount,
      experienceNotes: experienceNotes || '',
      status: 'PENDING'
    });

    await proposal.save();

    // Notify project owner
    const ownerUser = await User.findById(project.ownerId || project.createdBy);
    if (ownerUser) {
      emitToUser(ownerUser.walletAddress, 'notification', {
        title: 'New Proposal Received 💼',
        message: `Freelancer "${freelancerUser.username || freelancerUser.name}" submitted a proposal of ${bidAmount} XLM on your project "${project.title}".`,
        link: `/client/hire-requests`
      });
    }

    return res.status(201).json(proposal);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Client gets all incoming proposals for their projects
export async function getReceivedProposals(req: AuthRequest, res: Response) {
  try {
    const clientId = req.user?.userId;
    const proposals = await Proposal.find({ projectOwnerId: clientId })
      .populate('projectId', 'title coverImage price deliveryDays')
      .populate('freelancerId', 'name walletAddress trustScore badge avatar')
      .sort({ createdAt: -1 });

    return res.json(proposals);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Freelancer gets all proposals they submitted
export async function getSentProposals(req: AuthRequest, res: Response) {
  try {
    const freelancerId = req.user?.userId;
    const proposals = await Proposal.find({ freelancerId })
      .populate('projectId', 'title coverImage budget deliveryDays ownerUsername ownerWalletAddress')
      .populate('projectOwnerId', 'name walletAddress trustScore')
      .sort({ createdAt: -1 });

    return res.json(proposals);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Client reviews and accepts a proposal
export async function acceptProposal(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params; // Proposal ID
    const { txHash } = req.body;
    const clientId = req.user?.userId;

    const proposal = await Proposal.findById(id).populate('projectId');
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Verify ownership
    if (proposal.projectOwnerId.toString() !== clientId) {
      return res.status(403).json({ error: 'Access denied. You do not own this project.' });
    }

    // Find associated ProjectEscrow
    const { ProjectEscrow } = require('../models/ProjectEscrow');
    const projectEscrow = await ProjectEscrow.findOne({ projectId: proposal.projectId });
    if (!projectEscrow) {
      return res.status(404).json({ error: 'Associated project escrow not found' });
    }

    proposal.status = 'ACCEPTED';
    await proposal.save();

    // Reject all other pending proposals for this project
    await Proposal.updateMany(
      { projectId: proposal.projectId, _id: { $ne: proposal._id }, status: 'PENDING' },
      { status: 'REJECTED' }
    );

    // Sync project escrow status
    projectEscrow.status = 'IN_PROGRESS';
    projectEscrow.projectStatus = 'WORKING';
    if (txHash) {
      projectEscrow.transactionHash = txHash;
    }
    await projectEscrow.save();

    // Automatically create Delivery Record using escrowId
    let delivery = await Delivery.findOne({ escrowId: projectEscrow.escrowId });
    if (!delivery) {
      const calculatedDeadline = new Date(Date.now() + (proposal.expectedDelivery || 7) * 24 * 60 * 60 * 1000);

      delivery = new Delivery({
        escrowId: projectEscrow.escrowId,
        projectId: proposal.projectId,
        freelancerId: proposal.freelancerId,
        clientId: proposal.projectOwnerId,
        status: 'working',
        budget: proposal.bidAmount || 0,
        deadline: calculatedDeadline,
        notes: '',
        demoLink: '',
        files: [],
        previewFiles: [],
        versions: [],
        comments: []
      });
      await delivery.save();
    }

    // Notify Freelancer
    const freelancerUser = await User.findById(proposal.freelancerId);
    if (freelancerUser) {
      emitToUser(freelancerUser.walletAddress, 'notification', {
        title: 'Proposal Accepted! 🎉',
        message: `Your bid for "${(proposal.projectId as any).title}" has been accepted! Create or fund the escrow next.`,
        link: `/freelancer/applications`
      });
    }

    return res.json(proposal);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Client rejects a proposal
export async function rejectProposal(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params; // Proposal ID
    const clientId = req.user?.userId;

    const proposal = await Proposal.findById(id).populate('projectId');
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Verify ownership
    if (proposal.projectOwnerId.toString() !== clientId) {
      return res.status(403).json({ error: 'Access denied. You do not own this project.' });
    }

    proposal.status = 'REJECTED';
    await proposal.save();

    // Notify Freelancer
    const freelancerUser = await User.findById(proposal.freelancerId);
    if (freelancerUser) {
      emitToUser(freelancerUser.walletAddress, 'notification', {
        title: 'Proposal Declined',
        message: `Your bid for "${(proposal.projectId as any).title}" has been rejected.`,
        link: `/freelancer/applications`
      });
    }

    return res.json(proposal);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Freelancer withdraws pending proposal
export async function withdrawProposal(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params; // Proposal ID
    const freelancerId = req.user?.userId;

    const proposal = await Proposal.findById(id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    if (proposal.freelancerId.toString() !== freelancerId) {
      return res.status(403).json({ error: 'Access denied. You do not own this proposal.' });
    }

    if (proposal.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending proposals can be withdrawn' });
    }

    await Proposal.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Proposal withdrawn successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
