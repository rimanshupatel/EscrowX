import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

let globalSocket: Socket | null = null;

export function useSocket() {
  const { user, token } = useAuthStore();
  const { addMessage, setIsCounterpartyTyping, activeContact } = useChatStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !user) {
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
      }
      return;
    }

    if (!globalSocket) {
      globalSocket = io('http://localhost:5000', {
        transports: ['websocket'],
      });
      
      globalSocket.on('connect', () => {
        console.log('Socket connected to backend server');
        globalSocket?.emit('auth:register', { walletAddress: user.walletAddress });
      });
    }

    socketRef.current = globalSocket;

    // Listen for direct messages
    globalSocket.on('chat:receive_message', (message: any) => {
      // Only append if the message belongs to current active chat
      if (activeContact && (message.sender === activeContact._id || message.recipient === activeContact._id)) {
        addMessage(message);
      }
    });

    // Listen for typing events
    globalSocket.on('chat:typing', (data: { senderWallet: string; isTyping: boolean }) => {
      if (activeContact && activeContact.walletAddress === data.senderWallet) {
        setIsCounterpartyTyping(data.isTyping);
      }
    });

    // Listen for live system notifications
    globalSocket.on('notification', (data: { title: string; message: string; link?: string }) => {
      console.log('Realtime Notification Received:', data);
      
      // Request browser push notification or standard toast alert
      if (Notification.permission === 'granted') {
        new Notification(data.title, { body: data.message });
      } else {
        alert(`${data.title}: ${data.message}`);
      }
    });

    // Request permissions for HTML5 push notifications
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      globalSocket?.off('chat:receive_message');
      globalSocket?.off('chat:typing');
      globalSocket?.off('notification');
    };
  }, [user, token, activeContact, addMessage, setIsCounterpartyTyping]);

  const sendSocketMessage = useCallback((recipientId: string, recipientWallet: string, content: string) => {
    if (socketRef.current && user) {
      socketRef.current.emit('chat:send_message', {
        senderId: user.id,
        senderWallet: user.walletAddress,
        recipientId,
        recipientWallet,
        content
      });
    }
  }, [user]);

  const sendTypingStatus = useCallback((recipientWallet: string, isTyping: boolean) => {
    if (socketRef.current && user) {
      socketRef.current.emit('chat:typing', {
        recipientWallet,
        senderWallet: user.walletAddress,
        isTyping
      });
    }
  }, [user]);

  return {
    socket: socketRef.current,
    sendMessage: sendSocketMessage,
    sendTyping: sendTypingStatus,
    isConnected: !!socketRef.current?.connected
  };
}
