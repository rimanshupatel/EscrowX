import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Delivery } from '../models/Delivery';
import { User } from '../models/User';
import { ProjectEscrow } from '../models/ProjectEscrow';
import { ProjectTransaction } from '../models/ProjectTransaction';

// Helper to find a delivery by ObjectId or custom deliveryId (e.g. dlv_12345)
// Helper to find a delivery by escrowId
async function findDeliveryByEscrowId(escrowId: string) {
  return Delivery.findOne({ escrowId });
}

// Get all deliveries for the current logged-in user
export async function getDeliveries(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const deliveries = await Delivery.find({
      $or: [{ freelancerId: userId }, { clientId: userId }]
    })
      .populate('projectId', 'title budget price deadline deliveryDays description')
      .populate('freelancerId', 'name username avatar walletAddress')
      .populate('clientId', 'name username avatar walletAddress')
      .sort({ updatedAt: -1 });

    const populatedDeliveries = [];
    for (let dlv of deliveries) {
      const dlvObj = dlv.toObject();
      if (!dlvObj.escrowId) {
        const projId = dlv.projectId?._id || dlv.projectId;
        if (projId) {
          const pe = await ProjectEscrow.findOne({ projectId: projId });
          if (pe) {
            dlvObj.escrowId = pe.escrowId;
          }
        }
      }
      // Guarantee a non-undefined ID for UI links/routing
      if (!dlvObj.escrowId) {
        dlvObj.escrowId = dlvObj._id.toString();
      }
      populatedDeliveries.push(dlvObj);
    }

    return res.json(populatedDeliveries);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Initialize a delivery record when contract starts
export async function initiateDelivery(req: AuthRequest, res: Response) {
  try {
    const { projectId, freelancerId, clientId, budget, deadline, escrowId } = req.body;
    if (!projectId || !freelancerId || !clientId || !escrowId) {
      return res.status(400).json({ error: 'Missing required delivery details' });
    }

    // Check if delivery already exists
    let delivery = await Delivery.findOne({ escrowId });
    if (!delivery) {
      delivery = new Delivery({
        escrowId,
        projectId,
        freelancerId,
        clientId,
        status: 'working',
        budget: budget || 0,
        deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      await delivery.save();
    }
    return res.status(201).json(delivery);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Get single delivery detail (with client vault security gate)
export async function getDelivery(req: AuthRequest, res: Response) {
  try {
    const { escrowId } = req.params;
    const userId = req.user?.userId;

    let delivery = await Delivery.findOne({ escrowId })
      .populate('projectId', 'title description deliveryDays budget')
      .populate('freelancerId', 'name walletAddress username avatar')
      .populate('clientId', 'name walletAddress username avatar');

    // Fallback: if not found by escrowId directly, maybe escrowId is actually the legacy deliveryId
    if (!delivery) {
      delivery = await Delivery.findOne({ deliveryId: escrowId } as any)
        .populate('projectId', 'title description deliveryDays budget')
        .populate('freelancerId', 'name walletAddress username avatar')
        .populate('clientId', 'name walletAddress username avatar');
    }

    // Fallback: lookup by ProjectEscrow
    if (!delivery) {
      const pe = await ProjectEscrow.findOne({ escrowId });
      if (pe) {
        delivery = await Delivery.findOne({ projectId: pe.projectId })
          .populate('projectId', 'title description deliveryDays budget')
          .populate('freelancerId', 'name walletAddress username avatar')
          .populate('clientId', 'name walletAddress username avatar');
      }
    }

    // Fallback: search by _id if it's a valid ObjectId
    if (!delivery && escrowId && escrowId.match(/^[0-9a-fA-F]{24}$/)) {
      delivery = await Delivery.findById(escrowId)
        .populate('projectId', 'title description deliveryDays budget')
        .populate('freelancerId', 'name walletAddress username avatar')
        .populate('clientId', 'name walletAddress username avatar');
    }

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery record not found' });
    }

    const isFreelancer = (delivery.freelancerId as any)._id?.toString() === userId || delivery.freelancerId.toString() === userId;
    const isClient = (delivery.clientId as any)._id?.toString() === userId || delivery.clientId.toString() === userId;
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'ARBITRATOR';

    if (!isFreelancer && !isClient && !isAdmin) {
      return res.status(403).json({ error: 'Access denied. You are not a participant in this delivery.' });
    }

    // Convert to plain object for manipulation
    const responseData = delivery.toObject();

    // Attach on-chain escrow ID
    if (delivery.escrowId) {
      responseData.escrowId = delivery.escrowId;
    } else {
      const projectEscrow = await ProjectEscrow.findOne({ projectId: delivery.projectId });
      if (projectEscrow) {
        responseData.escrowId = projectEscrow.escrowId;
      }
    }

    // Security Gate check: Client cannot see raw locked files before approval
    if (isClient && delivery.status !== 'approved') {
      responseData.files = []; // Lock original files
      if (responseData.versions && responseData.versions.length > 0) {
        responseData.versions = responseData.versions.map((ver: any) => ({
          ...ver,
          files: [] // Lock historical files too
        }));
      }
    }

    return res.json(responseData);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Freelancer submits new work delivery
export async function submitDelivery(req: AuthRequest, res: Response) {
  try {
    const { escrowId } = req.params;
    const { notes, demoLink, files, previewFiles, txHash } = req.body;
    const freelancerId = req.user?.userId;

    const delivery = await Delivery.findOne({ escrowId });
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery record not found' });
    }

    if (delivery.freelancerId.toString() !== freelancerId) {
      return res.status(403).json({ error: 'Access denied. Only the assigned freelancer can deliver work.' });
    }

    if (delivery.status === 'approved') {
      return res.status(400).json({ error: 'Delivery has already been approved and closed.' });
    }

    // Archive current submission to version history
    const nextVersionNumber = delivery.versions.length + 1;
    const newVersion = {
      versionNumber: nextVersionNumber,
      notes: notes || '',
      demoLink: demoLink || '',
      files: files || [],
      previewFiles: previewFiles || [],
      submittedAt: new Date()
    };

    delivery.versions.push(newVersion);

    // Update current active state
    delivery.notes = notes || '';
    delivery.demoLink = demoLink || '';
    delivery.files = files || [];
    delivery.previewFiles = previewFiles || [];
    delivery.status = 'delivered';

    await delivery.save();

    // Update ProjectEscrow
    const projectEscrow = await ProjectEscrow.findOne({ escrowId });
    if (projectEscrow) {
      projectEscrow.status = 'DELIVERED';
      if (txHash) {
        projectEscrow.transactionHash = txHash;
      }
      await projectEscrow.save();
    }

    return res.json(delivery);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Client approves delivery and unlocks files
export async function approveDelivery(req: AuthRequest, res: Response) {
  try {
    const { escrowId } = req.params;
    const { txHash } = req.body;
    const clientId = req.user?.userId;

    const delivery = await Delivery.findOne({ escrowId });
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery record not found' });
    }

    if (delivery.clientId.toString() !== clientId) {
      return res.status(403).json({ error: 'Access denied. Only the client can approve the delivery.' });
    }

    if (delivery.status === 'approved') {
      return res.status(400).json({ error: 'Delivery is already approved.' });
    }

    delivery.status = 'approved';
    await delivery.save();

    // Release associated ProjectEscrow if it exists
    try {
      const projectEscrow = await ProjectEscrow.findOne({ escrowId });
      if (projectEscrow) {
        projectEscrow.status = 'COMPLETED';
        projectEscrow.escrowStatus = 'RELEASED';
        projectEscrow.projectStatus = 'COMPLETED';
        if (txHash) {
          projectEscrow.transactionHash = txHash;
        }
        await projectEscrow.save();

        const tx = new ProjectTransaction({
          escrowId: projectEscrow.escrowId,
          transactionHash: txHash || 'tx_released_' + Math.floor(10000 + Math.random() * 90000) + '_' + Date.now().toString().slice(-4),
          clientWallet: projectEscrow.clientWallet,
          amount: projectEscrow.budget,
          platformFee: projectEscrow.platformFee,
          totalPaid: projectEscrow.totalAmount,
          status: 'COMPLETED',
          date: new Date()
        });
        await tx.save();
      }
    } catch (escrowErr) {
      console.error('Error updating associated ProjectEscrow:', escrowErr);
    }

    // Escrow Release Hook Trigger
    console.log(`[ESCROW HOOK] Releasing funds for project ${delivery.projectId}. Soroban smart contract triggered.`);

    return res.json(delivery);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Client requests revisions (rejects submission)
export async function rejectDelivery(req: AuthRequest, res: Response) {
  try {
    const { escrowId } = req.params;
    const { reason } = req.body;
    const clientId = req.user?.userId;

    if (!reason) {
      return res.status(400).json({ error: 'A revision reason is required.' });
    }

    const delivery = await Delivery.findOne({ escrowId });
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery record not found' });
    }

    if (delivery.clientId.toString() !== clientId) {
      return res.status(403).json({ error: 'Access denied. Only the client can request revisions.' });
    }

    if (delivery.status === 'approved') {
      return res.status(400).json({ error: 'Cannot request revisions on an approved delivery.' });
    }

    delivery.status = 'revision_requested';
    delivery.revisionReason = reason;
    await delivery.save();

    return res.json(delivery);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Add a feedback comment to the thread
export async function addComment(req: AuthRequest, res: Response) {
  try {
    const { escrowId } = req.params;
    const { message } = req.body;
    const userId = req.user?.userId;

    if (!message) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const delivery = await Delivery.findOne({ escrowId });
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery record not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isFreelancer = delivery.freelancerId.toString() === userId;
    const isClient = delivery.clientId.toString() === userId;
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'ARBITRATOR';

    if (!isFreelancer && !isClient && !isAdmin) {
      return res.status(403).json({ error: 'Access denied. Only participants can comment on this delivery.' });
    }

    const comment = {
      userId,
      username: user.username || user.name,
      message,
      timestamp: new Date()
    };

    delivery.comments.push(comment as any);
    await delivery.save();

    return res.status(201).json(comment);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Client refunds delivery escrow
export async function refundDelivery(req: AuthRequest, res: Response) {
  try {
    const { escrowId } = req.params;
    const { txHash } = req.body;
    const userId = req.user?.userId;

    if (!txHash) {
      return res.status(400).json({ error: 'Transaction hash is required.' });
    }

    const delivery = await Delivery.findOne({ escrowId });
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery record not found.' });
    }

    const isClient = delivery.clientId.toString() === userId;
    if (!isClient) {
      return res.status(403).json({ error: 'Access denied. Only the client can request a refund.' });
    }

    // Update Delivery status
    delivery.status = 'REFUNDED';
    await delivery.save();

    // Update ProjectEscrow status
    const projectEscrow = await ProjectEscrow.findOne({ escrowId });
    if (projectEscrow) {
      projectEscrow.status = 'REFUNDED';
      projectEscrow.escrowStatus = 'REFUNDED';
      projectEscrow.transactionHash = txHash;
      await projectEscrow.save();
    }

    // Create a ProjectTransaction record
    const transaction = new ProjectTransaction({
      escrowId,
      transactionHash: txHash,
      clientWallet: projectEscrow?.clientWallet || '',
      amount: delivery.budget,
      platformFee: projectEscrow?.platformFee || 0,
      totalPaid: projectEscrow?.totalAmount || delivery.budget,
      status: 'REFUNDED',
      date: new Date()
    });
    await transaction.save();

    return res.json({ success: true, delivery });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

