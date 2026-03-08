import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { userAPI } from '../api';

const ThemeContext = createContext(null);

const STUDENT_THEMES = ['light', 'dark', 'cyberpunk', 'brutalist'];
const DEFAULT_THEMES = ['light', 'dark'];
const TRANSITION_SEQUENCE = ['light', 'dark', 'cyberpunk', 'brutalist'];
const TRANSITION_STEP_MS = 900;

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

    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionThemeName, setTransitionThemeName] = useState('');
    const transitionTimers = useRef([]);

    // Sound toggle — persisted in localStorage
    const [soundEnabled, setSoundEnabled] = useState(() => {
        const saved = localStorage.getItem('soundEnabled');
        return saved === null ? true : saved === 'true';
    });

    const toggleSound = useCallback(() => {
        setSoundEnabled(prev => {
            const next = !prev;
            localStorage.setItem('soundEnabled', String(next));
            return next;
        });
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const setTheme = useCallback((newTheme) => {
        if ([...STUDENT_THEMES].includes(newTheme)) {
            setThemeState(newTheme);
            userAPI.saveTheme(newTheme).catch(() => { });
        }
    }, []);

    // Load saved theme from user profile (instant, no animation)
    const loadUserTheme = useCallback((themePreference) => {
        if (themePreference && [...STUDENT_THEMES].includes(themePreference)) {
            setThemeState(themePreference);
            localStorage.setItem('theme', themePreference);
            document.documentElement.setAttribute('data-theme', themePreference);
        }
    }, []);

    /**
     * Fire-and-forget theme transition animation.
     * Cycles through all themes, then lands on the user's saved theme.
     * All logic is self-contained — no external await needed.
     */
    const playThemeTransition = useCallback((targetTheme) => {
        const finalTheme = (targetTheme && [...STUDENT_THEMES].includes(targetTheme))
            ? targetTheme : 'light';

        // Clear any existing transition timers
        transitionTimers.current.forEach(t => clearTimeout(t));
        transitionTimers.current = [];

        setIsTransitioning(true);

        // Immediately switch to 'light' so user doesn't see a flash of their saved theme
        setThemeState('light');
        setTransitionThemeName('light');
        document.documentElement.setAttribute('data-theme', 'light');

        // Delay to let dashboard fully render before cycling continues
        const INITIAL_DELAY = 1200;

        // Schedule remaining theme steps (skip light since we already set it)
        TRANSITION_SEQUENCE.slice(1).forEach((t, i) => {
            const timer = setTimeout(() => {
                setThemeState(t);
                setTransitionThemeName(t);
                document.documentElement.setAttribute('data-theme', t);
            }, INITIAL_DELAY + (i * TRANSITION_STEP_MS));
            transitionTimers.current.push(timer);
        });

        // After all themes cycle, land on the final saved theme
        const remainingSteps = TRANSITION_SEQUENCE.length - 1; // we already showed 'light'
        const landingTime = INITIAL_DELAY + (remainingSteps * TRANSITION_STEP_MS);
        const landTimer = setTimeout(() => {
            setThemeState(finalTheme);
            setTransitionThemeName(finalTheme);
            document.documentElement.setAttribute('data-theme', finalTheme);
            localStorage.setItem('theme', finalTheme);
        }, landingTime);
        transitionTimers.current.push(landTimer);

        // Mark transition as done
        const dismissTime = landingTime + TRANSITION_STEP_MS;
        const dismissTimer = setTimeout(() => {
            setIsTransitioning(false);
            setTransitionThemeName('');
        }, dismissTime);
        transitionTimers.current.push(dismissTimer);
    }, []);

    const toggleTheme = (role) => {
        setThemeState(prev => {
            const order = (role === 'student') ? STUDENT_THEMES : DEFAULT_THEMES;
            const idx = order.indexOf(prev);
            if (idx === -1) return order[0];
            const newTheme = order[(idx + 1) % order.length];
            userAPI.saveTheme(newTheme).catch(() => { });
            return newTheme;
        });
    };

    const isCyberpunk = theme === 'cyberpunk';
    const isBrutalist = theme === 'brutalist';

    return (
        <ThemeContext.Provider value={{
            theme, toggleTheme, setTheme, isCyberpunk, isBrutalist,
            loadUserTheme, playThemeTransition, isTransitioning, transitionThemeName,
            soundEnabled, toggleSound
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
