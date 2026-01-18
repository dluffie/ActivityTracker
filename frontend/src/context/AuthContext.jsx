import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check auth on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            try {
                const response = await authAPI.getMe();
                setUser(response.data.user);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Auth check failed:', error);
                logout();
            }
        }
        setLoading(false);
    };

    const login = async (identifier, password) => {
        const response = await authAPI.login({ identifier, password });
        const { token, ...userData } = response.data.user;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));

        setUser(userData);
        setIsAuthenticated(true);

        return userData;
    };

    const register = async (data) => {
        const response = await authAPI.register(data);
        return response.data;
    };

    const verifyOtp = async (email, otp) => {
        const response = await authAPI.verifyOtp({ email, otp });
        const { token, ...userData } = response.data.user;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));

        setUser(userData);
        setIsAuthenticated(true);

        return userData;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUser = (updatedData) => {
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        register,
        verifyOtp,
        logout,
        updateUser,
        checkAuth,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
