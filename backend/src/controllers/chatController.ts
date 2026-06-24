import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Message } from '../models/Message';
import { User } from '../models/User';

// Get lists of all users we have conversed with (Active chat contacts)
export async function getChatContacts(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    // Find all unique senders or recipients associated with user
    const sentTo = await Message.distinct('recipient', { sender: userId });
    const receivedFrom = await Message.distinct('sender', { recipient: userId });

    const contactIds = Array.from(new Set([...sentTo.map(id => id.toString()), ...receivedFrom.map(id => id.toString())]));
    
    const contacts = await User.find({ _id: { $in: contactIds } })
      .select('username walletAddress role profilePhoto trustScore badge');

    return res.json(contacts);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Get message history with a specific counterparty
export async function getMessages(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { counterpartyId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: counterpartyId },
        { sender: counterpartyId, recipient: userId }
      ]
    }).sort({ createdAt: 1 });

    // Mark received messages as read
    await Message.updateMany(
      { sender: counterpartyId, recipient: userId, readAt: { $exists: false } },
      { readAt: new Date() }
    );

    return res.json(messages);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Upload file/attachment API handler
export async function sendAttachment(req: AuthRequest, res: Response) {
  try {
    const senderId = req.user?.userId;
    const { recipientId, content, attachmentType } = req.body;
    const file = req.file;

    if (!recipientId || !file) {
      return res.status(400).json({ error: 'Recipient and file attachment are required' });
    }

    // In production we upload to Cloudinary:
    // const result = await cloudinary.uploader.upload(file.path);
    // const attachmentUrl = result.secure_url;
    // For this backend, we mock the uploaded file URL:
    const attachmentUrl = `/uploads/${file.filename}`;

    const message = new Message({
      sender: senderId,
      recipient: recipientId,
      content: content || `Sent an attachment`,
      attachmentUrl,
      attachmentType: attachmentType || 'file',
    });
    await message.save();

    return res.status(201).json(message);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
