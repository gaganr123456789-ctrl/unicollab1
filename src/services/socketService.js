import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.connectionState = 'disconnected'; // 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error'
    this.user = null;
    this.listeners = new Map();
    this.joinedRooms = new Set(); // conversations
    this.joinedProjectRooms = new Set(); // projects
  }

  getSocketUrl() {
    if (typeof window === 'undefined') return 'http://localhost:5000';
    if (import.meta.env?.VITE_SOCKET_URL) {
      return import.meta.env.VITE_SOCKET_URL;
    }
    if (import.meta.env?.VITE_API_URL) {
      return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    return window.location.origin;
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
      try {
        this.socket.removeAllListeners();
        this.socket.disconnect();
      } catch (e) {}
    }

    this.connectionState = 'connecting';
    this.emitInternal('connection_change', { status: 'connecting' });

    this.socket = io(socketUrl, {
      transports: ['polling', 'websocket'], // Starts with HTTP long-polling then upgrades to WebSockets smoothly on Render
      auth: {
        token: token || '',
        user: this.user || {}
      },
      reconnection: true,
      reconnectionAttempts: Infinity, // Keep retrying so Render free tier sleep doesn't break permanently
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
      this.connectionState = 'connected';
      console.log(`🔌 [SocketService] Connected to real-time server (ID: ${this.socket.id})`);

      // Re-register user presence upon connect / reconnect
      if (this.user) {
        this.socket.emit('register_user', {
          id: this.user.id,
          email: this.user.email,
          name: this.user.name
        });
      }

      // Re-join active conversation rooms
      this.joinedRooms.forEach(room => {
        this.socket.emit('join_conversation', room);
      });

      // Re-join active project / kanban rooms
      this.joinedProjectRooms.forEach(projectId => {
        this.socket.emit('join_project', projectId);
      });

      this.emitInternal('connection_change', { status: 'connected', socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      this.connectionState = reason === 'io client disconnect' ? 'disconnected' : 'reconnecting';
      console.log(`[SocketService] Disconnected: ${reason}`);
      this.emitInternal('connection_change', { status: this.connectionState, reason });
    });

    this.socket.on('connect_error', (error) => {
      this.connected = false;
      this.connectionState = 'reconnecting';
      console.warn(`[SocketService] Connection error:`, error.message);
      this.emitInternal('connection_change', { status: 'reconnecting', error: error.message });
    });

    this.socket.io.on('reconnect_attempt', (attempt) => {
      this.connectionState = 'reconnecting';
      this.emitInternal('connection_change', { status: 'reconnecting', attempt });
    });

    this.socket.io.on('reconnect', () => {
      this.connected = true;
      this.connectionState = 'connected';
      this.emitInternal('connection_change', { status: 'connected' });
    });

    this.socket.io.on('reconnect_failed', () => {
      this.connected = false;
      this.connectionState = 'error';
      this.emitInternal('connection_change', { status: 'error', message: 'Reconnection failed' });
    });

    // Dynamic catch-all forwarding for any custom event
    this.socket.onAny((event, ...args) => {
      this.emitInternal(event, args[0]);
    });

    // Real-time Chat Events
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

    // Real-time Kanban & Workspace Events
    this.socket.on('kanban:task_moved', (payload) => {
      this.emitInternal('kanban:task_moved', payload);
    });

    this.socket.on('kanban:task_created', (payload) => {
      this.emitInternal('kanban:task_created', payload);
    });

    this.socket.on('kanban:task_deleted', (payload) => {
      this.emitInternal('kanban:task_deleted', payload);
    });

    this.socket.on('team:member_joined', (payload) => {
      this.emitInternal('team:member_joined', payload);
    });

    this.socket.on('project:created', (payload) => {
      this.emitInternal('project:created', payload);
    });
  }

  // Conversation Room Methods
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

  // Project & Kanban Room Methods
  joinProject(projectId) {
    if (!projectId) return;
    this.joinedProjectRooms.add(projectId);
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_project', projectId);
    }
  }

  leaveProject(projectId) {
    if (!projectId) return;
    this.joinedProjectRooms.delete(projectId);
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_project', projectId);
    }
  }

  emitTaskMoved(taskData, ackCallback) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('kanban:task_moved', taskData, (res) => {
        if (ackCallback) ackCallback(res);
      });
      return true;
    }
    return false;
  }

  emitTaskCreated(taskData, ackCallback) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('kanban:task_created', taskData, (res) => {
        if (ackCallback) ackCallback(res);
      });
      return true;
    }
    return false;
  }

  emitTaskDeleted(taskData, ackCallback) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('kanban:task_deleted', taskData, (res) => {
        if (ackCallback) ackCallback(res);
      });
      return true;
    }
    return false;
  }

  // Messaging Methods
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
      this.connectionState = 'disconnected';
    }
  }
}

export const socketService = new SocketService();

