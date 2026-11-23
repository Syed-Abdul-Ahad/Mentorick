import axios from 'axios';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  // Browser aborts here — unrelated to Vercel. 10s was too low for Render cold starts.
  timeout: 45000,
  withCredentials: true, // Enable sending cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - cookies are automatically sent with withCredentials: true
apiClient.interceptors.request.use(
  (config) => {
    // No need to manually add token - cookies are sent automatically
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common responses
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Only redirect to login on 401 for protected pages — guests can browse home and mentors
    if (error.response?.status === 401) {
      const publicPaths = ['/', '/mentors', '/our-why', '/privacy', '/terms', '/contact', '/login', '/signup', '/mentor-signup', '/auth/google/callback'];
      const isPublicPath = publicPaths.includes(window.location.pathname)
        || window.location.pathname.startsWith('/mentor/')
        || window.location.pathname.startsWith('/reset-password/');

      if (!isPublicPath) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
