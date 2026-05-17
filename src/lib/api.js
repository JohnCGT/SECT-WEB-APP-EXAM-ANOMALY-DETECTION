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

export const fetchCsrfToken = () =>
    axios.get(`${BASE_URL}/sanctum/csrf-cookie`, {
        withCredentials: true,
    });

const getXsrfToken = () => {
    const match = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
};

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

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const isAuthRoute =
                error.config?.url?.includes('/login') ||
                error.config?.url?.includes('/register');

            if (!isAuthRoute) {
                // Session expired — redirect to login.
                // No localStorage to clean up; the session cookie
                // will be cleared by the server on the next /logout call
                // or will simply be ignored as unauthenticated.
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default API;
