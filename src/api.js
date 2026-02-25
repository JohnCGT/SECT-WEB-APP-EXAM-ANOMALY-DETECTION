import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://sectexam.app';

const API = axios.create({
    baseURL: `${BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
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

// Track retry state to prevent infinite loops
let isRetryingCsrf = false;

// Handle global errors
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        // ── 419: CSRF token missing/expired — refresh and retry once ─────────
        if (error.response?.status === 419 && !isRetryingCsrf) {
            isRetryingCsrf = true;
            try {
                await fetchCsrfToken();
                const token = getXsrfToken();
                const config = error.config;
                if (token) {
                    config.headers['X-XSRF-TOKEN'] = token;
                }
                return await API.request(config);
            } catch (retryError) {
                return Promise.reject(retryError);
            } finally {
                isRetryingCsrf = false;
            }
        }

        // ── 401: Unauthenticated ──────────────────────────────────────────────
        if (error.response?.status === 401) {
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