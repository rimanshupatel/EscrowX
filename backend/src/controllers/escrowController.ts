import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Escrow, Delivery, Transaction } from '../models/Escrow';
import { Job } from '../models/Job';
import { User } from '../models/User';
import { ProjectEscrow } from '../models/ProjectEscrow';
import { ProjectTransaction } from '../models/ProjectTransaction';
import { Listing } from '../models/Listing';
import { emitToUser } from '../sockets/chatSocket';

// Create new escrow record in DB (Stellar smart contract is generated/deployed)
export async function createEscrow(req: AuthRequest, res: Response) {
  try {
    const { jobId, listingId, contractId, arbitratorAddress, amount, tokenType, deadline, txHash, freelancerId } = req.body;
    const clientId = req.user?.userId;

    if ((!jobId && !listingId) || !contractId || !arbitratorAddress || !amount || !deadline) {
      return res.status(400).json({ error: 'Missing required escrow creation details' });
    }

    let finalJobId = jobId;
    let jobTitleStr = '';

    if (listingId) {
      const { Listing } = require('../models/Listing');
      const listing = await Listing.findById(listingId);
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      const newJob = new Job({
        title: listing.title,
        description: listing.description,
        client: clientId,
        budget: amount,
        tokenType: tokenType || 'XLM',
        status: 'in_progress'
      });
      await newJob.save();
      finalJobId = newJob._id;
      jobTitleStr = newJob.title;
    } else {
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      finalJobId = job._id;
      jobTitleStr = job.title;
    }

    // Identify freelancer
    let finalFreelancerId = freelancerId;
    if (!finalFreelancerId) {
      const freelancerUser = await User.findOne({ _id: { $ne: clientId }, role: 'FREELANCER' });
      finalFreelancerId = freelancerUser ? freelancerUser._id : clientId;
    }

    // Find arbitrator user ID
    const arbitratorUser = await User.findOne({ walletAddress: arbitratorAddress });
    const arbitratorId = arbitratorUser ? arbitratorUser._id : clientId;

    const escrow = new Escrow({
      job: finalJobId,
      contractId,
      client: clientId,
      freelancer: finalFreelancerId,
      arbitrator: arbitratorId,
      amount,
      tokenType: tokenType || 'XLM',
      status: 'CREATED',
      deadline: new Date(deadline),
      txHash,
      timeline: [{
        status: 'CREATED',
        timestamp: new Date(),
        txHash,
        note: 'Escrow smart contract deployed on Soroban.'
      }]
    });
    await escrow.save();

    // Create a transaction record
    const transaction = new Transaction({
      escrow: escrow._id,
      type: 'fund', // initial lock
      txHash,
      amount,
      tokenType: tokenType || 'XLM',
      timestamp: new Date()
    });
    await transaction.save();

    // Notify freelancer
    const freelancerUser = await User.findById(finalFreelancerId);
    if (freelancerUser) {
      emitToUser(freelancerUser.walletAddress, 'notification', {
        title: 'Escrow Contract Deployed',
        message: `Client has deployed an escrow for "${jobTitleStr}" of ${amount} ${tokenType}.`,
        link: `/escrow/${escrow._id}`
      });
    }

    return res.status(201).json(escrow);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Client funds the escrow contract (moves on-chain tokens to contract address)
export async function fundEscrow(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { txHash } = req.body;
    const clientId = req.user?.userId;

    const escrow = await Escrow.findById(id).populate('job');
    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    if (escrow.client.toString() !== clientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    escrow.status = 'FUNDED';
    escrow.timeline.push({
      status: 'FUNDED',
      timestamp: new Date(),
      txHash,
      note: 'Funds successfully locked on Soroban smart contract.'
    });
    await escrow.save();

    // Notify freelancer
    const freelancer = await User.findById(escrow.freelancer);
    if (freelancer) {
      emitToUser(freelancer.walletAddress, 'notification', {
        title: 'Escrow Funded! 💰',
        message: `Client deposited funds for "${(escrow.job as any).title}". You can start work now.`,
        link: `/escrow/${escrow._id}`
      });
    }

    return res.json(escrow);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Freelancer submits delivery
export async function submitDelivery(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params; // escrow ID
    const { ipfsHash, githubLink, notes } = req.body;
    const freelancerId = req.user?.userId;

    if (!ipfsHash || !notes) {
      return res.status(400).json({ error: 'IPFS hash and notes are required' });
    }

    const escrow = await Escrow.findById(id).populate('job');
    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    if (escrow.freelancer.toString() !== freelancerId) {
      return res.status(403).json({ error: 'Access denied. You are not assigned to this escrow.' });
    }

    // Save delivery
    const delivery = new Delivery({
      escrow: id,
      ipfsHash,
      githubLink,
      notes,
      submittedAt: new Date(),
      status: 'pending'
    });
    await delivery.save();

    // Update escrow status
    escrow.status = 'DELIVERED';
    escrow.timeline.push({
      status: 'DELIVERED',
      timestamp: new Date(),
      note: 'Freelancer submitted deliverables.'
    });
    await escrow.save();

    // Notify client
    const client = await User.findById(escrow.client);
    if (client) {
      emitToUser(client.walletAddress, 'notification', {
        title: 'Deliverable Submitted! 📬',
        message: `Freelancer submitted work for "${(escrow.job as any).title}". Review it now.`,
        link: `/escrow/${escrow._id}`
      });
    }

    return res.status(201).json({ escrow, delivery });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Client approves and releases funds
export async function approveEscrow(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { txHash } = req.body;
    const clientId = req.user?.userId;

    const escrow = await Escrow.findById(id).populate('job');
    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    if (escrow.client.toString() !== clientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    escrow.status = 'COMPLETED';
    escrow.timeline.push({
      status: 'COMPLETED',
      timestamp: new Date(),
      txHash,
      note: 'Client approved deliverables. Soroban contract released funds.'
    });
    await escrow.save();

    // Update job status to completed
    await Job.findByIdAndUpdate(escrow.job, { status: 'completed' });

    // Update delivery status
    await Delivery.findOneAndUpdate({ escrow: id, status: 'pending' }, { status: 'approved' });

    // Log transaction
    const transaction = new Transaction({
      escrow: escrow._id,
      type: 'release',
      txHash,
      amount: escrow.amount,
      tokenType: escrow.tokenType,
      timestamp: new Date()
    });
    await transaction.save();

    // Notify freelancer
    const freelancer = await User.findById(escrow.freelancer);
    if (freelancer) {
      emitToUser(freelancer.walletAddress, 'notification', {
        title: 'Payment Released! 💸',
        message: `Client approved work for "${(escrow.job as any).title}". ${escrow.amount} ${escrow.tokenType} transferred to your wallet.`,
        link: `/escrow/${escrow._id}`
      });
    }

    return res.json(escrow);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Client refunds escrow if deadline passed
export async function refundEscrow(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { txHash } = req.body;
    const clientId = req.user?.userId;

    const escrow = await Escrow.findById(id).populate('job');
    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    if (escrow.client.toString() !== clientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (new Date() < escrow.deadline) {
      return res.status(400).json({ error: 'Cannot request refund. Escrow deadline has not passed.' });
    }

    escrow.status = 'REFUNDED';
    escrow.timeline.push({
      status: 'REFUNDED',
      timestamp: new Date(),
      txHash,
      note: 'Escrow expired. Contract refunded funds to client.'
    });
    await escrow.save();

    const transaction = new Transaction({
      escrow: escrow._id,
      type: 'refund',
      txHash,
      amount: escrow.amount,
      tokenType: escrow.tokenType,
      timestamp: new Date()
    });
    await transaction.save();

    // Notify freelancer
    const freelancer = await User.findById(escrow.freelancer);
    if (freelancer) {
      emitToUser(freelancer.walletAddress, 'notification', {
        title: 'Escrow Refunded ↩️',
        message: `The escrow for "${(escrow.job as any).title}" expired and was refunded to the client.`,
        link: `/escrow/${escrow._id}`
      });
    }

    return res.json(escrow);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Get single escrow details
export async function getEscrowDetails(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const escrow = await Escrow.findById(id)
      .populate('job')
      .populate('client', 'username walletAddress trustScore badge profilePhoto')
      .populate('freelancer', 'username walletAddress trustScore badge profilePhoto')
      .populate('arbitrator', 'username walletAddress trustScore badge');
    
    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    const delivery = await Delivery.findOne({ escrow: id }).sort({ submittedAt: -1 });
    const transactions = await Transaction.find({ escrow: id }).sort({ timestamp: -1 });

    return res.json({ escrow, delivery, transactions });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Get escrows list for user
export async function getMyEscrows(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    const query = role === 'CLIENT' ? { client: userId } : { freelancer: userId };
    const escrows = await Escrow.find(query)
      .populate('job', 'title budget tokenType')
      .populate('client', 'username walletAddress')
      .populate('freelancer', 'username walletAddress')
      .sort({ updatedAt: -1 });

    return res.json(escrows);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Create project escrow & active listing after successful funding
export async function createProjectEscrow(req: AuthRequest, res: Response) {
  try {
    const { 
      transactionHash, 
      clientWallet, 
      budget, 
      platformFee, 
      totalAmount,
      title,
      description,
      type,
      deliveryDays,
      skills,
      tags
    } = req.body;

    const clientId = req.user?.userId;

    if (!transactionHash || !clientWallet || !budget || !title || !description || !deliveryDays) {
      return res.status(400).json({ error: 'Missing required project escrow/listing details' });
    }

    // Get owner details
    const owner = await User.findById(clientId);
    if (!owner) {
      return res.status(404).json({ error: 'Owner user not found' });
    }

    // 1. Create active listing
    const listing = new Listing({
      title,
      description,
      coverImage: '',
      type: type || 'PROJECT',
      role: 'CLIENT', // client is hiring
      createdBy: clientId,
      price: 0,
      budget: Number(budget),
      deliveryDays: Number(deliveryDays),
      skills: skills || [],
      tags: tags || [],
      attachments: [],
      status: 'active',
      ownerId: clientId,
      ownerWalletAddress: clientWallet,
      ownerUsername: owner.username || owner.name,
    });
    await listing.save();

    listing.projectId = listing._id;
    await listing.save();

    // 2. Generate unique escrowId (e.g. esc_12345)
    let escrowId = req.body.escrowId;
    if (!escrowId) {
      let isUnique = false;
      while (!isUnique) {
        escrowId = 'esc_' + Math.floor(10000 + Math.random() * 90000);
        const existing = await ProjectEscrow.findOne({ escrowId });
        if (!existing) {
          isUnique = true;
        }
      }
    } else {
      const existing = await ProjectEscrow.findOne({ escrowId });
      if (existing) {
        return res.status(400).json({ error: 'Provided escrowId is already in use.' });
      }
    }

    // 3. Create ProjectEscrow record
    const escrow = new ProjectEscrow({
      escrowId,
      transactionHash,
      clientWallet,
      budget: Number(budget),
      platformFee: Number(platformFee),
      totalAmount: Number(totalAmount),
      status: 'FUNDED',
      escrowStatus: 'LOCKED',
      projectStatus: 'OPEN_FOR_PROPOSALS',
      projectId: listing._id
    });
    await escrow.save();

    // 4. Create Transaction record
    const transaction = new ProjectTransaction({
      escrowId,
      transactionHash,
      clientWallet,
      amount: Number(budget),
      platformFee: Number(platformFee),
      totalPaid: Number(totalAmount),
      status: 'FUNDED',
      date: new Date()
    });
    await transaction.save();

    return res.status(201).json({ escrow, listing });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Get all project transactions/payment history for the current client connected wallet
export async function getProjectTransactions(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transactions = await ProjectTransaction.find({
      clientWallet: user.walletAddress
    }).sort({ date: -1 });

    return res.json(transactions);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Get single project escrow by listing ID
export async function getProjectEscrowByListing(req: AuthRequest, res: Response) {
  try {
    const { listingId } = req.params;
    const projectEscrow = await ProjectEscrow.findOne({ projectId: listingId });
    if (!projectEscrow) {
      return res.status(404).json({ error: 'Project escrow not found for this listing' });
    }
    return res.json(projectEscrow);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
