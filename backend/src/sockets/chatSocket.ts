import { Server, Socket } from 'socket.io';
import { Message } from '../models/Message';

let ioInstance: Server | null = null;
const userSockets = new Map<string, string>(); // Maps walletAddress -> socket.id

export function initSocket(server: any) {
  ioInstance = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  ioInstance.on('connection', (socket: Socket) => {
    console.log('Socket connected:', socket.id);

    // Register wallet address on connection
    socket.on('auth:register', (data: { walletAddress: string }) => {
      if (data?.walletAddress) {
        userSockets.set(data.walletAddress, socket.id);
        socket.join(data.walletAddress);
        console.log(`Registered socket ${socket.id} for wallet ${data.walletAddress}`);
      }
    });

    // Handle real-time direct messages
    socket.on('chat:send_message', async (data: {
      senderId: string;
      senderWallet: string;
      recipientId: string;
      recipientWallet: string;
      content: string;
    }) => {
      try {
        const { senderId, senderWallet, recipientId, recipientWallet, content } = data;
        
        // Save message to database
        const message = new Message({
          sender: senderId,
          recipient: recipientId,
          content
        });
        await message.save();

        // Emit message back to sender
        socket.emit('chat:receive_message', message);

        // Emit message to recipient if online
        if (ioInstance) {
          ioInstance.to(recipientWallet).emit('chat:receive_message', message);
          
          // Send notification alert to recipient
          ioInstance.to(recipientWallet).emit('notification', {
            title: 'New Message',
            message: `${senderWallet.slice(0, 6)}...${senderWallet.slice(-4)}: ${content}`,
            link: '/chat'
          });
        }
      } catch (err) {
        console.error('Error in socket chat:send_message:', err);
      }
    });

    // Handle typing status
    socket.on('chat:typing', (data: { recipientWallet: string; senderWallet: string; isTyping: boolean }) => {
      if (ioInstance) {
        ioInstance.to(data.recipientWallet).emit('chat:typing', {
          senderWallet: data.senderWallet,
          isTyping: data.isTyping
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      for (const [wallet, id] of userSockets.entries()) {
        if (id === socket.id) {
          userSockets.delete(wallet);
          console.log(`Unregistered socket ${socket.id} for wallet ${wallet}`);
          break;
        }
      }
    });
  });
}

/**
 * Utility to emit real-time notifications to a specific user by wallet address
 */
export function emitToUser(walletAddress: string, event: string, payload: any) {
  if (ioInstance) {
    ioInstance.to(walletAddress).emit(event, payload);
  }
}
