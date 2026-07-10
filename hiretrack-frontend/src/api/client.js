import axios from 'axios';

// Instantiate central Axios client reading from Vite environment configuration
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure response interceptor to handle session expirations (401)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      error.response.status === 401 &&
      !error.config.url.includes('/auth/login')
    ) {
      // Clear authentication cache
      localStorage.removeItem('token');
      delete client.defaults.headers.common['Authorization'];

      // Redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
