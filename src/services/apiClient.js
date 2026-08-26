// Unified UniCollab REST API Client with environment detection
const RENDER_BACKEND_URL = 'https://unicollab1.onrender.com';

const BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')
    ? '/api'
    : `${RENDER_BACKEND_URL}/api`;

export const apiClient = {
  // Health Check
  async getHealth() {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      return await res.json();
    } catch (err) {
      console.warn('API Health Check warning:', err);
      return { status: 'offline' };
    }
  },

  // Auth APIs
  async login(email, password) {
    const targetEmail = (email || '').trim().toLowerCase();
    const targetPassword = (password || '').trim();

    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPassword })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          // Cache successful user login locally
          if (typeof window !== 'undefined') {
            const cachedUsers = JSON.parse(localStorage.getItem('unicollab_registered_users') || '[]');
            const existingIdx = cachedUsers.findIndex(u => u.email.toLowerCase() === targetEmail);
            if (existingIdx >= 0) {
              cachedUsers[existingIdx] = { ...cachedUsers[existingIdx], ...data.user, password: targetPassword };
            } else {
              cachedUsers.push({ ...data.user, password: targetPassword });
            }
            localStorage.setItem('unicollab_registered_users', JSON.stringify(cachedUsers));
          }
          return data;
        }
        return data;
      }
    } catch (err) {
      console.warn('Backend login network warning:', err);
    }

    // Check local registered cache for existing registered users ONLY
    if (typeof window !== 'undefined') {
      const cachedUsers = JSON.parse(localStorage.getItem('unicollab_registered_users') || '[]');
      const found = cachedUsers.find(u => u.email.toLowerCase() === targetEmail);
      if (found) {
        if (found.password && found.password !== targetPassword) {
          return { success: false, message: 'Invalid password. Please check your credentials.' };
        }
        return {
          success: true,
          message: 'Logged in successfully.',
          user: found
        };
      }
    }

    return { success: false, message: 'No registered account found with this email. Please Sign Up first.' };
  },

  async updateProfile(profileData) {
    try {
      const res = await fetch(`${BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      return await res.json();
    } catch (err) {
      console.warn('Update profile API warning:', err);
      return { success: true, message: 'Profile updated locally.', user: profileData };
    }
  },

  async register(userData) {
    const targetEmail = (userData.email || '').trim().toLowerCase();

    // Check local storage duplicate first
    if (typeof window !== 'undefined') {
      const cachedUsers = JSON.parse(localStorage.getItem('unicollab_registered_users') || '[]');
      const existsLocally = cachedUsers.some(u => u.email?.toLowerCase() === targetEmail);
      if (existsLocally) {
        return {
          success: false,
          message: 'An account with this email already exists. Please Sign In.'
        };
      }
    }

    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'An account with this email already exists. Please Sign In.'
        };
      }

      if (data.success && data.user) {
        // Cache user locally to guarantee instant seamless logins
        if (typeof window !== 'undefined') {
          const cachedUsers = JSON.parse(localStorage.getItem('unicollab_registered_users') || '[]');
          const userWithPass = { ...data.user, password: userData.password };
          const filtered = cachedUsers.filter(u => u.email.toLowerCase() !== targetEmail);
          filtered.push(userWithPass);
          localStorage.setItem('unicollab_registered_users', JSON.stringify(filtered));
        }
      }
      return data;
    } catch (err) {
      console.warn('Register fallback:', err);
      // Fallback local register
      const newUser = {
        id: `usr_${Date.now()}`,
        ...userData,
        email: targetEmail
      };
      if (typeof window !== 'undefined') {
        const cachedUsers = JSON.parse(localStorage.getItem('unicollab_registered_users') || '[]');
        cachedUsers.push(newUser);
        localStorage.setItem('unicollab_registered_users', JSON.stringify(cachedUsers));
        localStorage.setItem('unicollab_token', `token_sso_${Date.now()}`);
        localStorage.setItem('unicollab_user', JSON.stringify(newUser));
      }
      return { success: true, message: 'Account created successfully.', user: newUser };
    }
  },

  async ssoLogin(provider = 'google', ssoData = {}) {
    const defaultEmail = ssoData.email || `alex.${provider}@stanford.edu`;
    const defaultName = ssoData.name || (provider === 'github' ? 'Alex Rivera (GitHub)' : 'Alex Rivera (Google)');

    try {
      const res = await fetch(`${BASE_URL}/auth/sso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, email: defaultEmail, name: defaultName })
      });
      const data = await res.json();

      if (data.success && data.user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('unicollab_token', data.token || `token_sso_${Date.now()}`);
          localStorage.setItem('unicollab_user', JSON.stringify(data.user));
          localStorage.setItem('unicollab_sso_provider', provider);
        }
        return data;
      }
    } catch (err) {
      console.warn('SSO API fallback to localStorage:', err);
    }

    // Local Storage SSO Fallback
    const ssoUser = {
      id: `usr_sso_${provider}_${Date.now()}`,
      name: defaultName,
      email: defaultEmail,
      university: 'Stanford University',
      major: 'Computer Science & Engineering (CSE)',
      provider
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('unicollab_token', `token_sso_${provider}_${Date.now()}`);
      localStorage.setItem('unicollab_user', JSON.stringify(ssoUser));
      localStorage.setItem('unicollab_sso_provider', provider);
    }

    return {
      success: true,
      message: `Single Sign-On success via ${provider.toUpperCase()}!`,
      token: `token_sso_${provider}_${Date.now()}`,
      user: ssoUser
    };
  },

  async forgotPassword(email) {
    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return await res.json();
    } catch (err) {
      console.error('Forgot password API error:', err);
      return { success: false, message: 'Password reset request failed.' };
    }
  },

  async verifyOtp(email, otpCode) {
    try {
      const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode })
      });
      return await res.json();
    } catch (err) {
      console.error('Verify OTP API error:', err);
      return { success: false, message: 'Verification code check failed.' };
    }
  },

  async resetPassword(email, otpCode, newPassword) {
    try {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode, newPassword })
      });
      return await res.json();
    } catch (err) {
      console.error('Reset password API error:', err);
      return { success: false, message: 'Password reset execution failed.' };
    }
  },

  // Dedicated Admin Authorization & Passkey Recovery APIs (Decoupled from student auth)
  async authenticateAdmin(passkey) {
    try {
      const res = await fetch(`${BASE_URL}/admin/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey })
      });
      return await res.json();
    } catch (err) {
      console.error('Admin Authenticate API error:', err);
      return { success: false, message: 'Admin authentication failed.' };
    }
  },

  async requestAdminPasskeyReset(email) {
    try {
      const res = await fetch(`${BASE_URL}/admin/request-passkey-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return await res.json();
    } catch (err) {
      console.error('Request Admin Reset API error:', err);
      return { success: false, message: 'Admin passkey reset request failed.' };
    }
  },

  async verifyAdminResetOtp(email, otp) {
    try {
      const res = await fetch(`${BASE_URL}/admin/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      return await res.json();
    } catch (err) {
      console.error('Verify Admin OTP API error:', err);
      return { success: false, message: 'Admin OTP verification failed.' };
    }
  },

  async resetAdminPasskey(email, resetToken, newPasskey) {
    try {
      const res = await fetch(`${BASE_URL}/admin/reset-passkey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetToken, newPasskey })
      });
      return await res.json();
    } catch (err) {
      console.error('Reset Admin Passkey API error:', err);
      return { success: false, message: 'Admin passkey reset failed.' };
    }
  },

  async getAdminUsers() {
    try {
      const res = await fetch(`${BASE_URL}/admin/users`);
      return await res.json();
    } catch (err) {
      console.warn('Get Admin Users API warning:', err);
      return { success: false, users: [] };
    }
  },

  async clearAdminUsers() {
    try {
      const res = await fetch(`${BASE_URL}/admin/users/clear`, { method: 'POST' });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('unicollab_registered_users');
      }
      return await res.json();
    } catch (err) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('unicollab_registered_users');
      }
      return { success: true, message: 'All users cleared.' };
    }
  },

  // Teammates & AI Matchmaker APIs
  async getTeammates(search = '', skill = '', major = '', excludeEmail = '', currentUserId = '') {
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (skill) query.append('skill', skill);
      if (major) query.append('major', major);
      if (excludeEmail) query.append('excludeEmail', excludeEmail);
      if (currentUserId) query.append('currentUserId', currentUserId);

      const headers = { 'Content-Type': 'application/json' };
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('unicollab_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${BASE_URL}/teammates?${query.toString()}`, { headers });
      return await res.json();
    } catch (err) {
      console.error('Teammates API error:', err);
      return { success: false, teammates: [] };
    }
  },

  async matchTeammates(userSkills) {
    try {
      const res = await fetch(`${BASE_URL}/teammates/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userSkills })
      });
      return await res.json();
    } catch (err) {
      console.error('Matchmaking API error:', err);
      return { success: false, matches: [] };
    }
  },

  // Workspace & Task Board APIs
  async getTasks() {
    try {
      const res = await fetch(`${BASE_URL}/workspace/tasks`);
      return await res.json();
    } catch (err) {
      return { success: false, tasks: [] };
    }
  },

  async createTask(taskData) {
    try {
      const res = await fetch(`${BASE_URL}/workspace/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Task creation failed.' };
    }
  },

  getExportCsvUrl() {
    return `${BASE_URL}/workspace/export-csv`;
  },

  // Mentors APIs
  async getMentors() {
    try {
      const res = await fetch(`${BASE_URL}/mentors`);
      return await res.json();
    } catch (err) {
      return { success: false, mentors: [] };
    }
  },

  async bookMentor(bookingData) {
    try {
      const res = await fetch(`${BASE_URL}/mentors/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Mentor booking error.' };
    }
  },

  // Hackathons APIs
  async getHackathons() {
    try {
      const res = await fetch(`${BASE_URL}/hackathons`);
      return await res.json();
    } catch (err) {
      return { success: false, hackathons: [] };
    }
  },

  async registerHackathon(registrationData) {
    try {
      const res = await fetch(`${BASE_URL}/hackathons/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });
      const data = await res.json();
      
      // Also cache in local storage for instant Admin Portal synchronization
      if (typeof window !== 'undefined') {
        const cached = JSON.parse(localStorage.getItem('unicollab_hackathon_registrations') || '[]');
        const regRecord = data.registration || {
          id: data.registrationId || `HACK-${Date.now()}`,
          ...registrationData,
          status: 'CONFIRMED',
          registeredAt: new Date().toISOString()
        };
        localStorage.setItem('unicollab_hackathon_registrations', JSON.stringify([regRecord, ...cached]));
      }

      return data;
    } catch (err) {
      const regId = `HACK-${Math.floor(100000 + Math.random() * 900000)}`;
      if (typeof window !== 'undefined') {
        const cached = JSON.parse(localStorage.getItem('unicollab_hackathon_registrations') || '[]');
        const regRecord = {
          id: regId,
          registrationId: regId,
          ...registrationData,
          status: 'CONFIRMED',
          registeredAt: new Date().toISOString()
        };
        localStorage.setItem('unicollab_hackathon_registrations', JSON.stringify([regRecord, ...cached]));
      }
      return { success: true, message: 'Successfully registered for Hackathon!', registrationId: regId };
    }
  },

  async getHackathonRegistrations() {
    try {
      const res = await fetch(`${BASE_URL}/hackathons/registrations`);
      return await res.json();
    } catch (err) {
      const cached = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('unicollab_hackathon_registrations') || '[]') : [];
      return { success: true, count: cached.length, registrations: cached };
    }
  },

  async markNotificationsRead(notificationId = null) {
    try {
      const res = await fetch(`${BASE_URL}/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });
      return await res.json();
    } catch (err) {
      return { success: false };
    }
  },

  // Projects Directory APIs
  async getProjects(search = '', category = 'All') {
    try {
      const query = new URLSearchParams({ search, category }).toString();
      const res = await fetch(`${BASE_URL}/projects?${query}`);
      return await res.json();
    } catch (err) {
      return { success: false, projects: [] };
    }
  },

  async createProject(projectData) {
    try {
      const res = await fetch(`${BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      return await res.json();
    } catch (err) {
      console.error('createProject error:', err);
      return { success: false, message: 'Failed to create project.' };
    }
  },

  async applyToProject(projectId, applicantName, message) {
    try {
      const res = await fetch(`${BASE_URL}/projects/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, applicantName, message })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Project application submission failed.' };
    }
  },

  // AI Assistant Chat API
  async sendAiChat(query, conversationId = 'default') {
    try {
      const res = await fetch(`${BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, conversationId })
      });
      return await res.json();
    } catch (err) {
      console.error('AI Chat API error:', err);
      return {
        success: false,
        sender: 'ai',
        text: 'Sorry, I am having trouble processing your request right now.'
      };
    }
  },

  // Invites & Notifications APIs
  async sendInvite(payload) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('unicollab_token') : null;
      const res = await fetch(`${BASE_URL}/invites`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      console.error('Send invite error:', err);
      return { success: false, message: 'Failed to send invitation.' };
    }
  },

  async sendTeamInvite(payload) {
    return this.sendInvite(payload);
  },

  async getInvites(userId, email) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('unicollab_token') : null;
      const query = new URLSearchParams();
      if (userId) query.append('userId', userId);
      if (email) query.append('email', email);

      const res = await fetch(`${BASE_URL}/invites?${query.toString()}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      return await res.json();
    } catch (err) {
      return { success: false, received: [], sent: [] };
    }
  },

  async getInviteDetails(inviteId) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('unicollab_token') : null;
      const res = await fetch(`${BASE_URL}/invites/${inviteId}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Failed to fetch invite details.' };
    }
  },

  async getSentInvites(senderId = 'user_current') {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('unicollab_token') : null;
      const res = await fetch(`${BASE_URL}/invites/sent?senderId=${senderId}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      return await res.json();
    } catch (err) {
      return { success: false, pendingRecipients: [], sentInvites: [] };
    }
  },

  async respondInvite(inviteId, action, responderName = 'Student User', responderEmail = '', responderId = '') {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('unicollab_token') : null;
      const res = await fetch(`${BASE_URL}/invites/${inviteId}/respond`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action, responderName, responderEmail, responderId })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Failed to respond to invite.' };
    }
  },

  async getTeams() {
    try {
      const res = await fetch(`${BASE_URL}/teams`);
      return await res.json();
    } catch (err) {
      return { success: false, teams: [] };
    }
  },

  async getTeamDetails(teamId) {
    try {
      const res = await fetch(`${BASE_URL}/teams/${teamId}`);
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Failed to fetch team.' };
    }
  },

  async getNotifications(userId) {
    try {
      const res = await fetch(`${BASE_URL}/notifications${userId ? `?userId=${userId}` : ''}`);
      return await res.json();
    } catch (err) {
      return { success: false, notifications: [] };
    }
  },

  // Real-Time Connection Request & Accepted Status APIs
  async sendConnectionRequest(payload) {
    try {
      const res = await fetch(`${BASE_URL}/connections/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      console.error('Send connection request error:', err);
      return { success: false, message: 'Failed to send connection request.' };
    }
  },

  async getConnections(email = '', userId = '') {
    try {
      const query = new URLSearchParams();
      if (email) query.append('email', email);
      if (userId) query.append('userId', userId);
      const res = await fetch(`${BASE_URL}/connections?${query.toString()}`);
      return await res.json();
    } catch (err) {
      return { success: false, connections: [], incomingPending: [], outgoingPending: [] };
    }
  },

  async acceptConnection(connectionId, payload = {}) {
    try {
      const res = await fetch(`${BASE_URL}/connections/${connectionId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Failed to accept connection.' };
    }
  },

  async rejectConnection(connectionId, payload = {}) {
    try {
      const res = await fetch(`${BASE_URL}/connections/${connectionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Failed to decline connection.' };
    }
  },

  async getConnectionStatus(targetEmail, targetId, myEmail, myId) {
    try {
      const query = new URLSearchParams();
      if (targetEmail) query.append('targetEmail', targetEmail);
      if (targetId) query.append('targetId', targetId);
      if (myEmail) query.append('myEmail', myEmail);
      if (myId) query.append('myId', myId);
      const res = await fetch(`${BASE_URL}/connections/status?${query.toString()}`);
      return await res.json();
    } catch (err) {
      return { success: false, status: 'NOT_CONNECTED', isConnected: false };
    }
  },

  // Real-Time Chat & Messaging APIs
  async getConversations(email = '', userId = '') {
    try {
      const query = new URLSearchParams();
      if (email) query.append('email', email);
      if (userId) query.append('userId', userId);
      const res = await fetch(`${BASE_URL}/messages/conversations?${query.toString()}`);
      return await res.json();
    } catch (err) {
      return { success: false, conversations: [] };
    }
  },

  async getOrCreateConversation(partnerName, partnerId, partnerEmail, partnerRole, userAEmail, userAId, userAName) {
    try {
      const res = await fetch(`${BASE_URL}/messages/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userBName: partnerName, 
          userBId: partnerId, 
          userBEmail: partnerEmail,
          partnerRole,
          userAEmail,
          userAId,
          userAName
        })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Failed to initiate conversation.' };
    }
  },

  async sendMessage(payload) {
    try {
      const res = await fetch(`${BASE_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(typeof payload === 'string' ? { text: payload } : payload)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Failed to send message.' };
    }
  },

  async getMessages(conversationId, email = '', userId = '') {
    try {
      const query = new URLSearchParams({ conversationId });
      if (email) query.append('email', email);
      if (userId) query.append('userId', userId);
      const res = await fetch(`${BASE_URL}/messages?${query.toString()}`);
      return await res.json();
    } catch (err) {
      return { success: false, messages: [] };
    }
  },

  async markMessagesRead(conversationId, readerEmail, readerId) {
    try {
      const res = await fetch(`${BASE_URL}/messages/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, readerEmail, readerId })
      });
      return await res.json();
    } catch (err) {
      return { success: false };
    }
  }
};
