import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Review } from '../models/Review';
import { Escrow } from '../models/Escrow';
import { User } from '../models/User';

// Submit review for an escrow
export async function submitReview(req: AuthRequest, res: Response) {
  try {
    const { escrowId, rating, comment } = req.body;
    const reviewerId = req.user?.userId;

    if (!escrowId || !rating || !comment) {
      return res.status(400).json({ error: 'Escrow ID, rating, and comment are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const escrow = await Escrow.findById(escrowId);
    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    // Verify escrow status is final (COMPLETED or REFUNDED)
    if (escrow.status !== 'COMPLETED' && escrow.status !== 'REFUNDED') {
      return res.status(400).json({ error: 'Reviews can only be submitted for completed or refunded escrows' });
    }

    // Identify who is reviewing whom
    const isClient = escrow.client.toString() === reviewerId;
    const isFreelancer = escrow.freelancer.toString() === reviewerId;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ error: 'Access denied. You are not a party in this escrow.' });
    }

    const revieweeId = isClient ? escrow.freelancer : escrow.client;

    // Check if review already exists from this reviewer for this escrow
    const existingReview = await Review.findOne({ escrow: escrowId, reviewer: reviewerId });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already submitted a review for this escrow' });
    }

    // Create the review
    const review = new Review({
      reviewer: reviewerId,
      reviewee: revieweeId,
      rating,
      comment,
      escrow: escrowId
    });
    await review.save();

    // Recalculate reviewee's average rating & update trust score
    const allReviews = await Review.find({ reviewee: revieweeId });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / allReviews.length;

    // Trust Score update logic (rating maps to score changes)
    const reviewee = await User.findById(revieweeId);
    if (reviewee) {
      // Base trust score starting around 80. Every 5-star review adds trust, lower ratings decrease it.
      const trustScoreDelta = (rating - 3.5) * 4; 
      reviewee.trustScore = Math.max(0, Math.min(100, Math.round(reviewee.trustScore + trustScoreDelta)));

      // Re-evaluate badge levels
      if (reviewee.trustScore >= 95) reviewee.badge = 'Platinum';
      else if (reviewee.trustScore >= 85) reviewee.badge = 'Gold';
      else if (reviewee.trustScore >= 70) reviewee.badge = 'Silver';
      else reviewee.badge = 'Bronze';

      await reviewee.save();
    }

    return res.status(201).json(review);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Get reviews received by a specific user
export async function getUserReviews(req: AuthRequest, res: Response) {
  try {
    const { userId } = req.params;
    const reviews = await Review.find({ reviewee: userId })
      .populate('reviewer', 'username walletAddress profilePhoto badge')
      .sort({ createdAt: -1 });

    return res.json(reviews);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Get reviews submitted for a specific escrow
export async function getEscrowReviews(req: AuthRequest, res: Response) {
  try {
    const { escrowId } = req.params;
    const reviews = await Review.find({ escrow: escrowId })
      .populate('reviewer', 'username walletAddress');
    return res.json(reviews);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
