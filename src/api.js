import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,  // ← IMPORTANT: Sends cookies automatically
});

// NO TOKEN INTERCEPTOR - cookies are sent automatically

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default API;