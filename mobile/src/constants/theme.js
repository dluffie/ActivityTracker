// ==================== THEME PALETTES ====================

const LIGHT_COLORS = {
    // Primary purple palette
    primary: '#7c3aed',
    primaryDark: '#5b21b6',
    primaryLight: '#a78bfa',
    primaryBg: '#f3f0ff',
    primaryBorder: '#ddd6fe',

    // Accent
    accent: '#f5e6d3',
    accentDark: '#e8d5c0',
    accentText: '#92400e',

    // Status
    success: '#22c55e',
    successBg: '#f0fdf4',
    warning: '#f59e0b',
    warningBg: '#fffbeb',
    error: '#ef4444',
    errorBg: '#fef2f2',
    info: '#8b5cf6',
    infoBg: '#f5f3ff',

    // Neutrals
    white: '#ffffff',
    background: '#faf8ff',
    card: '#ffffff',
    border: '#e8e0f0',
    borderLight: '#f3f0ff',

    // Text
    textPrimary: '#1e1b2e',
    textSecondary: '#6b6280',
    textTertiary: '#a09ab0',
    textInverse: '#ffffff',

    // Gradients
    gradientPrimary: ['#7c3aed', '#a78bfa'],
    gradientSuccess: ['#16a34a', '#22c55e'],
    gradientWarning: ['#d97706', '#f59e0b'],
    gradientError: ['#dc2626', '#ef4444'],
    gradientAccent: ['#e9d5ff', '#f3e8ff'],

    // Tab bar
    tabBar: '#ffffff',
    tabBarBorder: '#e8e0f0',
};

const DARK_COLORS = {
    primary: '#a78bfa',
    primaryDark: '#7c3aed',
    primaryLight: '#c4b5fd',
    primaryBg: 'rgba(124, 58, 237, 0.15)',
    primaryBorder: 'rgba(124, 58, 237, 0.3)',

    accent: '#2d2a3e',
    accentDark: '#1e1b2e',
    accentText: '#fbbf24',

    success: '#34d399',
    successBg: 'rgba(34, 197, 94, 0.1)',
    warning: '#fbbf24',
    warningBg: 'rgba(245, 158, 11, 0.1)',
    error: '#f87171',
    errorBg: 'rgba(239, 68, 68, 0.1)',
    info: '#a78bfa',
    infoBg: 'rgba(139, 92, 246, 0.1)',

    white: '#1e1b2e',
    background: '#0f0d1a',
    card: '#1e1b2e',
    border: '#2d2a3e',
    borderLight: '#252236',

    textPrimary: '#f0ecff',
    textSecondary: '#a09ab0',
    textTertiary: '#6b6280',
    textInverse: '#0f0d1a',

    gradientPrimary: ['#7c3aed', '#a78bfa'],
    gradientSuccess: ['#059669', '#34d399'],
    gradientWarning: ['#d97706', '#fbbf24'],
    gradientError: ['#dc2626', '#f87171'],
    gradientAccent: ['#2d2a3e', '#1e1b2e'],

    tabBar: '#1e1b2e',
    tabBarBorder: '#2d2a3e',
};

const CYBER_COLORS = {
    primary: '#00f0ff',
    primaryDark: '#00b8d4',
    primaryLight: '#67e8f9',
    primaryBg: 'rgba(0, 240, 255, 0.08)',
    primaryBorder: 'rgba(0, 240, 255, 0.2)',

    accent: '#ff00ff',
    accentDark: '#cc00cc',
    accentText: '#ff00ff',

    success: '#00ff88',
    successBg: 'rgba(0, 255, 136, 0.08)',
    warning: '#ffaa00',
    warningBg: 'rgba(255, 170, 0, 0.08)',
    error: '#ff3366',
    errorBg: 'rgba(255, 51, 102, 0.08)',
    info: '#00f0ff',
    infoBg: 'rgba(0, 240, 255, 0.08)',

    white: '#0a0a1a',
    background: '#050510',
    card: '#0a0a1a',
    border: 'rgba(0, 240, 255, 0.12)',
    borderLight: 'rgba(0, 240, 255, 0.06)',

    textPrimary: '#e0f0ff',
    textSecondary: 'rgba(0, 240, 255, 0.6)',
    textTertiary: 'rgba(0, 240, 255, 0.35)',
    textInverse: '#050510',

    gradientPrimary: ['#00f0ff', '#ff00ff'],
    gradientSuccess: ['#00cc66', '#00ff88'],
    gradientWarning: ['#ff8800', '#ffaa00'],
    gradientError: ['#cc0033', '#ff3366'],
    gradientAccent: ['#0a0a1a', '#1a0a2e'],

    tabBar: '#0a0a1a',
    tabBarBorder: 'rgba(0, 240, 255, 0.12)',
};

