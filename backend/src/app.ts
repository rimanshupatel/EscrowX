import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';

import { connectDB } from './config/db';
import { initSocket } from './sockets/chatSocket';

import authRoutes from './routes/authRoutes';
import jobRoutes from './routes/jobRoutes';
import escrowRoutes from './routes/escrowRoutes';
import disputeRoutes from './routes/disputeRoutes';
import chatRoutes from './routes/chatRoutes';
import reviewRoutes from './routes/reviewRoutes';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize DB Connection
connectDB();

// Initialize Realtime Socket.IO
initSocket(server);

// Middleware configurations
app.use(cors({ origin: '*' }));
app.use(helmet({
  crossOriginResourcePolicy: false, // allow serving static uploads
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static mock uploads
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/escrows', escrowRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'EscrowX Backend running smoothly' });
});

// Default error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 EscrowX Web3 Server started on port ${PORT}`);
  console.log(`==================================================`);
});
