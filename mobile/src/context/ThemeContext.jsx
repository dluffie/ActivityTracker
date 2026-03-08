import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES } from '../constants/theme';
import { userAPI } from '../api';

const ThemeContext = createContext(null);

const VALID_THEMES = ['light', 'dark', 'cyberpunk', 'brutalist'];
const STUDENT_THEMES = ['light', 'dark', 'cyberpunk', 'brutalist'];
const DEFAULT_THEMES = ['light', 'dark'];

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [themeName, setThemeName] = useState('light');

    // Load saved theme on mount
    useEffect(() => {
        (async () => {
            try {
                const saved = await AsyncStorage.getItem('theme');
                if (saved && VALID_THEMES.includes(saved)) {
                    setThemeName(saved);
                }
            } catch { }
        })();
    }, []);

    const colors = THEMES[themeName] || THEMES.light;

    const setTheme = useCallback(async (newTheme) => {
        if (!VALID_THEMES.includes(newTheme)) return;
        setThemeName(newTheme);
        await AsyncStorage.setItem('theme', newTheme);
        // Sync to server (fire and forget)
        userAPI.saveTheme(newTheme).catch(() => { });
    }, []);

    const loadUserTheme = useCallback(async (themePreference) => {
        if (themePreference && VALID_THEMES.includes(themePreference)) {
            setThemeName(themePreference);
            await AsyncStorage.setItem('theme', themePreference);
        }
    }, []);

    const toggleTheme = useCallback(async (role) => {
        const order = role === 'student' ? STUDENT_THEMES : DEFAULT_THEMES;
        const idx = order.indexOf(themeName);
        const next = idx === -1 ? order[0] : order[(idx + 1) % order.length];
        setThemeName(next);
        await AsyncStorage.setItem('theme', next);
        userAPI.saveTheme(next).catch(() => { });
    }, [themeName]);

    return (
        <ThemeContext.Provider value={{
            themeName,
            colors,
            setTheme,
            toggleTheme,
            loadUserTheme,
            isCyberpunk: themeName === 'cyberpunk',
            isBrutalist: themeName === 'brutalist',
            isDark: themeName === 'dark',
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
