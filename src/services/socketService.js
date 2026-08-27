import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.user = null;
    this.listeners = new Map();
    this.joinedRooms = new Set();
  }

  getSocketUrl() {
    if (typeof window === 'undefined') return 'http://localhost:5000';
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    if (window.location.hostname.includes('onrender.com')) {
      return window.location.origin;
    }
    return 'https://unicollab1.onrender.com';
  }

  connect(userProfile) {
    if (userProfile) {
      this.user = userProfile;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('unicollab_token') : null;
    const socketUrl = this.getSocketUrl();

    if (this.socket && this.socket.connected) {
      if (this.user) {
        this.socket.emit('register_user', {
          id: this.user.id,
          email: this.user.email,
          name: this.user.name
        });
      }
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      auth: {
        token: token || '',
        user: this.user || {}
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    this.setupCoreListeners();
    return this.socket;
  }

  setupCoreListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.connected = true;
      console.log(`[SocketService] Connected to real-time server (ID: ${this.socket.id})`);

      // Re-register user presence upon reconnect
      if (this.user) {
        this.socket.emit('register_user', {
          id: this.user.id,
          email: this.user.email,
          name: this.user.name
        });
      }

      // Re-join any conversation rooms
      this.joinedRooms.forEach(room => {
        this.socket.emit('join_conversation', room);
      });

      this.emitInternal('connection_change', { status: 'connected', socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.log(`[SocketService] Disconnected: ${reason}`);
      this.emitInternal('connection_change', { status: 'disconnected', reason });
    });

    this.socket.on('connect_error', (error) => {
      this.connected = false;
      console.warn(`[SocketService] Connection error:`, error.message);
      this.emitInternal('connection_change', { status: 'error', error: error.message });
    });

    // Real-time chat events
    this.socket.on('receive_message', (payload) => {
      this.emitInternal('message', payload);
    });

    this.socket.on('new_message_notification', (payload) => {
      this.emitInternal('message', payload);
      this.emitInternal('message_notification', payload);
    });

    this.socket.on('typing:status', (payload) => {
      this.emitInternal('typing', payload);
    });

    this.socket.on('messages_read', (payload) => {
      this.emitInternal('messages_read', payload);
    });

    this.socket.on('online_users_updated', (payload) => {
      this.emitInternal('online_users', payload);
    });

    this.socket.on('user:presence_changed', (payload) => {
      this.emitInternal('presence_changed', payload);
    });
  }

  joinConversation(conversationId) {
    if (!conversationId) return;
    this.joinedRooms.add(conversationId);
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_conversation', conversationId);
    }
  }

  leaveConversation(conversationId) {
    if (!conversationId) return;
    this.joinedRooms.delete(conversationId);
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_conversation', conversationId);
    }
  }

  sendMessage(messageData, ackCallback) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('send_message', messageData, (response) => {
        if (ackCallback) ackCallback(response);
      });
      return true;
    }
    return false;
  }

  sendTypingStart(conversationId, senderInfo) {
    if (this.socket && this.socket.connected && conversationId) {
      this.socket.emit('typing:start', {
        conversationId,
        senderName: senderInfo?.name || this.user?.name || 'Student',
        senderId: senderInfo?.id || this.user?.id,
        senderEmail: senderInfo?.email || this.user?.email
      });
    }
  }

  sendTypingStop(conversationId, senderInfo) {
    if (this.socket && this.socket.connected && conversationId) {
      this.socket.emit('typing:stop', {
        conversationId,
        senderId: senderInfo?.id || this.user?.id,
        senderEmail: senderInfo?.email || this.user?.email
      });
    }
  }

  markMessagesRead(conversationId, readerInfo) {
    if (this.socket && this.socket.connected && conversationId) {
      this.socket.emit('mark_read', {
        conversationId,
        readerId: readerInfo?.id || this.user?.id,
        readerEmail: readerInfo?.email || this.user?.email
      });
    }
  }

  // Event Subscription Helpers
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emitInternal(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error(`Error in SocketService event listener for "${event}":`, err);
        }
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
}

export const socketService = new SocketService();
