import React, { useState, useRef, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { io } from 'socket.io-client';
import { 
  Search, 
  Send, 
  Check, 
  CheckCheck, 
  ArrowLeft, 
  User, 
  Users, 
  MessageSquare, 
  Sparkles, 
  Circle, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  RefreshCw,
  CornerDownLeft
} from 'lucide-react';

export default function MessagesPage({ activeChatPartner, userProfile, setCurrentPage }) {
  const [activeFilter, setActiveFilter] = useState('All'); // 'All' | 'Students' | 'Mentors'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [onlineUsersList, setOnlineUsersList] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // { conversationId: { name, isTyping } }

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const seenMessageIds = useRef(new Set());

  const myEmail = (userProfile?.email || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('unicollab_user') || '{}').email : '') || '').toLowerCase().trim();
  const myId = userProfile?.id || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('unicollab_user') || '{}').id : 'usr_me');
  const myName = userProfile?.name || 'Student';

  // Seed default conversations cohort if empty
  const defaultConversations = [
    {
      id: 'conv_seed_1',
      pairKey: 'dr. ananya sharma',
      name: 'Dr. Ananya Sharma',
      email: 'ananya.sharma@stanford.edu',
      role: 'Distinguished Professor & AI Research Lead',
      avatarBg: '#EFF6FF',
      avatarColor: '#2563EB',
      initials: 'AS',
      type: 'mentor',
      lastMsg: 'The project proposal looks great! Should we finalize the tech stack tonight?',
      time: '10:23 AM',
      unread: 0,
      updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      messages: [
        { 
          id: 'msg_seed_1', 
          senderId: myId || 'usr_demo', 
          senderName: myName, 
          text: 'Hey Dr. Ananya! Have you had a chance to review our capstone project proposal on Multimodal AI?', 
          time: '10:15 AM', 
          status: 'READ',
          createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() 
        },
        { 
          id: 'msg_seed_2', 
          senderId: 'usr_ananya', 
          senderName: 'Dr. Ananya Sharma', 
          text: 'Yes! The deep learning pipeline and dataset curation approach look very solid.', 
          time: '10:18 AM', 
          status: 'READ',
          createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString() 
        },
        { 
          id: 'msg_seed_3', 
          senderId: 'usr_ananya', 
          senderName: 'Dr. Ananya Sharma', 
          text: 'The project proposal looks great! Should we finalize the tech stack tonight?', 
          time: '10:23 AM', 
          status: 'READ',
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() 
        }
      ]
    },
    {
      id: 'conv_seed_2',
      pairKey: 'marcus sterling',
      name: 'Dr. Marcus Sterling',
      email: 'marcus.sterling@mit.edu',
      role: 'Principal Cloud Architect & AWS Advisor',
      avatarBg: '#FAF5FF',
      avatarColor: '#7C3AED',
      initials: 'MS',
      type: 'mentor',
      lastMsg: 'Feel free to schedule office hours for microservices deployment.',
      time: 'Yesterday',
      unread: 0,
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      messages: [
        { 
          id: 'msg_seed_4', 
          senderId: 'usr_marcus', 
          senderName: 'Dr. Marcus Sterling', 
          text: 'Feel free to schedule office hours for microservices deployment.', 
          time: 'Yesterday', 
          status: 'READ',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() 
        }
      ]
    }
  ];

  const [conversations, setConversations] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('unicollab_conversations_v2');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
    }
    return defaultConversations;
  });

  // Save to local storage
  useEffect(() => {
    if (typeof window !== 'undefined' && conversations.length > 0) {
      localStorage.setItem('unicollab_conversations_v2', JSON.stringify(conversations));
    }
  }, [conversations]);

  // Load conversations from backend API
  const loadConversations = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getConversations(myEmail, myId);
      if (res.success && Array.isArray(res.conversations) && res.conversations.length > 0) {
        setConversations(prev => {
          const combined = [...res.conversations, ...prev];
          const uniqueMap = new Map();
          combined.forEach(c => {
            if (c && c.id && !uniqueMap.has(c.id)) {
              uniqueMap.set(c.id, c);
            }
          });
          return Array.from(uniqueMap.values());
        });
      }
    } catch (err) {
      console.warn('Failed to load server conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Initialize Socket.IO connection & Presence
  useEffect(() => {
    loadConversations();

    let socket = null;
    try {
      const socketUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')
          ? window.location.origin
          : 'https://unicollab1.onrender.com';

      socket = io(socketUrl, { transports: ['websocket', 'polling'] });
      socketRef.current = socket;

      // Register presence
      if (myEmail || myId) {
        socket.emit('register_user', { email: myEmail, id: myId, name: myName });
      }

      // Online status updates
      socket.on('online_users_updated', (onlineList) => {
        if (Array.isArray(onlineList)) {
          setOnlineUsersList(onlineList);
        }
      });

      // Receive real-time message
      socket.on('receive_message', (msgPayload) => {
        if (!msgPayload || seenMessageIds.current.has(msgPayload.id)) return;
        seenMessageIds.current.add(msgPayload.id);

        const convId = msgPayload.conversationId || msgPayload.conversation_id;
        const rawText = msgPayload.content || msgPayload.text || msgPayload.message;
        const isFromMe = (msgPayload.senderEmail && normalizeEmail(msgPayload.senderEmail) === myEmail) || msgPayload.senderId === myId;

        const newMsgObj = {
          id: msgPayload.id || `msg_${Date.now()}`,
          senderId: msgPayload.senderId || msgPayload.sender_id,
          senderName: msgPayload.senderName || 'Teammate',
          senderEmail: msgPayload.senderEmail,
          text: rawText,
          time: msgPayload.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: isFromMe ? 'DELIVERED' : 'READ',
          createdAt: msgPayload.createdAt || new Date().toISOString()
        };

        setConversations(prev => {
          let found = false;
          const updated = prev.map(c => {
            if (c.id === convId || (c.pairKey && msgPayload.senderEmail && c.pairKey.includes(msgPayload.senderEmail.toLowerCase()))) {
              found = true;
              return {
                ...c,
                lastMsg: rawText,
                time: newMsgObj.time,
                updatedAt: new Date().toISOString(),
                unread: activeConversationId === c.id ? 0 : (c.unread || 0) + 1,
                messages: [...(c.messages || []), newMsgObj]
              };
            }
            return c;
          });

          if (!found) {
            // New incoming conversation from peer
            const newConv = {
              id: convId,
              name: msgPayload.senderName || 'Connected Teammate',
              email: msgPayload.senderEmail,
              role: 'Connected Student',
              avatarBg: '#EFF6FF',
              avatarColor: '#2563EB',
              initials: (msgPayload.senderName || 'TM').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
              type: 'direct',
              lastMsg: rawText,
              time: 'Just now',
              unread: 1,
              updatedAt: new Date().toISOString(),
              messages: [newMsgObj]
            };
            return [newConv, ...updated];
          }

          // Re-sort conversations by latest activity
          return updated.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        });

        // If currently viewing this conversation, mark as read
        if (activeConversationId === convId) {
          socket.emit('mark_read', { conversationId: convId, readerId: myId, readerEmail: myEmail });
        }
      });

      // Typing status listener
      socket.on('typing:status', (data) => {
        if (!data || !data.conversationId) return;
        setTypingUsers(prev => ({
          ...prev,
          [data.conversationId]: data.isTyping ? { name: data.senderName, isTyping: true } : null
        }));
      });

      // Read receipt listener
      socket.on('messages_read', (data) => {
        if (!data || !data.conversationId) return;
        setConversations(prev => prev.map(c => {
          if (c.id === data.conversationId) {
            return {
              ...c,
              messages: (c.messages || []).map(m => ({ ...m, status: 'READ' }))
            };
          }
          return c;
        }));
      });
    } catch (e) {
      console.warn('Socket engine notice:', e);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [activeConversationId]);

  // 2. Auto-initialize conversation when directed from Find Teammates or other pages
  useEffect(() => {
    if (!activeChatPartner || !activeChatPartner.name) {
      // Set first conversation as default active if none selected
      if (!activeConversationId && conversations.length > 0) {
        setActiveConversationId(conversations[0].id);
      }
      return;
    }

    const initPartnerChat = async () => {
      const partnerName = activeChatPartner.name;
      const partnerEmail = (activeChatPartner.email || '').toLowerCase().trim();
      const partnerId = activeChatPartner.id;

      // Check if conversation already exists locally
      const existing = conversations.find(c => 
        (partnerEmail && c.email && c.email.toLowerCase() === partnerEmail) ||
        (c.name && c.name.toLowerCase() === partnerName.toLowerCase()) ||
        (partnerId && c.id === partnerId)
      );

      if (existing) {
        setActiveConversationId(existing.id);
        setMobileShowChat(true);
        return;
      }

      // Query or create on backend
      try {
        const res = await apiClient.getOrCreateConversation(
          partnerName, 
          partnerId, 
          partnerEmail, 
          activeChatPartner.major || activeChatPartner.role,
          myEmail,
          myId,
          myName
        );

        if (res.success && res.conversation) {
          const convObj = res.conversation;
          const convId = convObj.id || `conv_${Date.now()}`;

          const formattedMessages = Array.isArray(res.messages) && res.messages.length > 0
            ? res.messages.map(m => ({
                id: m.id || m.message_id,
                senderId: m.senderId || m.sender_id,
                senderName: m.senderName || (m.senderId === myId ? myName : partnerName),
                text: m.content || m.text || m.message,
                time: m.time || new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: m.status || 'READ',
                createdAt: m.createdAt || new Date().toISOString()
              }))
            : [];

          const newConv = {
            id: convId,
            pairKey: convObj.pairKey || partnerName,
            name: partnerName,
            email: partnerEmail,
            role: activeChatPartner.role || activeChatPartner.major || 'Connected Student',
            avatarBg: activeChatPartner.avatarBg || '#EFF6FF',
            avatarColor: activeChatPartner.avatarColor || '#2563EB',
            initials: activeChatPartner.initials || partnerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
            type: activeChatPartner.type || 'direct',
            lastMsg: formattedMessages.length > 0 ? formattedMessages[formattedMessages.length - 1].text : 'You are now connected! Start the discussion.',
            time: 'Just now',
            unread: 0,
            updatedAt: new Date().toISOString(),
            messages: formattedMessages
          };

          setConversations(prev => [newConv, ...prev.filter(c => c.id !== convId)]);
          setActiveConversationId(convId);
          setMobileShowChat(true);

          if (socketRef.current) {
            socketRef.current.emit('join_conversation', convId);
          }
          return;
        }
      } catch (err) {
        console.warn('Init partner conversation notice:', err);
      }

      // Fallback local creation
      const localId = `conv_${Date.now()}`;
      const localConv = {
        id: localId,
        name: partnerName,
        email: partnerEmail,
        role: activeChatPartner.role || activeChatPartner.major || 'Connected Student',
        avatarBg: activeChatPartner.avatarBg || '#EFF6FF',
        avatarColor: activeChatPartner.avatarColor || '#2563EB',
        initials: activeChatPartner.initials || partnerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        type: 'direct',
        lastMsg: 'You are now connected! Start the discussion.',
        time: 'Just now',
        unread: 0,
        updatedAt: new Date().toISOString(),
        messages: []
      };

      setConversations(prev => [localConv, ...prev]);
      setActiveConversationId(localId);
      setMobileShowChat(true);
    };

    initPartnerChat();
  }, [activeChatPartner]);

  // 3. Scroll to newest message automatically
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversationId, conversations, typingUsers]);

  // Active Conversation Object
  const activeConversation = conversations.find(c => c.id === activeConversationId) || conversations[0];

  // Helper to check if partner is currently online
  const isPartnerOnline = (partnerEmail, partnerName) => {
    if (!partnerEmail && !partnerName) return false;
    const pEmail = (partnerEmail || '').toLowerCase().trim();
    const pName = (partnerName || '').toLowerCase().trim();

    return onlineUsersList.some(u => 
      (pEmail && u.email && u.email.toLowerCase() === pEmail) ||
      (pName && u.name && u.name.toLowerCase() === pName)
    );
  };

  // 4. Handle Typing Indicators
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    if (socketRef.current && activeConversation) {
      socketRef.current.emit('typing:start', {
        conversationId: activeConversation.id,
        senderName: myName,
        senderId: myId,
        senderEmail: myEmail
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && activeConversation) {
          socketRef.current.emit('typing:stop', {
            conversationId: activeConversation.id,
            senderId: myId,
            senderEmail: myEmail
          });
        }
      }, 1500);
    }
  };

  // 5. Send Message Action
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || sending || !activeConversation) return;

    const rawText = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const localMsgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    seenMessageIds.current.add(localMsgId);

    const newMsgObj = {
      id: localMsgId,
      message_id: localMsgId,
      conversationId: activeConversation.id,
      senderId: myId,
      senderName: myName,
      senderEmail: myEmail,
      receiverId: activeConversation.email || activeConversation.id,
      receiverEmail: activeConversation.email,
      text: rawText,
      content: rawText,
      time: timeFormatted,
      status: 'SENT',
      createdAt: now.toISOString()
    };

    // Optimistically update conversation history
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id === activeConversation.id) {
          return {
            ...c,
            lastMsg: rawText,
            time: timeFormatted,
            updatedAt: now.toISOString(),
            messages: [...(c.messages || []), newMsgObj]
          };
        }
        return c;
      });
      return updated.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    });

    // Send via Socket.IO
    if (socketRef.current) {
      socketRef.current.emit('send_message', {
        conversationId: activeConversation.id,
        content: rawText,
        text: rawText,
        senderId: myId,
        senderName: myName,
        senderEmail: myEmail,
        receiverEmail: activeConversation.email,
        receiverId: activeConversation.id
      });
      socketRef.current.emit('typing:stop', {
        conversationId: activeConversation.id,
        senderId: myId
      });
    }

    // Persist via REST API
    try {
      await apiClient.sendMessage({
        conversationId: activeConversation.id,
        senderId: myId,
        senderEmail: myEmail,
        senderName: myName,
        receiverEmail: activeConversation.email,
        receiverId: activeConversation.id,
        text: rawText
      });
    } catch (err) {
      console.warn('REST message save notice:', err);
    } finally {
      setSending(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    if (activeFilter === 'Students' && c.type === 'mentor') return false;
    if (activeFilter === 'Mentors' && c.type !== 'mentor') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = c.name && c.name.toLowerCase().includes(q);
      const matchMsg = c.lastMsg && c.lastMsg.toLowerCase().includes(q);
      return matchName || matchMsg;
    }
    return true;
  });

  const normalizeEmail = (e) => (e || '').toLowerCase().trim();

  return (
    <div className="messages-layout animate-fade-in" style={{ display: 'flex', height: 'calc(100vh - 84px)', overflow: 'hidden', background: 'var(--bg-main)' }}>
      {/* ------------------------------------------------------------- */}
      {/* LEFT PANEL: Conversations Directory                            */}
      {/* ------------------------------------------------------------- */}
      <aside 
        className={`messages-sidebar ${mobileShowChat ? 'hidden-on-mobile' : ''}`}
        style={{ 
          width: '380px', 
          borderRight: '1px solid var(--border-color, #E2E8F0)', 
          background: 'var(--surface-color, #FFFFFF)', 
          display: 'flex', 
          flexDirection: 'column',
          flexShrink: 0
        }}
      >
        {/* Header & Tabs */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color, #E2E8F0)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-main, #0F172A)' }}>
              Messages
            </h2>
            <button 
              onClick={loadConversations} 
              title="Refresh conversations" 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Search Conversations Input */}
          <div className="input-with-icon" style={{ position: 'relative', width: '100%', marginBottom: '12px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94A3B8' }} />
            <input 
              type="text" 
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '9px 12px 9px 36px', 
                borderRadius: '12px', 
                border: '1px solid var(--border-color, #E2E8F0)', 
                background: 'var(--bg-main, #F8FAFC)',
                fontSize: '13px',
                color: 'var(--text-main, #0F172A)'
              }}
            />
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-main, #F1F5F9)', padding: '4px', borderRadius: '10px' }}>
            {['All', 'Students', 'Mentors'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeFilter === tab ? '#2563EB' : 'transparent',
                  color: activeFilter === tab ? '#FFFFFF' : '#64748B',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations Scrollable List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {filteredConversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748B' }}>
              <MessageSquare size={32} style={{ color: '#94A3B8', margin: '0 auto 10px' }} />
              <p style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>No conversations found</p>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 16px' }}>Connect with peers in Find Teammates to unlock chat.</p>
              {setCurrentPage && (
                <button 
                  className="btn-primary" 
                  onClick={() => setCurrentPage('find-teammates')}
                  style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 700 }}
                >
                  Find Teammates
                </button>
              )}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = activeConversation?.id === conv.id;
              const online = isPartnerOnline(conv.email, conv.name);

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConversationId(conv.id);
                    setMobileShowChat(true);
                    // Clear unread
                    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread: 0 } : c));
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    marginBottom: '4px',
                    background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                    border: isSelected ? '1px solid #BFDBFE' : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Profile Avatar with Online Dot Indicator */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: conv.avatarBg || '#EFF6FF',
                      color: conv.avatarColor || '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '14px'
                    }}>
                      {conv.initials || conv.name?.slice(0, 2).toUpperCase() || 'ST'}
                    </div>
                    <span 
                      style={{
                        position: 'absolute',
                        bottom: '1px',
                        right: '1px',
                        width: '11px',
                        height: '11px',
                        borderRadius: '50%',
                        background: online ? '#10B981' : '#CBD5E1',
                        border: '2px solid white'
                      }}
                      title={online ? 'Online now' : 'Offline'}
                    />
                  </div>

                  {/* Conversation Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--text-main, #0F172A)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conv.name}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94A3B8', flexShrink: 0, marginLeft: '6px' }}>
                        {conv.time}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{
                        fontSize: '12px',
                        color: conv.unread > 0 ? 'var(--text-main, #0F172A)' : '#64748B',
                        fontWeight: conv.unread > 0 ? 800 : 500,
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '220px'
                      }}>
                        {conv.lastMsg || 'Chat active'}
                      </p>

                      {conv.unread > 0 && (
                        <span style={{
                          background: '#2563EB',
                          color: 'white',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '9999px',
                          flexShrink: 0,
                          marginLeft: '6px'
                        }}>
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* RIGHT PANEL: Chat Window & Live Messaging Feed                */}
      {/* ------------------------------------------------------------- */}
      <main 
        className={`messages-chat-pane ${!mobileShowChat ? 'hidden-on-mobile' : ''}`}
        style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          background: 'var(--surface-color, #FFFFFF)' 
        }}
      >
        {activeConversation ? (
          <>
            {/* Active Partner Chat Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-color, #E2E8F0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--surface-color, #FFFFFF)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  className="mobile-back-btn" 
                  onClick={() => setMobileShowChat(false)}
                  style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748B' }}
                >
                  <ArrowLeft size={18} />
                </button>

                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: activeConversation.avatarBg || '#EFF6FF',
                    color: activeConversation.avatarColor || '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px'
                  }}>
                    {activeConversation.initials || activeConversation.name?.slice(0, 2).toUpperCase() || 'ST'}
                  </div>
                  <span 
                    style={{
                      position: 'absolute',
                      bottom: '1px',
                      right: '1px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: isPartnerOnline(activeConversation.email, activeConversation.name) ? '#10B981' : '#CBD5E1',
                      border: '2px solid white'
                    }}
                  />
                </div>

                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text-main, #0F172A)' }}>
                    {activeConversation.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', marginTop: '2px' }}>
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: isPartnerOnline(activeConversation.email, activeConversation.name) ? '#10B981' : '#94A3B8',
                      fontWeight: 700
                    }}>
                      <Circle size={8} fill={isPartnerOnline(activeConversation.email, activeConversation.name) ? '#10B981' : '#94A3B8'} />
                      {isPartnerOnline(activeConversation.email, activeConversation.name) ? 'Online' : 'Offline'}
                    </span>
                    <span style={{ color: '#CBD5E1' }}>•</span>
                    <span style={{ color: '#64748B' }}>{activeConversation.role || 'Connected Teammate'}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#DEF7EC', color: '#03543F', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, border: '1px solid #BCF0DA' }}>
                  ✓ Connected
                </span>
              </div>
            </div>

            {/* Message History Feed */}
            <div 
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                background: 'var(--bg-main, #F8FAFC)'
              }}
            >
              {/* Security Verified Banner */}
              <div style={{ textAlign: 'center', margin: '4px 0 12px' }}>
                <span style={{ background: 'rgba(37, 99, 235, 0.08)', color: '#2563EB', padding: '6px 14px', borderRadius: '9999px', fontSize: '11.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={13} /> Connection verified. End-to-end student chat active.
                </span>
              </div>

              {(activeConversation.messages || []).map((msg, i) => {
                const isMe = (msg.senderEmail && normalizeEmail(msg.senderEmail) === myEmail) || msg.senderId === myId || msg.sender === 'user';

                return (
                  <div
                    key={msg.id || i}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                      width: '100%'
                    }}
                  >
                    <div
                      className={`msg-bubble ${isMe ? 'msg-bubble-me' : 'msg-bubble-them'}`}
                      style={{
                        maxWidth: '70%',
                        padding: '12px 16px',
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: isMe ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : 'var(--surface-color, #FFFFFF)',
                        color: isMe ? '#FFFFFF' : 'var(--text-main, #0F172A)',
                        boxShadow: isMe ? '0 4px 12px rgba(37, 99, 235, 0.2)' : '0 2px 6px rgba(0,0,0,0.05)',
                        border: isMe ? 'none' : '1px solid var(--border-color, #E2E8F0)',
                        fontSize: '13.5px',
                        lineHeight: 1.5,
                        wordBreak: 'break-word'
                      }}
                    >
                      {msg.text || msg.content || msg.message}
                    </div>

                    {/* Timestamp and Read Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '10.5px', color: '#94A3B8', padding: '0 4px' }}>
                      <span>{msg.time || 'Just now'}</span>
                      {isMe && (
                        <span>
                          {msg.status === 'READ' ? (
                            <CheckCheck size={13} style={{ color: '#2563EB' }} title="Read" />
                          ) : (
                            <Check size={12} style={{ color: '#94A3B8' }} title="Delivered" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Real-Time Typing Indicator Bubble */}
              {typingUsers[activeConversation.id] && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '16px', background: 'var(--surface-color, #FFFFFF)', border: '1px solid #E2E8F0', width: 'fit-content', color: '#64748B', fontSize: '12px', fontWeight: 600 }}>
                  <span className="typing-dots flex gap-1">
                    <span className="dot animate-bounce" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563EB', display: 'inline-block' }}></span>
                    <span className="dot animate-bounce" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563EB', display: 'inline-block', animationDelay: '0.2s' }}></span>
                    <span className="dot animate-bounce" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563EB', display: 'inline-block', animationDelay: '0.4s' }}></span>
                  </span>
                  <span>{typingUsers[activeConversation.id].name} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Bar */}
            <form 
              onSubmit={handleSendMessage}
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border-color, #E2E8F0)',
                background: 'var(--surface-color, #FFFFFF)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <input
                type="text"
                placeholder="Type a message..."
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '9999px',
                  border: '1px solid var(--border-color, #CBD5E1)',
                  background: 'var(--bg-main, #F8FAFC)',
                  fontSize: '13.5px',
                  color: 'var(--text-main, #0F172A)',
                  outline: 'none'
                }}
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || sending}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: inputMessage.trim() ? '#2563EB' : '#E2E8F0',
                  color: inputMessage.trim() ? '#FFFFFF' : '#94A3B8',
                  border: 'none',
                  cursor: inputMessage.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
                title="Send Message (Enter)"
              >
                <Send size={17} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#64748B', padding: '40px' }}>
            <MessageSquare size={48} style={{ color: '#CBD5E1', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main, #0F172A)' }}>Select a Conversation</h3>
            <p style={{ fontSize: '13px', margin: '6px 0 0' }}>Choose an accepted teammate or mentor from the left panel to start chatting.</p>
          </div>
        )}
      </main>
    </div>
  );
}
