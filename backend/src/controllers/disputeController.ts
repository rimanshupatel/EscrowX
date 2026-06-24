import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Dispute } from '../models/Dispute';
import { Escrow, Transaction } from '../models/Escrow';
import { User } from '../models/User';
import { emitToUser } from '../sockets/chatSocket';

// Raise a dispute on an escrow
export async function raiseDispute(req: AuthRequest, res: Response) {
  try {
    const { escrowId, reason, evidenceContent } = req.body;
    const userId = req.user?.userId;

    if (!escrowId || !reason) {
      return res.status(400).json({ error: 'Escrow ID and dispute reason are required' });
    }

    const escrow = await Escrow.findById(escrowId).populate('job');
    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    // Check if the user is client or freelancer in this escrow
    const isClient = escrow.client.toString() === userId;
    const isFreelancer = escrow.freelancer.toString() === userId;
    if (!isClient && !isFreelancer) {
      return res.status(403).json({ error: 'Access denied. You are not a party in this escrow.' });
    }

    // Update escrow status
    escrow.status = 'DISPUTED';
    escrow.timeline.push({
      status: 'DISPUTED',
      timestamp: new Date(),
      note: `Dispute raised by ${isClient ? 'Client' : 'Freelancer'}. Reason: ${reason}`
    });
    await escrow.save();

    // Create dispute
    const dispute = new Dispute({
      escrow: escrowId,
      raisedBy: userId,
      reason,
      evidence: evidenceContent ? [{
        type: 'text',
        content: evidenceContent,
        submittedBy: userId,
        submittedAt: new Date()
      }] : [],
      status: 'under_review'
    });
    await dispute.save();

    // Log transaction
    const transaction = new Transaction({
      escrow: escrowId,
      type: 'dispute',
      txHash: escrow.txHash || 'mock_dispute_tx_hash',
      amount: escrow.amount,
      tokenType: escrow.tokenType,
      timestamp: new Date()
    });
    await transaction.save();

    // Notify other party
    const counterpartyId = isClient ? escrow.freelancer : escrow.client;
    const counterparty = await User.findById(counterpartyId);
    if (counterparty) {
      emitToUser(counterparty.walletAddress, 'notification', {
        title: 'Dispute Filed ⚖️',
        message: `A dispute has been raised on "${(escrow.job as any).title}". It is now under review.`,
        link: `/disputes`
      });
    }

    // Notify arbitrator
    const arbitrator = await User.findById(escrow.arbitrator);
    if (arbitrator) {
      emitToUser(arbitrator.walletAddress, 'notification', {
        title: 'New Dispute Assigned ⚖️',
        message: `You have been assigned to review dispute on "${(escrow.job as any).title}".`,
        link: `/disputes`
      });
    }

    return res.status(201).json(dispute);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Client or Freelancer submits evidence
export async function submitEvidence(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params; // dispute ID
    const { type, content, url } = req.body; // type: 'text' | 'file' | 'link'
    const userId = req.user?.userId;

    if (!type || !content) {
      return res.status(400).json({ error: 'Evidence type and content are required' });
    }

    const dispute = await Dispute.findById(id).populate('escrow');
    if (!dispute) {
      return res.status(404).json({ error: 'Dispute case not found' });
    }

    // Verify user is a party in the escrow or the arbitrator
    const escrow = await Escrow.findById(dispute.escrow);
    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    const isParty = escrow.client.toString() === userId || escrow.freelancer.toString() === userId || escrow.arbitrator.toString() === userId;
    if (!isParty) {
      return res.status(403).json({ error: 'Access denied' });
    }

    dispute.evidence.push({
      type,
      content,
      url,
      submittedBy: userId as any,
      submittedAt: new Date()
    });
    await dispute.save();

    return res.status(201).json(dispute);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Arbitrator resolves the dispute
export async function resolveDispute(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params; // dispute ID
    const { clientPayout, freelancerPayout, arbitratorNotes, resolution, txHash } = req.body;
    const arbitratorId = req.user?.userId;

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    const escrow = await Escrow.findById(dispute.escrow).populate('job');
    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    if (escrow.arbitrator.toString() !== arbitratorId) {
      return res.status(403).json({ error: 'Access denied. You are not the assigned arbitrator.' });
    }

    if (clientPayout + freelancerPayout !== escrow.amount) {
      return res.status(400).json({ error: 'Payout split sum must equal total escrow amount' });
    }

    // Resolve dispute in DB
    dispute.status = 'resolved';
    dispute.arbitratorNotes = arbitratorNotes || '';
    dispute.resolution = resolution || `Dispute settled. Client: ${clientPayout} XLM. Freelancer: ${freelancerPayout} XLM.`;
    dispute.resolvedAt = new Date();
    await dispute.save();

    // Update escrow status
    escrow.status = clientPayout === escrow.amount ? 'REFUNDED' : 'COMPLETED';
    escrow.timeline.push({
      status: escrow.status,
      timestamp: new Date(),
      txHash,
      note: `Dispute resolved by arbitrator. Resolution: ${dispute.resolution}`
    });
    await escrow.save();

    // Log transaction
    const transaction = new Transaction({
      escrow: escrow._id,
      type: 'resolution',
      txHash: txHash || 'mock_resolution_tx_hash',
      amount: escrow.amount,
      tokenType: escrow.tokenType,
      timestamp: new Date()
    });
    await transaction.save();

    // Recalibrate reputation/trust scores
    // Arbitrator decisions impact Trust Scores
    const client = await User.findById(escrow.client);
    const freelancer = await User.findById(escrow.freelancer);

    if (client && freelancer) {
      if (clientPayout > freelancerPayout) {
        // Client won, Freelancer lost
        freelancer.trustScore = Math.max(0, freelancer.trustScore - 15);
        client.trustScore = Math.min(100, client.trustScore + 2);
      } else {
        // Freelancer won, Client lost
        freelancer.trustScore = Math.min(100, freelancer.trustScore + 5);
        client.trustScore = Math.max(0, client.trustScore - 5);
      }
      
      // Re-evaluate badge levels
      for (const u of [client, freelancer]) {
        if (u.trustScore >= 95) u.badge = 'Platinum';
        else if (u.trustScore >= 85) u.badge = 'Gold';
        else if (u.trustScore >= 70) u.badge = 'Silver';
        else u.badge = 'Bronze';
        await u.save();
      }

      // Notify parties
      emitToUser(client.walletAddress, 'notification', {
        title: 'Dispute Resolved ⚖️',
        message: `The dispute on "${(escrow.job as any).title}" has been resolved by the arbitrator. Payout released.`,
        link: `/escrow/${escrow._id}`
      });
      emitToUser(freelancer.walletAddress, 'notification', {
        title: 'Dispute Resolved ⚖️',
        message: `The dispute on "${(escrow.job as any).title}" has been resolved by the arbitrator. Payout released.`,
        link: `/escrow/${escrow._id}`
      });
    }

    return res.json(dispute);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// List all disputes (arbitrator reviews all, client/freelancer reviews their own)
export async function getDisputes(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    let query = {};
    if (role === 'CLIENT') {
      const escrows = await Escrow.find({ client: userId }).select('_id');
      query = { escrow: { $in: escrows } };
    } else if (role === 'FREELANCER') {
      const escrows = await Escrow.find({ freelancer: userId }).select('_id');
      query = { escrow: { $in: escrows } };
    } else if (role === 'ARBITRATOR') {
      const escrows = await Escrow.find({ arbitrator: userId }).select('_id');
      query = { escrow: { $in: escrows } };
    }

    const disputes = await Dispute.find(query)
      .populate({
        path: 'escrow',
        populate: [
          { path: 'job', select: 'title' },
          { path: 'client', select: 'username walletAddress' },
          { path: 'freelancer', select: 'username walletAddress' }
        ]
      })
      .sort({ createdAt: -1 });

    return res.json(disputes);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