const BRUTAL_COLORS = {
    primary: '#1a1a1a',
    primaryDark: '#000000',
    primaryLight: '#444444',
    primaryBg: 'rgba(26, 26, 26, 0.06)',
    primaryBorder: '#1a1a1a',

    accent: '#ff6b35',
    accentDark: '#cc5229',
    accentText: '#ff6b35',

    success: '#2d6a4f',
    successBg: 'rgba(45, 106, 79, 0.08)',
    warning: '#e76f51',
    warningBg: 'rgba(231, 111, 81, 0.08)',
    error: '#d32f2f',
    errorBg: 'rgba(211, 47, 47, 0.08)',
    info: '#1a1a1a',
    infoBg: 'rgba(26, 26, 26, 0.06)',

    white: '#f5f0e8',
    background: '#ece6d9',
    card: '#f5f0e8',
    border: '#1a1a1a',
    borderLight: 'rgba(26, 26, 26, 0.15)',

    textPrimary: '#1a1a1a',
    textSecondary: '#555555',
    textTertiary: '#888888',
    textInverse: '#f5f0e8',

    gradientPrimary: ['#1a1a1a', '#444444'],
    gradientSuccess: ['#1b4332', '#2d6a4f'],
    gradientWarning: ['#bc4749', '#e76f51'],
    gradientError: ['#9b2226', '#d32f2f'],
    gradientAccent: ['#f5f0e8', '#ece6d9'],

    tabBar: '#f5f0e8',
    tabBarBorder: '#1a1a1a',
};

export const THEMES = {
    light: LIGHT_COLORS,
    dark: DARK_COLORS,
    cyberpunk: CYBER_COLORS,
    brutalist: BRUTAL_COLORS,
};

// Default export for backward compatibility
export const COLORS = LIGHT_COLORS;

export const FONTS = {
    regular: { fontSize: 14, color: LIGHT_COLORS.textPrimary },
    medium: { fontSize: 14, fontWeight: '500', color: LIGHT_COLORS.textPrimary },
    semibold: { fontSize: 14, fontWeight: '600', color: LIGHT_COLORS.textPrimary },
    bold: { fontSize: 14, fontWeight: '700', color: LIGHT_COLORS.textPrimary },
    h1: { fontSize: 28, fontWeight: '700', color: LIGHT_COLORS.textPrimary },
    h2: { fontSize: 22, fontWeight: '700', color: LIGHT_COLORS.textPrimary },
    h3: { fontSize: 18, fontWeight: '600', color: LIGHT_COLORS.textPrimary },
    caption: { fontSize: 12, color: LIGHT_COLORS.textTertiary },
    small: { fontSize: 13, color: LIGHT_COLORS.textSecondary },
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

export const RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 999,
};

export const SHADOWS = {
    sm: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    lg: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
    },
};

// API URL - Update this to your backend
export const API_BASE_URL = 'https://activitytracker-q7vf.onrender.com/api';

// Activity types matching backend enums
export const ACTIVITY_TYPES = [
    { value: 'ncc', label: 'NCC' },
    { value: 'nss', label: 'NSS' },
    { value: 'sports', label: 'Sports & Games' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'online_courses', label: 'Online Courses' },
    { value: 'competitions', label: 'Competitions' },
    { value: 'conferences', label: 'Conferences' },
    { value: 'paper_presentation', label: 'Paper Presentation' },
    { value: 'leadership', label: 'Leadership' },
    { value: 'entrepreneurship', label: 'Entrepreneurship' },
    { value: 'disaster_management', label: 'Disaster Management' },
    { value: 'custom', label: 'Other' },
];

export const ACTIVITY_LEVELS = [
    { value: 'college', label: 'College' },
    { value: 'zonal', label: 'Zonal' },
    { value: 'district', label: 'District' },
    { value: 'state', label: 'State' },
    { value: 'national', label: 'National' },
    { value: 'international', label: 'International' },
];

export const BRANCHES = [
    'EC', 'ME', 'CT', 'CE',
];

export const SEMESTERS = [
    'S1', 'S2', 'S3', 'S4', 'S5', 'S6',
];
