import axios from 'axios';

// SECURITY (F-05): the JWT is no longer kept in localStorage (XSS risk).
// Browsers authenticate via the HttpOnly 'tos_auth' cookie issued by the API
// at login. `memoryToken` is an in-memory fallback for non-cookie contexts
// (e.g. plain-HTTP local dev, where Secure cookies are refused by browsers).
let memoryToken: string | null = null;
export const setMemoryToken = (token: string | null): void => {
  memoryToken = token;
};

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
  withCredentials: true, // send the HttpOnly auth cookie on every request
});

// Request Interceptor: Attach in-memory JWT as fallback when present
apiClient.interceptors.request.use(
  (config) => {
    if (memoryToken && config.headers) {
      config.headers.Authorization = `Bearer ${memoryToken}`;
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
      // Clear in-memory token and non-secret markers, then notify the app
      setMemoryToken(null);
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_id');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);
