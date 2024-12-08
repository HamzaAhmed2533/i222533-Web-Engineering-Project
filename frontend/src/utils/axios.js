import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:5000'
});

instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Request with token:', config.headers.Authorization); // Debug log
        }
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

instance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Response error:', error.response?.status, error.response?.data); // Debug log
        if (error.response?.status === 401) {
            if (!window.location.pathname.includes('/login')) {
                console.log('Unauthorized, redirecting to login'); // Debug log
                localStorage.clear();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default instance; 