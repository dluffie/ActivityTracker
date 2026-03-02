import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

const STUDENT_THEMES = ['light', 'dark', 'cyberpunk'];
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

    const setTheme = (newTheme) => {
        if ([...STUDENT_THEMES].includes(newTheme)) {
            setThemeState(newTheme);
        }
    };

    const toggleTheme = (role) => {
        setThemeState(prev => {
            const order = (role === 'student') ? STUDENT_THEMES : DEFAULT_THEMES;
            const idx = order.indexOf(prev);
            // If current theme isn't in this role's list, reset to first
            if (idx === -1) return order[0];
            return order[(idx + 1) % order.length];
        });
    };

    const isCyberpunk = theme === 'cyberpunk';

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isCyberpunk }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
