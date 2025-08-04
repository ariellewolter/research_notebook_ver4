import axios, { AxiosError, AxiosResponse } from 'axios';

// Configuration
const API_CONFIG = {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
};

// Create axios instance with base configuration
const api = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Retry logic for failed requests
const retryRequest = async (error: AxiosError, retryCount: number = 0): Promise<AxiosResponse> => {
    if (retryCount >= API_CONFIG.retryAttempts) {
        throw error;
    }

    // Only retry on network errors or 5xx server errors
    if (error.response && error.response.status < 500) {
        throw error;
    }

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * (retryCount + 1)));

    // Retry the request
    try {
        const config = error.config;
        if (!config) throw error;
        
        return await api.request(config);
    } catch (retryError) {
        return retryRequest(retryError as AxiosError, retryCount + 1);
    }
};

// Request interceptor for authentication and logging
api.interceptors.request.use(
    (config) => {
        // Add request ID for tracking
        config.metadata = { startTime: new Date() };
        
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);

        // Add authorization header if token exists
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling and retry logic
api.interceptors.response.use(
    (response) => {
        const duration = new Date().getTime() - response.config.metadata?.startTime?.getTime();
        console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);
        return response;
    },
    async (error: AxiosError) => {
        const duration = new Date().getTime() - error.config?.metadata?.startTime?.getTime();
        console.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status} (${duration}ms)`, {
            error: error.response?.data || error.message,
            status: error.response?.status,
            statusText: error.response?.statusText
        });

        // Handle specific error cases
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            window.location.href = '/login';
            return Promise.reject(new Error('Authentication required. Please log in again.'));
        }

        if (error.response?.status === 403) {
            return Promise.reject(new Error('Access denied. You do not have permission to perform this action.'));
        }

        if (error.response?.status === 404) {
            return Promise.reject(new Error('Resource not found. Please check the URL and try again.'));
        }

        if (error.response?.status >= 500) {
            return Promise.reject(new Error('Server error. Please try again later.'));
        }

        // Attempt retry for network errors or server errors
        if (!error.response || error.response.status >= 500) {
            try {
                return await retryRequest(error);
            } catch (retryError) {
                return Promise.reject(retryError);
            }
        }

        return Promise.reject(error);
    }
);

export default api; 