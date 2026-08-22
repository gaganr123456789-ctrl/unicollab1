import React, { useState, useRef, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { io } from 'socket.io-client';
import { 
  Search, 
  Plus, 
  Phone, 
  Video, 
  Info, 
  Paperclip, 
  Image as ImageIcon, 
  Send, 
  CheckCheck,
  ArrowLeft
} from 'lucide-react';

export default function MessagesPage({ activeChatPartner, userProfile }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeChatId, setActiveChatId] = useState(1);
  const [inputMessage, setInputMessage] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef(null);

  const initialConversations = [
    {
      id: 1,
      name: 'Dr. Ananya Sharma',
      role: 'Active now',
      avatarBg: '#EFF6FF',
      avatarColor: '#2563EB',
      initials: 'AS',
      type: 'direct',
      lastMsg: 'The project proposal looks great! Should we finalize the tech stack tonight?',
      time: '10:23 AM',
      unread: 0,
      messages: [
        { id: 1, sender: 'user', text: 'Hey Ananya! Have you had a chance to look at the team formation guidelines?', time: '10:15 AM' },
        { id: 2, sender: 'other', text: 'Hey! Yes, I just finished reading them. They seem pretty straightforward.', time: '10:16 AM' },
        { id: 3, sender: 'user', text: 'Awesome. I was thinking we could reach out to Alex from the design department. He has a great portfolio.', time: '10:20 AM' },
        { id: 4, sender: 'other', text: "That's a fantastic idea. I've seen his work on the library project. Let's do it!", time: '10:22 AM' },
        { id: 5, sender: 'other', text: 'The project proposal looks great! Should we finalize the tech stack tonight?', time: '10:23 AM' }
      ]
    },
    {
      id: 2,
      name: 'Hackathon Team Alpha',
      role: '4 Members online',
      avatarBg: '#F3E8FF',
      avatarColor: '#7C3AED',
      initials: 'HA',
      type: 'team',
      lastMsg: 'Alex: Just pushed the latest Figma designs to the workspace.',
      time: '09:45 AM',
      unread: 2,
      messages: [
        { id: 1, sender: 'other', text: 'Alex: Just pushed the latest Figma designs to the workspace.', time: '09:45 AM' }
      ]
    },
    {
      id: 3,
      name: 'Dr. Michael Chen',
      role: 'Offline',
      avatarBg: '#ECFDF5',
      avatarColor: '#059669',
      initials: 'MC',
      type: 'mentor',
      lastMsg: 'I have reviewed your methodology section. Please see my inline comments.',
      time: 'Yesterday',
      unread: 0,
      messages: [
        { id: 1, sender: 'other', text: 'I have reviewed your methodology section. Please see my inline comments.', time: 'Yesterday' }
      ]
    }
  ];

  const [conversations, setConversations] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('unicollab_conversations');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return initialConversations;
  });

  // Save conversations to localStorage on update
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('unicollab_conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  const [isSending, setIsSending] = useState(false);

  // Maintain deduplication tracking of message IDs
  const seenMessageIds = useRef(new Set());

  // Deduplicated Backend Conversation Lookup/Creation when activeChatPartner is set
  useEffect(() => {
    if (!activeChatPartner || !activeChatPartner.name) return;

    const initConversation = async () => {
      const partnerName = activeChatPartner.name;
      
      // Check local conversations first
      const existingLocal = conversations.find(c => c.name.toLowerCase() === partnerName.toLowerCase());
      if (existingLocal) {
        setActiveChatId(existingLocal.id);
        setMobileShowChat(true);
        return;
      }

      // Query backend for deduplicated conversation by pairKey
      try {
        const res = await apiClient.getOrCreateConversation(partnerName);
        if (res.success && res.conversation) {
          const convObj = res.conversation;
          const newChatId = convObj.id || `conv_${Date.now()}`;

          const formattedMessages = Array.isArray(res.messages) && res.messages.length > 0
            ? res.messages.map(m => ({
                id: m.id,
                sender: m.senderId === 'usr_demo' ? 'user' : 'other',
                text: m.content || m.text,
                time: new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }))
            : [{ id: `init_${Date.now()}`, sender: 'other', text: `Hi! I'm ${partnerName}. Excited to connect on UniCollab!`, time: 'Just now' }];

          // Seed seenMessageIds
          formattedMessages.forEach(m => seenMessageIds.current.add(m.id));

          const newConv = {
            id: newChatId,
            pairKey: convObj.pairKey || partnerName,
            name: partnerName,
            role: activeChatPartner.role || 'Active now',
            avatarBg: activeChatPartner.avatarBg || '#EFF6FF',
            avatarColor: activeChatPartner.avatarColor || '#2563EB',
            initials: activeChatPartner.initials || partnerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
            type: 'direct',
            lastMsg: formattedMessages[formattedMessages.length - 1]?.text || 'Chat initiated.',
            time: 'Just now',
            unread: 0,
            messages: formattedMessages
          };

          setConversations(prev => {
            if (prev.some(c => c.name.toLowerCase() === partnerName.toLowerCase())) return prev;
            return [newConv, ...prev];
          });
          setActiveChatId(newChatId);
          setMobileShowChat(true);
          return;
        }
      } catch (err) {
        console.warn('Backend conversation init warning:', err);
      }

      // Local fallback
      const newChatId = `conv_${Date.now()}`;
      const newConv = {
        id: newChatId,
        name: partnerName,
        role: activeChatPartner.role || 'Active now',
        avatarBg: activeChatPartner.avatarBg || '#EFF6FF',
        avatarColor: activeChatPartner.avatarColor || '#2563EB',
        initials: activeChatPartner.initials || partnerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        type: 'direct',
        lastMsg: 'Chat initiated.',
        time: 'Just now',
        unread: 0,
        messages: [{ id: `init_${Date.now()}`, sender: 'other', text: `Hi! I'm ${partnerName}. Excited to connect on UniCollab!`, time: 'Just now' }]
      };
      setConversations(prev => [newConv, ...prev]);
      setActiveChatId(newChatId);
      setMobileShowChat(true);
    };

    initConversation();
  }, [activeChatPartner]);

  // Socket.io & 3s Auto-Poll Sync Engine with Deduplication Safety
  useEffect(() => {
    let socket = null;
    let pollInterval = null;

    try {
      const socketUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
      socket = io(socketUrl, { transports: ['websocket', 'polling'] });

      socket.on('message:new', (incomingMsg) => {
        if (!incomingMsg || !incomingMsg.text || seenMessageIds.current.has(incomingMsg.id)) return;

        seenMessageIds.current.add(incomingMsg.id);

        setConversations(prev => prev.map(c => {
          if (c.id === incomingMsg.conversationId || c.name.toLowerCase() === (incomingMsg.senderName || '').toLowerCase()) {
            return {
              ...c,
              lastMsg: incomingMsg.text,
              time: 'Just now',
              messages: [...c.messages, {
                id: incomingMsg.id,
                sender: incomingMsg.senderId === 'usr_demo' ? 'user' : 'other',
                text: incomingMsg.text,
                time: incomingMsg.time || 'Just now'
              }]
            };
          }
          return c;
        }));
      });
    } catch (e) {
      console.warn('Socket connection error:', e);
    }

    // Auto-Poll fallback every 3 seconds for serverless Vercel environment
    pollInterval = setInterval(async () => {
      if (!activeChatId) return;
      try {
        const res = await apiClient.getMessages(activeChatId);
        if (res.success && Array.isArray(res.messages)) {
          const freshMessages = res.messages.filter(m => !seenMessageIds.current.has(m.id));
          if (freshMessages.length > 0) {
            freshMessages.forEach(m => seenMessageIds.current.add(m.id));
            setConversations(prev => prev.map(c => {
              if (c.id === activeChatId) {
                const formatted = freshMessages.map(m => ({
                  id: m.id,
                  sender: m.senderId === 'usr_demo' ? 'user' : 'other',
                  text: m.text || m.content,
                  time: m.time || 'Just now'
                }));
                return {
                  ...c,
                  lastMsg: formatted[formatted.length - 1].text,
                  time: 'Just now',
                  messages: [...c.messages, ...formatted]
                };
              }
              return c;
            }));
          }
        }
      } catch (err) {}
    }, 3000);

    return () => {
      if (socket) {
        socket.off('message:new');
        socket.disconnect();
      }
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [activeChatId]);

  const activeChat = conversations.find(c => c.id === activeChatId) || conversations[0];

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    seenMessageIds.current.add(msgId);

    const newMsg = {
      id: msgId,
      sender: 'user',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversations(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          lastMsg: messageText,
          time: 'Just now',
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    }));

    try {
      await apiClient.sendMessage(messageText, activeChatId, activeChat?.name);
    } catch (e) {
      console.warn('Backend message save warning:', e);
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter(c => {
    if (activeFilter === 'Direct') return c.type === 'direct';
    if (activeFilter === 'Team') return c.type === 'team';
    if (activeFilter === 'Mentor') return c.type === 'mentor';
    return true;
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatId, activeChat.messages]);

  return (
    <div className="page-container messages-page-container animate-fade-in">
      <div className="messages-layout-box">
        {/* Left Conversations Sidebar */}
        <aside className="conv-sidebar">
          <div className="conv-header">
            <h3>Messages</h3>
            <button className="add-chat-btn" onClick={() => alert('Starting a new message thread...')}>
              <Plus size={18} />
            </button>
          </div>

          <div className="input-with-icon search-conv mt-3">
            <Search size={15} />
            <input type="text" placeholder="Search conversations..." />
          </div>

          {/* Filter Pills */}
          <div className="conv-filter-pills mt-3">
            {['All', 'Direct', 'Team', 'Mentor'].map((f) => (
              <button 
                key={f}
                className={`conv-pill ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Conversations Stack */}
          <div className="conv-list-stack mt-4">
            {filteredConversations.map((c) => (
              <div 
                key={c.id}
                className={`conv-item ${c.id === activeChatId ? 'active' : ''}`}
                onClick={() => {
                  setActiveChatId(c.id);
                  setMobileShowChat(true);
                }}
              >
                <div className="conv-avatar-box">
                  <div className="conv-avatar" style={{ background: c.avatarBg, color: c.avatarColor }}>
                    {c.initials}
                  </div>
                  {c.role.includes('Active') && <span className="online-indicator"></span>}
                </div>

                <div className="conv-info">
                  <div className="conv-name-row">
                    <span className="conv-name">{c.name}</span>
                    <span className="conv-time">{c.time}</span>
                  </div>
                  <p className="conv-preview">{c.lastMsg}</p>
                </div>

                {c.unread > 0 && <span className="unread-badge">{c.unread}</span>}
              </div>
            ))}
          </div>
        </aside>

        {/* Main Chat Thread Box */}
        <main className={`chat-window-main ${mobileShowChat ? 'mobile-visible' : ''}`}>
          {/* Header */}
          <div className="chat-header">
            <div className="chat-user-info flex align-center gap-2">
              <button 
                className="chat-back-btn-mobile" 
                onClick={() => setMobileShowChat(false)}
                title="Back to Conversations"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="conv-avatar" style={{ background: activeChat.avatarBg, color: activeChat.avatarColor }}>
                {activeChat.initials}
              </div>
              <div>
                <h4>{activeChat.name}</h4>
                <span className="status-text">{activeChat.role}</span>
              </div>
            </div>

            <div className="chat-header-actions">
              <button className="icon-action-btn" title="Voice Call" onClick={() => console.log('Initiating call')}>
                <Phone size={18} />
              </button>
              <button className="icon-action-btn" title="Video Session" onClick={() => console.log('Initiating video')}>
                <Video size={18} />
              </button>
              <button className="icon-action-btn" title="Chat Details" onClick={() => console.log('Details')}>
                <Info size={18} />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="chat-body-stream">
            <div className="date-divider">
              <span>TODAY, OCTOBER 24</span>
            </div>

            {activeChat.messages.map((m) => (
              <div key={m.id} className={`msg-row ${m.sender === 'user' ? 'user' : 'other'}`}>
                {m.sender !== 'user' && (
                  <div className="conv-avatar sm" style={{ background: activeChat.avatarBg, color: activeChat.avatarColor }}>
                    {activeChat.initials}
                  </div>
                )}
                <div className="msg-bubble-box">
                  <div className="msg-bubble-text">{m.text}</div>
                  <div className="msg-meta-row">
                    <span className="msg-time">{m.time}</span>
                    {m.sender === 'user' && <CheckCheck size={14} className="text-blue" />}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Footer */}
          <div className="chat-footer-input-bar">
            <button className="footer-icon-btn" title="Attach file" type="button">
              <Paperclip size={18} />
            </button>
            <button className="footer-icon-btn" title="Attach image" type="button">
              <ImageIcon size={18} />
            </button>

            <input 
              type="text" 
              placeholder="Type a message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
            />

            <button className="btn-send-message" onClick={handleSendMessage} disabled={isSending}>
              <Send size={16} />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
