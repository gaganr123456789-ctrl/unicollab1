// Shared API Helper with Base URL, Bearer Token Injection, & Centralized Error Handling

const BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : '/api';

/**
 * Universal Fetch Wrapper
 * @param {string} endpoint - API path (e.g. '/projects' or '/users/me')
 * @param {object} options - Fetch configuration options
 */
export async function apiFetch(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('unicollab_token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || `HTTP Error ${response.status}: ${response.statusText}`;
      console.warn(`[API ERROR] ${response.status} ${endpoint}:`, errorMsg);
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error(`[API FETCH FAILED] ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // Auth API
  signup: (payload) => apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => apiFetch('/auth/me'),

  // Dashboard API
  getDashboard: () => apiFetch('/dashboard'),

  // Users & Teammates API
  searchUsers: (params = '') => apiFetch(`/users/search${params}`),
  getMyProfile: () => apiFetch('/users/me'),
  updateMyProfile: (payload) => apiFetch('/users/me', { method: 'PATCH', body: JSON.stringify(payload) }),

  // Projects API
  getProjects: (params = '') => apiFetch(`/projects${params}`),
  getProjectById: (id) => apiFetch(`/projects/${id}`),
  createProject: (payload) => apiFetch('/projects', { method: 'POST', body: JSON.stringify(payload) }),
  updateProject: (id, payload) => apiFetch(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProject: (id) => apiFetch(`/projects/${id}`, { method: 'DELETE' }),

  // Kanban Boards API
  getBoards: () => apiFetch('/boards'),
  getBoardById: (id) => apiFetch(`/boards/${id}`),
  createColumn: (boardId, payload) => apiFetch(`/boards/${boardId}/columns`, { method: 'POST', body: JSON.stringify(payload) }),
  createCard: (boardId, payload) => apiFetch(`/boards/${boardId}/cards`, { method: 'POST', body: JSON.stringify(payload) }),
  updateCardPosition: (boardId, cardId, payload) => apiFetch(`/boards/${boardId}/cards/${cardId}`, { 
    method: 'PATCH', 
    body: JSON.stringify(payload) 
  }),

  // Mentors API
  getMentors: (params = '') => apiFetch(`/mentors${params}`),
  getMentorById: (id) => apiFetch(`/mentors/${id}`),
  bookMentorSession: (mentorId, payload) => apiFetch(`/mentors/${mentorId}/book`, { method: 'POST', body: JSON.stringify(payload) }),

  // Resources API
  getResources: (params = '') => apiFetch(`/resources${params}`),
  createResource: (payload) => apiFetch('/resources', { method: 'POST', body: JSON.stringify(payload) }),

  // Hackathons API
  getHackathons: (params = '') => apiFetch(`/hackathons${params}`),
  registerHackathon: (id) => apiFetch(`/hackathons/${id}/register`, { method: 'POST' }),

  // Messages API
  getMessages: (conversationId, cursor = '') => apiFetch(`/messages/conversations/${conversationId}/messages${cursor ? `?cursor=${cursor}` : ''}`)
};
