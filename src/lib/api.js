import axios from 'axios';

/** In production, set VITE_API_URL to your API origin (no trailing slash), e.g. https://api.example.com */
const apiOrigin = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
export const API_BASE = apiOrigin ? `${apiOrigin}/api` : '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;
