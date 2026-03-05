// =============================================================================
// API Service - Connect to NestJS Server
// =============================================================================

const API_BASE_URL = 'http://localhost:3001/api';

// Helper function for API calls
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ==================== Visitor Stats ====================
export interface VisitorStats {
  pageViews: number;
  uniqueVisitors: number;
  onlineUsers: number;
}

export interface LiveStats extends VisitorStats {
  uptime: number;
  timestamp: string;
}

export const api = {
  // Visitor Stats
  getVisitorStats: () => fetchAPI<VisitorStats>('/stats/visitors'),

  heartbeat: (sessionId: string) =>
    fetchAPI<{ success: boolean }>('/stats/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),

  trackVisit: (sessionId: string, page: string) =>
    fetchAPI<{ success: boolean }>('/stats/visit', {
      method: 'POST',
      body: JSON.stringify({ sessionId, page }),
    }),

  getLiveStats: () => fetchAPI<LiveStats>('/stats/live'),

  // AI Quiz
  getQuizQuestions: () =>
    fetchAPI<Array<{ id: number; question: string; options: string[] }>>('/quiz/questions'),

  submitQuiz: (answers: number[]) =>
    fetchAPI<{ score: number; total: number; percentage: number; message: string }>('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  // Guestbook
  getGuestbook: () =>
    fetchAPI<
      Array<{
        name: string;
        message: string;
        createdAt: string;
      }>
    >('/guestbook'),

  addGuestbookEntry: (name: string, message: string) =>
    fetchAPI<{ success: boolean; entry: { name: string; message: string; createdAt: string } }>(
      '/guestbook',
      {
        method: 'POST',
        body: JSON.stringify({ name, message }),
      },
    ),

  // AI Chat
  aiChat: (message: string, history: Array<{ role: string; content: string }> = []) =>
    fetchAPI<{ response: string; timestamp: string }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),

  // Contact Form
  submitContact: (name: string, email: string, message: string) =>
    fetchAPI<{ success: boolean; message: string; data: any }>('/contact', {
      method: 'POST',
      body: JSON.stringify({ name, email, message }),
    }),

  // Newsletter
  subscribeNewsletter: (email: string) =>
    fetchAPI<{ success: boolean; message: string }>('/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

// ==================== Utility Functions ====================

// Generate or get session ID
export function getSessionId(): string {
  const key = 'portal_session_id';
  let sessionId = localStorage.getItem(key);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, sessionId);
  }

  return sessionId;
}

export default api;
