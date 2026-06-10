import axios from 'axios';

// Helper to dynamically resolve API base URL depending on deployment context
const getBaseURL = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Check if hosted on production domain
    if (hostname.includes('dordorapps.tech') || (!['localhost', '127.0.0.1'].includes(hostname) && !hostname.startsWith('192.168.') && !hostname.startsWith('10.') && !hostname.startsWith('172.'))) {
      return '/api';
    }
    // Fallback for local network access (e.g. testing via local IP on mobile) or localhost dev
    return `http://${hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
};

// Create a centralized Axios instance
export const apiClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_role');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);
