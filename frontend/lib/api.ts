import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Chat API
export const sendMessage = async (message: string, conversationId?: string) => {
  const response = await api.post('/api/chat/chat', { message, conversationId });
  return response.data;
};

export const getConversations = async () => {
  const response = await api.get('/api/chat/conversations');
  return response.data;
};

export const getMessages = async (conversationId: string) => {
  const response = await api.get(`/api/chat/conversations/${conversationId}/messages`);
  return response.data;
};

// Goals API
export const getGoals = async () => {
  const response = await api.get('/api/goals');
  return response.data;
};

export const createGoal = async (goal: {
  title: string;
  description?: string;
  targetDate?: string;
}) => {
  const response = await api.post('/api/goals', goal);
  return response.data;
};

export const updateGoal = async (
  goalId: string,
  updates: {
    title?: string;
    description?: string;
    status?: string;
    targetDate?: string;
  }
) => {
  const response = await api.put(`/api/goals/${goalId}`, updates);
  return response.data;
};

export const addProgress = async (
  goalId: string,
  progress: {
    notes: string;
    sentiment?: string;
    metadata?: any;
  }
) => {
  const response = await api.post(`/api/goals/${goalId}/progress`, progress);
  return response.data;
};

export const getProgress = async (goalId: string) => {
  const response = await api.get(`/api/goals/${goalId}/progress`);
  return response.data;
};
