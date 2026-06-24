import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { verifyToken } from '../middleware/auth';
import { getChatContacts, getMessages, sendAttachment } from '../controllers/chatController';

const router = Router();

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.get('/contacts', verifyToken, getChatContacts);
router.get('/messages/:counterpartyId', verifyToken, getMessages);
router.post('/attachment', verifyToken, upload.single('file'), sendAttachment);

export default router;
