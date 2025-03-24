import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Add request interceptor for debugging
api.interceptors.request.use(
    config => {
        console.log('Making request to:', config.url);
        return config;
    },
    error => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Update response interceptor
api.interceptors.response.use(
    response => {
        console.log('Received response from:', response.config.url);
        return response;
    },
    error => {
        console.error('API Error:', error);
        if (error.response) {
            console.error('Error response:', error.response.data);
        }
        return Promise.reject(error);
    }
);

export default api; 