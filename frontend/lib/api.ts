import axios from 'axios';
import type { StreamEvent } from './agents/coachAgent';

// Since the backend API routes are now part of the same Next.js app,
// we can use relative URLs (empty baseURL for same-origin requests)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

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

// Streaming chat API - returns an async generator for Server-Sent Events
export async function* sendMessageStream(
  message: string,
  conversationId?: string,
  token?: string
): AsyncGenerator<StreamEvent> {
  const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, conversationId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data.trim()) {
            try {
              const event = JSON.parse(data) as StreamEvent;
              yield event;
            } catch (error) {
              console.error('Failed to parse SSE event:', error);
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

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
