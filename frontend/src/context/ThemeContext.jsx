import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userAPI } from '../api';

const ThemeContext = createContext(null);

const STUDENT_THEMES = ['light', 'dark', 'cyberpunk', 'brutalist'];
const DEFAULT_THEMES = ['light', 'dark'];

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(() => {
        const saved = localStorage.getItem('theme');
        return [...STUDENT_THEMES].includes(saved) ? saved : 'light';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const setTheme = useCallback((newTheme) => {
        if ([...STUDENT_THEMES].includes(newTheme)) {
            setThemeState(newTheme);

            // Save to server (fire and forget, don't block UI)
            userAPI.saveTheme(newTheme).catch(() => {
                // Silently fail — localStorage still works as fallback
            });
        }
    }, []);

    // Load saved theme from user profile (called after login)
    const loadUserTheme = useCallback((themePreference) => {
        if (themePreference && [...STUDENT_THEMES].includes(themePreference)) {
            setThemeState(themePreference);
            localStorage.setItem('theme', themePreference);
            document.documentElement.setAttribute('data-theme', themePreference);
        }
    }, []);

    const toggleTheme = (role) => {
        setThemeState(prev => {
            const order = (role === 'student') ? STUDENT_THEMES : DEFAULT_THEMES;
            const idx = order.indexOf(prev);
            // If current theme isn't in this role's list, reset to first
            if (idx === -1) return order[0];
            const newTheme = order[(idx + 1) % order.length];

            // Save to server
            userAPI.saveTheme(newTheme).catch(() => { });

            return newTheme;
        });
    };

    const isCyberpunk = theme === 'cyberpunk';
    const isBrutalist = theme === 'brutalist';

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isCyberpunk, isBrutalist, loadUserTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
