import { create } from 'zustand';

export interface IMessage {
  _id: string;
  sender: string;
  recipient: string;
  content: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'file';
  readAt?: Date;
  createdAt: Date;
}

interface ChatState {
  activeContact: any | null;
  contacts: any[];
  messages: IMessage[];
  isCounterpartyTyping: boolean;
  setContacts: (contacts: any[]) => void;
  setMessages: (messages: IMessage[]) => void;
  setActiveContact: (contact: any | null) => void;
  addMessage: (message: IMessage) => void;
  setIsCounterpartyTyping: (isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeContact: null,
  contacts: [],
  messages: [],
  isCounterpartyTyping: false,

  setContacts: (contacts) => set({ contacts }),
  setMessages: (messages) => set({ messages }),
  setActiveContact: (activeContact) => set({ activeContact, messages: [], isCounterpartyTyping: false }),
  addMessage: (message) => set((state) => {
    // Avoid duplicates
    if (state.messages.some(m => m._id === message._id)) return {};
    return { messages: [...state.messages, message] };
  }),
  setIsCounterpartyTyping: (isCounterpartyTyping) => set({ isCounterpartyTyping }),
}));
