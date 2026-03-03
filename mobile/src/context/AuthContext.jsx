import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const savedUser = await AsyncStorage.getItem('user');

            if (token && savedUser) {
                try {
                    const response = await authAPI.getMe();
                    const freshUser = response.data.user;
                    setUser(freshUser);
                    await AsyncStorage.setItem('user', JSON.stringify(freshUser));
                    setIsAuthenticated(true);
                } catch {
                    await logout();
                }
            }
        } catch (err) {
            console.error('Auth check failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const login = async (identifier, password) => {
        const response = await authAPI.login({ identifier, password });
        // Backend returns { user: { token, id, fullName, ... } }
        const { token, ...userData } = response.data.user;

        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(userData));

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
        // Backend returns { user: { token, id, fullName, ... } }
        const { token, ...userData } = response.data.user;

        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(userData));

        setUser(userData);
        setIsAuthenticated(true);
        return userData;
    };

    const logout = async () => {
        await AsyncStorage.multiRemove(['token', 'user']);
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUser = async (updatedData) => {
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        await AsyncStorage.setItem('user', JSON.stringify(newUser));
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated,
                login,
                register,
                verifyOtp,
                logout,
                updateUser,
                checkAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
