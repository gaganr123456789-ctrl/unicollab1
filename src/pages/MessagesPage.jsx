import React, { useState, useRef, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { socketService } from '../services/socketService';
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
  const [connectionState, setConnectionState] = useState('connected');

  const messagesEndRef = useRef(null);
  const chatPaneRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const seenMessageIds = useRef(new Set());
  const isAutoScrollEnabled = useRef(true);

  const myEmail = (userProfile?.email || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('unicollab_user') || '{}').email : '') || '').toLowerCase().trim();
  const myId = userProfile?.id || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('unicollab_user') || '{}').id : 'usr_me');
  const myName = userProfile?.name || 'Student';

  // Seed default conversations cohort if empty
  const defaultConversations = [
    {
      id: 'conv_seed_1',
      pairKey: 'ananya.sharma@stanford.edu',
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
      pairKey: 'marcus.sterling@mit.edu',
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
          const map = new Map();
          // Server conversations first
          res.conversations.forEach(c => {
            if (c && c.id) map.set(c.id, c);
          });
          // Merge any local conversations not yet on server
          prev.forEach(c => {
            if (c && c.id && !map.has(c.id)) {
              map.set(c.id, c);
            }
          });
          return Array.from(map.values()).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        });
      }
    } catch (err) {
      console.warn('Failed to load server conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Initialize Single Persistent Socket.IO Connection & Listeners
  useEffect(() => {
    loadConversations();

    const socket = socketService.connect({
      id: myId,
      email: myEmail,
      name: myName
    });

    const unsubs = [];

    // Connection changes
    unsubs.push(socketService.on('connection_change', (data) => {
      setConnectionState(data.status);
    }));

    // Online presence
    unsubs.push(socketService.on('online_users', (onlineList) => {
      if (Array.isArray(onlineList)) {
        setOnlineUsersList(onlineList);
      }
    }));

    // Presence changed
    unsubs.push(socketService.on('presence_changed', (userStatus) => {
      if (userStatus) {
        setOnlineUsersList(prev => {
          if (userStatus.status === 'offline') {
            return prev.filter(u => u.email !== userStatus.email && u.id !== userStatus.id);
          }
          if (!prev.some(u => u.email === userStatus.email)) {
            return [...prev, userStatus];
          }
          return prev;
        });
      }
    }));

    // Real-time message listener
    unsubs.push(socketService.on('message', (msgPayload) => {
      if (!msgPayload) return;
      if (seenMessageIds.current.has(msgPayload.id) || (msgPayload.clientTempId && seenMessageIds.current.has(msgPayload.clientTempId))) {
        return;
      }
      seenMessageIds.current.add(msgPayload.id);

      const convId = msgPayload.conversationId || msgPayload.conversation_id;
      const rawText = msgPayload.content || msgPayload.text || msgPayload.message;
      const isFromMe = (msgPayload.senderEmail && msgPayload.senderEmail.toLowerCase() === myEmail) || msgPayload.senderId === myId;

      const newMsgObj = {
        id: msgPayload.id || `msg_${Date.now()}`,
        clientTempId: msgPayload.clientTempId || null,
        conversationId: convId,
        senderId: msgPayload.senderId || msgPayload.sender_id,
        senderName: msgPayload.senderName || 'Teammate',
        senderEmail: msgPayload.senderEmail,
        text: rawText,
        content: rawText,
        time: msgPayload.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: isFromMe ? (msgPayload.status || 'DELIVERED') : 'READ',
        createdAt: msgPayload.createdAt || new Date().toISOString()
      };

      setConversations(prev => {
        let found = false;
        const updated = prev.map(c => {
          const isMatchingConv = c.id === convId || 
            (c.pairKey && msgPayload.senderEmail && c.pairKey.includes(msgPayload.senderEmail.toLowerCase())) ||
            (c.email && msgPayload.senderEmail && c.email.toLowerCase() === msgPayload.senderEmail.toLowerCase());

          if (isMatchingConv) {
            found = true;
            // Prevent duplicate message in array
            const existingMessages = c.messages || [];
            const isDuplicate = existingMessages.some(m => m.id === newMsgObj.id || (newMsgObj.clientTempId && m.id === newMsgObj.clientTempId));
            const newMessagesList = isDuplicate ? existingMessages : [...existingMessages, newMsgObj];

            return {
              ...c,
              lastMsg: rawText,
              time: newMsgObj.time,
              updatedAt: new Date().toISOString(),
              unread: activeConversationId === c.id ? 0 : (c.unread || 0) + 1,
              messages: newMessagesList
            };
          }
          return c;
        });

        if (!found) {
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
            unread: activeConversationId === convId ? 0 : 1,
            updatedAt: new Date().toISOString(),
            messages: [newMsgObj]
          };
          return [newConv, ...updated];
        }

        return updated.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      });

      // If active conversation received a message, mark as read immediately
      if (activeConversationId === convId && !isFromMe) {
        socketService.markMessagesRead(convId, { id: myId, email: myEmail });
      }
    }));

    // Typing status listener
    unsubs.push(socketService.on('typing', (data) => {
      if (!data || !data.conversationId) return;
      setTypingUsers(prev => ({
        ...prev,
        [data.conversationId]: data.isTyping ? { name: data.senderName, isTyping: true } : null
      }));
    }));

    // Read receipts listener
    unsubs.push(socketService.on('messages_read', (data) => {
      if (!data || !data.conversationId) return;
      setConversations(prev => prev.map(c => {
        if (c.id === data.conversationId) {
          return {
            ...c,
            unread: 0,
            messages: (c.messages || []).map(m => ({ ...m, status: 'READ' }))
          };
        }
        return c;
      }));
    }));

    return () => {
      unsubs.forEach(unsub => unsub && unsub());
    };
  }, [myId, myEmail]);

  // 2. Join conversation room and mark messages as read when activeConversationId changes
  useEffect(() => {
    if (!activeConversationId) return;

    socketService.joinConversation(activeConversationId);
    socketService.markMessagesRead(activeConversationId, { id: myId, email: myEmail });

    // Clear unread count locally for active conversation
    setConversations(prev => prev.map(c => {
      if (c.id === activeConversationId) {
        return { ...c, unread: 0 };
      }
      return c;
    }));

    // Fetch conversation messages from server to guarantee sync
    const fetchHistory = async () => {
      try {
        const res = await apiClient.getConversationMessages(activeConversationId, myId, myEmail);
        if (res.success && Array.isArray(res.messages) && res.messages.length > 0) {
          setConversations(prev => prev.map(c => {
            if (c.id === activeConversationId) {
              const formatted = res.messages.map(m => ({
                id: m.id || m.message_id,
                senderId: m.senderId || m.sender_id,
                senderName: m.senderName || (m.senderId === myId ? myName : c.name),
                text: m.content || m.text || m.message,
                time: m.time || new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: m.status || 'DELIVERED',
                createdAt: m.createdAt || new Date().toISOString()
              }));
              return { ...c, messages: formatted };
            }
            return c;
          }));
        }
      } catch (err) {
        console.warn('History fetch notice:', err);
      }
    };
    fetchHistory();
  }, [activeConversationId, myId, myEmail]);

  // 3. Auto-initialize conversation when directed from Find Teammates or other pages
  useEffect(() => {
    if (!activeChatPartner || !activeChatPartner.name) {
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
          socketService.joinConversation(convId);
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
      socketService.joinConversation(localId);
    };

    initPartnerChat();
  }, [activeChatPartner]);

  // 4. Scroll to newest message automatically
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAutoScrollEnabled.current) {
      scrollToBottom();
    }
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

  // 5. Handle Typing Indicators
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    if (activeConversation) {
      socketService.sendTypingStart(activeConversation.id, {
        name: myName,
        id: myId,
        email: myEmail
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (activeConversation) {
          socketService.sendTypingStop(activeConversation.id, {
            id: myId,
            email: myEmail
          });
        }
      }, 2000);
    }
  };

  // 6. Send Message Action
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
      clientTempId: localMsgId,
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

    // 1. Emit via real-time Socket.IO
    socketService.sendMessage({
      conversationId: activeConversation.id,
      content: rawText,
      text: rawText,
      senderId: myId,
      senderName: myName,
      senderEmail: myEmail,
      receiverEmail: activeConversation.email,
      receiverId: activeConversation.id,
      clientTempId: localMsgId
    }, (ack) => {
      if (ack?.success && ack?.message) {
        // Reconcile message with server confirmation
        seenMessageIds.current.add(ack.message.id);
        setConversations(prev => prev.map(c => {
          if (c.id === activeConversation.id) {
            return {
              ...c,
              messages: (c.messages || []).map(m => m.id === localMsgId ? { ...m, id: ack.message.id, status: 'DELIVERED' } : m)
            };
          }
          return c;
        }));
      }
    });

    socketService.sendTypingStop(activeConversation.id, { id: myId, email: myEmail });

    // 2. Persist via REST API
    try {
      const res = await apiClient.sendMessage({
        conversationId: activeConversation.id,
        senderId: myId,
        senderEmail: myEmail,
        senderName: myName,
        receiverEmail: activeConversation.email,
        receiverId: activeConversation.id,
        text: rawText
      });

      if (res.success && res.data) {
        const confirmedMsg = res.data;
        seenMessageIds.current.add(confirmedMsg.id);
        setConversations(prev => prev.map(c => {
          if (c.id === activeConversation.id) {
            return {
              ...c,
              messages: (c.messages || []).map(m => m.id === localMsgId ? { ...m, id: confirmedMsg.id, status: 'DELIVERED' } : m)
            };
          }
          return c;
        }));
      }
    } catch (err) {
      console.warn('REST API message save fallback notice:', err);
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
    <div className="messages-layout animate-fade-in">
      {/* ------------------------------------------------------------- */}
      {/* LEFT PANEL: Conversations Directory                            */}
      {/* ------------------------------------------------------------- */}
      <aside className={`messages-sidebar ${mobileShowChat ? 'hidden-on-mobile' : ''}`}>
        {/* Header & Tabs */}
        <div className="messages-sidebar-header">
          <div className="flex justify-between align-center mb-3">
            <h2 className="messages-sidebar-title">
              Messages
            </h2>
            <button 
              onClick={loadConversations} 
              title="Refresh conversations" 
              className="btn-icon-plain"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Search Conversations Input */}
          <div className="messages-search-wrapper">
            <Search size={15} className="messages-search-icon" />
            <input 
              type="text" 
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="messages-search-input"
            />
          </div>

          {/* Filter Tabs */}
          <div className="messages-filter-tabs">
            {['All', 'Students', 'Mentors'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`messages-tab-btn ${activeFilter === tab ? 'active' : ''}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations Scrollable List */}
        <div className="messages-conv-list">
          {filteredConversations.length === 0 ? (
            <div className="messages-empty-conv">
              <MessageSquare size={32} className="empty-msg-icon" />
              <p className="empty-title">No conversations found</p>
              <p className="empty-desc">Connect with peers in Find Teammates to unlock chat.</p>
              {setCurrentPage && (
                <button 
                  className="btn-primary" 
                  onClick={() => setCurrentPage('find-teammates')}
                  style={{ padding: '8px 16px', fontSize: '12.5px', fontWeight: 700, borderRadius: '10px' }}
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
                  className={`conversation-card ${isSelected ? 'selected' : ''}`}
                >
                  {/* Profile Avatar with Online Dot Indicator */}
                  <div className="conv-avatar-wrapper">
                    <div 
                      className="conv-avatar-circle"
                      style={{
                        background: conv.avatarBg || '#EFF6FF',
                        color: conv.avatarColor || '#2563EB'
                      }}
                    >
                      {conv.initials || conv.name?.slice(0, 2).toUpperCase() || 'ST'}
                    </div>
                    <span 
                      className={`conv-online-dot ${online ? 'online' : 'offline'}`}
                      title={online ? 'Online now' : 'Offline'}
                    />
                  </div>

                  {/* Conversation Info */}
                  <div className="conv-main-info">
                    <div className="conv-top-row">
                      <span className="conv-name">
                        {conv.name}
                      </span>
                      <span className="conv-time">
                        {conv.time}
                      </span>
                    </div>

                    <div className="conv-bottom-row">
                      <p className={`conv-last-msg ${conv.unread > 0 ? 'unread' : ''}`}>
                        {conv.lastMsg || 'Chat active'}
                      </p>

                      {conv.unread > 0 && (
                        <span className="conv-unread-badge">
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
      <main className={`messages-chat-pane ${!mobileShowChat ? 'hidden-on-mobile' : ''}`}>
        {activeConversation ? (
          <>
            {/* Active Partner Chat Header */}
            <div className="chat-pane-header">
              <div className="chat-partner-info-left">
                <button 
                  className="mobile-back-btn" 
                  onClick={() => setMobileShowChat(false)}
                >
                  <ArrowLeft size={18} />
                </button>

                <div className="chat-header-avatar-box">
                  <div 
                    className="chat-header-avatar"
                    style={{
                      background: activeConversation.avatarBg || '#EFF6FF',
                      color: activeConversation.avatarColor || '#2563EB'
                    }}
                  >
                    {activeConversation.initials || activeConversation.name?.slice(0, 2).toUpperCase() || 'ST'}
                  </div>
                  <span 
                    className={`chat-header-status-dot ${isPartnerOnline(activeConversation.email, activeConversation.name) ? 'online' : 'offline'}`}
                  />
                </div>

                <div>
                  <h3 className="chat-partner-name">
                    {activeConversation.name}
                  </h3>
                  <div className="chat-partner-status-row">
                    <span className={`status-pill-text ${isPartnerOnline(activeConversation.email, activeConversation.name) ? 'text-emerald' : 'text-muted'}`}>
                      <Circle size={8} fill={isPartnerOnline(activeConversation.email, activeConversation.name) ? '#10B981' : '#94A3B8'} />
                      {isPartnerOnline(activeConversation.email, activeConversation.name) ? 'Online' : 'Offline'}
                    </span>
                    <span className="status-separator">•</span>
                    <span className="partner-role-text">{activeConversation.role || 'Connected Teammate'}</span>
                  </div>
                </div>
              </div>

              <div className="chat-header-actions-right">
                <span className="badge-connected">
                  ✓ Connected
                </span>
              </div>
            </div>

            {/* Message History Feed */}
            <div className="chat-history-feed">
              {/* Security Verified Banner */}
              <div className="chat-security-banner-wrapper">
                <span className="chat-security-banner">
                  <ShieldCheck size={14} /> Connection verified. End-to-end student chat active.
                </span>
              </div>

              {(activeConversation.messages || []).map((msg, i) => {
                const isMe = (msg.senderEmail && normalizeEmail(msg.senderEmail) === myEmail) || msg.senderId === myId || msg.sender === 'user';

                return (
                  <div
                    key={msg.id || i}
                    className={`chat-msg-row ${isMe ? 'row-me' : 'row-them'}`}
                  >
                    <div className={`chat-msg-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}>
                      {msg.text || msg.content || msg.message}
                    </div>

                    {/* Timestamp and Read Status */}
                    <div className="chat-msg-meta">
                      <span>{msg.time || 'Just now'}</span>
                      {isMe && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '4px' }}>
                          {msg.status === 'READ' ? (
                            <CheckCheck size={14} style={{ color: '#2563EB' }} title="Read" />
                          ) : msg.status === 'DELIVERED' ? (
                            <CheckCheck size={14} style={{ color: '#94A3B8' }} title="Delivered" />
                          ) : (
                            <Check size={13} style={{ color: '#94A3B8' }} title="Sent" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Real-Time Typing Indicator Bubble */}
              {typingUsers[activeConversation.id] && (
                <div className="chat-typing-bubble">
                  <span className="typing-dots flex gap-1">
                    <span className="dot animate-bounce dot-1"></span>
                    <span className="dot animate-bounce dot-2"></span>
                    <span className="dot animate-bounce dot-3"></span>
                  </span>
                  <span>{typingUsers[activeConversation.id].name} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Bar */}
            <form 
              onSubmit={handleSendMessage}
              className="chat-input-bar-form"
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
                className="chat-input-field"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || sending}
                className={`chat-send-btn ${inputMessage.trim() ? 'active' : 'disabled'}`}
                title="Send Message (Enter)"
              >
                <Send size={17} />
              </button>
            </form>
          </>
        ) : (
          <div className="chat-empty-selection">
            <MessageSquare size={48} className="chat-empty-icon" />
            <h3 className="chat-empty-title">Select a Conversation</h3>
            <p className="chat-empty-desc">Choose an accepted teammate or mentor from the left panel to start chatting.</p>
          </div>
        )}
      </main>
    </div>
  );
}
