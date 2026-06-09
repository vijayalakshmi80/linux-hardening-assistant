/**
 * Axios API client pre-configured for the backend.
 * Automatically includes cookies for session management.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 120_000, // 2 minutes — SSH + AI can be slow
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — unwrap error messages
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.error ??
      error.message ??
      'Unknown error occurred';
    const errorType = error.response?.data?.error_type ?? 'unknown_error';

    return Promise.reject({ message, errorType, status: error.response?.status });
  },
);

export default api;
