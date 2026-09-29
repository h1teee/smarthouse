export const API_URL = import.meta.env.VITE_API_URL || 'https://smarthouse-backend.onrender.com';

export const getAuthHeaders = (extraHeaders?: Record<string, string>): Record<string, string> => {
  const userId = localStorage.getItem('user_id') || '1';
  return {
    'Content-Type': 'application/json',
    'X-User-ID': userId,
    ...(extraHeaders || {}),
  };
};
