import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface User {
    id: string;
    username: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

// Loading component
const LoadingSpinner: React.FC = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#666'
    }}>
        <div style={{ textAlign: 'center' }}>
            <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
            }}></div>
            <div>Loading...</div>
        </div>
        <style>{`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Token refresh function
    const refreshToken = useCallback(async () => {
        if (isRefreshing) return; // Prevent multiple simultaneous refresh attempts
        
        setIsRefreshing(true);
        try {
            const currentToken = localStorage.getItem('authToken');
            if (!currentToken) {
                throw new Error('No token to refresh');
            }

            const response = await fetch(`${(globalThis as any).API_BASE_URL || 'http://localhost:3001/api'}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            setToken(data.token);
            setUser(data.user);
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('authUser', JSON.stringify(data.user));
            
            console.log('Token refreshed successfully');
        } catch (error) {
            console.error('Token refresh failed:', error);
            logout();
        } finally {
            setIsRefreshing(false);
        }
    }, [isRefreshing]);

    // Enhanced token verification with retry logic
    const verifyToken = useCallback(async (tokenToVerify: string, retryCount: number = 0): Promise<boolean> => {
        try {
            const response = await fetch(`${(globalThis as any).API_BASE_URL || 'http://localhost:3001/api'}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${tokenToVerify}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                return true;
            }

            // If token is invalid and we haven't tried refreshing yet
            if (response.status === 401 && retryCount === 0) {
                try {
                    await refreshToken();
                    return true;
                } catch (refreshError) {
                    console.error('Token refresh failed during verification:', refreshError);
                    return false;
                }
            }

            return false;
        } catch (error) {
            console.error('Token verification failed:', error);
            return false;
        }
    }, [refreshToken]);

    // Initialize auth state
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const savedToken = localStorage.getItem('authToken');
                const savedUser = localStorage.getItem('authUser');

                if (savedToken && savedUser) {
                    try {
                        const userData = JSON.parse(savedUser);
                        
                        // Verify token is still valid
                        const isValid = await verifyToken(savedToken);
                        if (isValid) {
                            setToken(savedToken);
                            setUser(userData);
                        } else {
                            console.log('Saved token is invalid, clearing auth state');
                            logout();
                        }
                    } catch (error) {
                        console.error('Error parsing saved user data or token verification failed:', error);
                        logout();
                    }
                }
            } catch (error) {
                console.error('Error during auth initialization:', error);
                logout();
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, [verifyToken, logout]);

    // Auto-refresh token every 14 minutes (assuming 15-minute token expiry)
    useEffect(() => {
        if (!token) return;

        const refreshInterval = setInterval(() => {
            refreshToken();
        }, 14 * 60 * 1000); // 14 minutes

        return () => clearInterval(refreshInterval);
    }, [token, refreshToken]);

    const login = useCallback((newToken: string, userData: User) => {
        console.log('AuthContext login called with:', { newToken, userData });
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('authUser', JSON.stringify(userData));
        console.log('Login completed, user state updated');
    }, []);

    const logout = useCallback(() => {
        console.log('Logging out user');
        setToken(null);
        setUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
    }, []);

    const value: AuthContextType = {
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        isLoading: isLoading || isRefreshing,
        refreshToken,
    };

    // Debug logging - only in development
    if (process.env.NODE_ENV === 'development') {
        console.log('AuthContext state:', {
            user,
            token: token ? 'present' : 'null',
            isAuthenticated: !!token && !!user,
            hasUser: !!user,
            hasToken: !!token,
            isLoading,
            isRefreshing
        });
    }

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 