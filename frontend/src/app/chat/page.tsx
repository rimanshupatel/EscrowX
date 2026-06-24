import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image, File, User as UserIcon, Shield, Search, Smile, Paperclip } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { useAuthStore } from '../../store/authStore';
import { useChatStore, IMessage } from '../../store/chatStore';
import { useSocket } from '../../hooks/useSocket';
import { chatService } from '../../services/api';

export default function ChatPage() {
  const { user } = useAuthStore();
  const {
    contacts,
    activeContact,
    messages,
    isCounterpartyTyping,
    setContacts,
    setMessages,
    setActiveContact,
    addMessage,
  } = useChatStore();

  const { sendMessage, sendTyping } = useSocket();

  const [typedMessage, setTypedMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chat contacts on mount
  useEffect(() => {
    async function loadContacts() {
      try {
        const data = await chatService.getContacts();
        setContacts(data);
        if (data.length > 0 && !activeContact) {
          setActiveContact(data[0]);
        }
      } catch (err) {
        console.error('Error loading chat contacts:', err);
      }
    }
    loadContacts();
  }, [setContacts, activeContact, setActiveContact]);

  // Load message history when active contact changes
  useEffect(() => {
    if (!activeContact) return;
    async function loadMessages() {
      try {
        const history = await chatService.getMessages(activeContact._id);
        setMessages(history);
      } catch (err) {
        console.error('Error loading messages:', err);
      }
    }
    loadMessages();
  }, [activeContact, setMessages]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator trigger
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTypedMessage(e.target.value);
    if (activeContact) {
      sendTyping(activeContact.walletAddress, e.target.value.length > 0);
    }
  };

  // Submit direct message
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeContact || !user) return;

    // Send via socket
    sendMessage(activeContact._id, activeContact.walletAddress, typedMessage);
    
    // Optimistically add to store
    addMessage({
      _id: Math.random().toString(),
      sender: user.id,
      recipient: activeContact._id,
      content: typedMessage,
      createdAt: new Date(),
    });

    setTypedMessage('');
    sendTyping(activeContact.walletAddress, false);
  };

  // Handle file uploads
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeContact) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('recipientId', activeContact._id);
    formData.append('attachmentType', file.type.startsWith('image/') ? 'image' : 'file');

    setUploading(true);
    try {
      const savedMsg = await chatService.sendAttachment(formData);
      addMessage(savedMsg);
      
      // Also broadcast the message event through the socket
      sendMessage(activeContact._id, activeContact.walletAddress, `Sent an attachment: ${file.name}`);
    } catch (err) {
      console.error('Error uploading file attachment:', err);
    }
    setUploading(false);
  };

  // Filter contact list
  const filteredContacts = contacts.filter((c) =>
    c.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.walletAddress?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout title="Messaging Board" showNewEscrow={false}>
      <div className="h-[calc(100vh_-_160px)] bg-white border border-[#E5E7EB] rounded-[24px] shadow-sm overflow-hidden grid grid-cols-[300px_1fr]">
        
        {/* Left pane: Contact list */}
        <div className="border-r border-[#E5E7EB] flex flex-col bg-[#FAFAFA]">
          {/* Search bar */}
          <div className="p-4 border-b border-[#E5E7EB]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-[#E5E7EB] rounded-[12px] text-xs bg-white text-[#0F172A] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredContacts.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-8">No active conversations</p>
            ) : (
              filteredContacts.map((contact) => {
                const isActive = activeContact?._id === contact._id;
                return (
                  <button
                    key={contact._id}
                    onClick={() => setActiveContact(contact)}
                    className={`w-full flex items-center gap-3 p-3 rounded-[16px] text-left transition-all ${
                      isActive ? 'bg-[#7C3AED]/10 text-[#7C3AED]' : 'hover:bg-gray-100 text-[#0F172A]'
                    }`}
                  >
                    {contact.profilePhoto ? (
                      <img src={contact.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#E5E7EB] flex items-center justify-center text-gray-500">
                        <UserIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold truncate">{contact.username}</p>
                        <span className="text-[10px] uppercase font-bold text-gray-400">{contact.role.toLowerCase()}</span>
                      </div>
                      <p className="text-[10px] font-mono text-gray-400 truncate mt-0.5">{contact.walletAddress}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right pane: Messages board */}
        {activeContact ? (
          <div className="flex flex-col bg-white">
            {/* Header info */}
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAFAFA]">
              <div className="flex items-center gap-3">
                {activeContact.profilePhoto ? (
                  <img src={activeContact.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#E5E7EB] flex items-center justify-center text-gray-500">
                    <UserIcon className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A]">{activeContact.username}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-gray-400">{activeContact.walletAddress}</span>
                    <span className="text-[10px] font-semibold bg-[#7C3AED]/10 text-[#7C3AED] px-1.5 py-0.5 rounded-[4px] uppercase">
                      Trust Score {activeContact.trustScore}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message history */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.sender === user?.id;
                return (
                  <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-[18px] px-4 py-3 text-xs leading-relaxed shadow-sm ${
                      isMe 
                        ? 'bg-[#7C3AED] text-white rounded-br-none' 
                        : 'bg-[#FAFAFA] border border-[#E5E7EB] text-[#0F172A] rounded-bl-none'
                    }`}>
                      {msg.content}
                      {msg.attachmentUrl && (
                        <div className="mt-2 border-t border-white/10 pt-2 flex items-center gap-2">
                          {msg.attachmentType === 'image' ? (
                            <img src={msg.attachmentUrl} alt="uploaded" className="rounded-lg max-w-full max-h-40 object-cover" />
                          ) : (
                            <a 
                              href={msg.attachmentUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="flex items-center gap-2 text-white underline"
                            >
                              <File className="w-4 h-4 shrink-0" />
                              View Attachment
                            </a>
                          )}
                        </div>
                      )}
                      <p className={`text-[9px] mt-1.5 text-right ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer actions / input */}
            <div className="p-4 border-t border-[#E5E7EB] bg-[#FAFAFA]">
              {isCounterpartyTyping && (
                <p className="text-[10px] text-gray-400 italic mb-2">Counterparty is typing...</p>
              )}
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-[12px] bg-white border border-[#E5E7EB] hover:bg-gray-50 text-gray-400 transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={typedMessage}
                  onChange={handleMessageChange}
                  className="flex-1 px-4 py-2.5 border border-[#E5E7EB] rounded-[12px] text-xs bg-white text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-[12px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#7C3AED]/10 flex items-center justify-center mb-4 text-[#7C3AED]">
              <Smile className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-[#0F172A] mb-1">Welcome to Messenger</h3>
            <p className="text-xs text-gray-400 max-w-[280px]">Select a counterparty from the sidebar to chat in real-time.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
