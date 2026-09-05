import axios from 'axios';

const api = axios.create({
  baseURL: 'https://attendify-backend-xgaf.onrender.com/api',
});

// Attach JWT to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('attendify_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;