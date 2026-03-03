// Theme constants — soft lavender/purple palette inspired by reference design
export const COLORS = {
    // Primary purple palette
    primary: '#7c3aed',
    primaryDark: '#5b21b6',
    primaryLight: '#a78bfa',
    primaryBg: '#f3f0ff',
    primaryBorder: '#ddd6fe',

    // Accent — warm cream/beige tones
    accent: '#f5e6d3',
    accentDark: '#e8d5c0',
    accentText: '#92400e',

    // Status colors
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
};

export const FONTS = {
    regular: { fontSize: 14, color: COLORS.textPrimary },
    medium: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
    semibold: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
    bold: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
    h1: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary },
    h2: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
    h3: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary },
    caption: { fontSize: 12, color: COLORS.textTertiary },
    small: { fontSize: 13, color: COLORS.textSecondary },
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
