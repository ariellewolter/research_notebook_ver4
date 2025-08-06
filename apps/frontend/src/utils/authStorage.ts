// Authentication storage utility for offline mode support

const AUTH_TOKEN_KEY = 'authToken';
const USER_DATA_KEY = 'userData';

export interface UserData {
    id: string;
    username: string;
    email: string;
    role: string;
}

export interface AuthData {
    token: string;
    user: UserData;
}

// Store authentication data in local storage (for offline mode)
export const storeAuthData = (authData: AuthData): void => {
    try {
        localStorage.setItem(AUTH_TOKEN_KEY, authData.token);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(authData.user));
    } catch (error) {
        console.error('Failed to store auth data in localStorage:', error);
    }
};

// Retrieve authentication token from local storage
export const getStoredToken = (): string | null => {
    try {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
        console.error('Failed to retrieve token from localStorage:', error);
        return null;
    }
};

// Retrieve user data from local storage
export const getStoredUserData = (): UserData | null => {
    try {
        const userData = localStorage.getItem(USER_DATA_KEY);
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Failed to retrieve user data from localStorage:', error);
        return null;
    }
};

// Check if user is authenticated (offline check)
export const isAuthenticatedOffline = (): boolean => {
    const token = getStoredToken();
    const userData = getStoredUserData();
    return !!(token && userData);
};

// Clear authentication data from local storage
export const clearAuthData = (): void => {
    try {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
    } catch (error) {
        console.error('Failed to clear auth data from localStorage:', error);
    }
};

// Get authorization header for API requests
export const getAuthHeader = (): { Authorization: string } | null => {
    const token = getStoredToken();
    return token ? { Authorization: `Bearer ${token}` } : null;
};

// Validate stored token (basic validation)
export const validateStoredToken = (): boolean => {
    const token = getStoredToken();
    if (!token) return false;
    
    try {
        // Basic JWT structure validation
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        
        // Check if token is expired (basic check)
        const payload = JSON.parse(atob(parts[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        return payload.exp > currentTime;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
};

// Sync authentication data between cookie and local storage
export const syncAuthData = (authData: AuthData): void => {
    // Store in local storage for offline access
    storeAuthData(authData);
    
    // Note: Cookie is set by the server, this is just for local storage backup
    console.log('Auth data synced to local storage for offline mode');
}; 