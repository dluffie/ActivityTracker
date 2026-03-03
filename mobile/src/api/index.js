import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/theme';

const API = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
API.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor — handle 401
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await AsyncStorage.multiRemove(['token', 'user']);
            // Navigation will be handled by AuthContext
        }
        return Promise.reject(error);
    }
);

// ==================== AUTH ====================
export const authAPI = {
    register: (data) => API.post('/auth/register', data),
    verifyOtp: (data) => API.post('/auth/verify-otp', data),
    login: (data) => API.post('/auth/login', data),
    getMe: () => API.get('/auth/me'),
    resendOtp: (data) => API.post('/auth/resend-otp', data),
};

// ==================== ACTIVITY ====================
export const activityAPI = {
    upload: (data) => API.post('/activity/upload', data),
    getMy: (params) => API.get('/activity/my', { params }),
    getStats: () => API.get('/activity/stats/me'),
    getById: (id) => API.get(`/activity/${id}`),
    resubmit: (id, data) => API.put(`/activity/${id}/resubmit`, data),
    aiExtract: (data) => API.post('/activity/ai-extract', data),
};

// ==================== USER ====================
export const userAPI = {
    getProfile: () => API.get('/user/profile'),
    updateProfile: (data) => API.put('/user/profile', data),
};

// ==================== TEACHER ====================
export const teacherAPI = {
    subscribeClasses: (data) => API.post('/teacher/subscribe-classes', data),
    getMyClasses: () => API.get('/teacher/my-classes'),
    getStudents: (params) => API.get('/teacher/students', { params }),
    getDashboardStats: () => API.get('/teacher/dashboard-stats'),
    getPendingRegistrations: (params) => API.get('/teacher/pending-registrations', { params }),
    sendReminder: (data) => API.post('/teacher/send-reminder', data),
    verifyProfile: (id, data) => API.put(`/teacher/verify-profile/${id}`, data),
    getPendingActivities: (params) => API.get('/teacher/pending-activities', { params }),
    reviewActivity: (id, data) => API.put(`/teacher/review-activity/${id}`, data),
};

// ==================== ADMIN ====================
export const adminAPI = {
    getStats: () => API.get('/admin/stats'),
    getRules: () => API.get('/admin/rules'),
    createRule: (data) => API.post('/admin/rules', data),
    updateRule: (id, data) => API.put(`/admin/rules/${id}`, data),
    deleteRule: (id) => API.delete(`/admin/rules/${id}`),
    getUsers: (params) => API.get('/admin/users', { params }),
    createUser: (data) => API.post('/admin/users', data),
    updateUser: (id, data) => API.put(`/admin/users/${id}`, data),
    deleteUser: (id) => API.delete(`/admin/users/${id}`),
    getAuditLogs: (params) => API.get('/admin/audit-logs', { params }),
};

// ==================== NOTIFICATIONS ====================
export const notificationAPI = {
    getAll: (params) => API.get('/notifications', { params }),
    markRead: (id) => API.put(`/notifications/${id}/read`),
    markAllRead: () => API.put('/notifications/read-all'),
};

export default API;
