import axios from 'axios';

// Use environment variable so this never breaks when Vite changes ports.
// Add VITE_API_URL=http://localhost:8000 to your frontend .env file.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const API = axios.create({
    baseURL: `${BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true, // Required: sends session cookies cross-origin
});

/**
 * Fetches the Sanctum CSRF cookie from Laravel.
 * Must be called before any POST/PUT/DELETE request.
 */
export const fetchCsrfToken = () =>
    axios.get(`${BASE_URL}/sanctum/csrf-cookie`, {
        withCredentials: true,
    });

/**
 * Reads the XSRF-TOKEN cookie value set by Laravel after fetchCsrfToken().
 */
const getXsrfToken = () => {
    const match = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
};

// Attach CSRF token to every mutating request automatically
API.interceptors.request.use(
    (config) => {
        const token = getXsrfToken();
        if (token) {
            config.headers['X-XSRF-TOKEN'] = token;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle global auth errors
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Do NOT redirect if the 401 came from login/register themselves —
            // that would cause a redirect loop on bad credentials
            const isAuthRoute =
                error.config?.url?.includes('/login') ||
                error.config?.url?.includes('/register');

            if (!isAuthRoute) {
                localStorage.removeItem('user');
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default API;