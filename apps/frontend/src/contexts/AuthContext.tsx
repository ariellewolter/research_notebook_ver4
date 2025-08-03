import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing token on app load
        const savedToken = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('authUser');

        if (savedToken && savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                setToken(savedToken);
                setUser(userData);
                
                // Verify token is still valid
                verifyToken(savedToken);
            } catch (error) {
                console.error('Error parsing saved user data:', error);
                localStorage.removeItem('authToken');
                localStorage.removeItem('authUser');
            }
        }
        setIsLoading(false);
    }, []);

    const verifyToken = async (tokenToVerify: string) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000/api'}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${tokenToVerify}`,
                },
            });

            if (!response.ok) {
                throw new Error('Token invalid');
            }

            const data = await response.json();
            setUser(data.user);
        } catch (error) {
            console.error('Token verification failed:', error);
            logout();
        }
    };

    const login = (newToken: string, userData: User) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('authUser', JSON.stringify(userData));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
    };

    const value: AuthContextType = {
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
    };

    if (isLoading) {
        return <div>Loading...</div>; // You can replace this with a proper loading component
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 