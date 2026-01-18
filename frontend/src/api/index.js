import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    verifyOtp: (data) => api.post('/auth/verify-otp', data),
    resendOtp: (email) => api.post('/auth/resend-otp', { email }),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    getOptions: () => api.get('/auth/options'),
};

// Activity API
export const activityAPI = {
    upload: (data) => api.post('/activity/upload', data),
    getMy: (params) => api.get('/activity/my', { params }),
    getPending: (params) => api.get('/activity/pending', { params }),
    getOne: (id) => api.get(`/activity/${id}`),
    approve: (id, data) => api.post(`/activity/approve/${id}`, data),
    reject: (id, data) => api.post(`/activity/reject/${id}`, data),
    requestCorrection: (id, data) => api.post(`/activity/correction/${id}`, data),
    edit: (id, data) => api.put(`/activity/edit/${id}`, data),
    getStats: () => api.get('/activity/stats/me'),
};

// User API
export const userAPI = {
    getProfile: () => api.get('/user/profile'),
    updateProfile: (data) => api.put('/user/profile', data),
    getUser: (id) => api.get(`/user/${id}`),
};

// Teacher API
export const teacherAPI = {
    subscribeClasses: (classes) => api.post('/teacher/subscribe-classes', { classes }),
    getMyClasses: () => api.get('/teacher/my-classes'),
    getStudents: (params) => api.get('/teacher/students', { params }),
    getPendingRegistrations: (params) => api.get('/teacher/pending-registrations', { params }),
    getDashboardStats: () => api.get('/teacher/dashboard-stats'),
    sendReminder: (data) => api.post('/teacher/send-reminder', data),
};

// Admin API
export const adminAPI = {
    getRules: () => api.get('/admin/rules'),
    createRule: (data) => api.post('/admin/rules', data),
    updateRule: (id, data) => api.put(`/admin/rules/${id}`, data),
    deleteRule: (id) => api.delete(`/admin/rules/${id}`),
    getUsers: (params) => api.get('/admin/users', { params }),
    createUser: (data) => api.post('/admin/users', data),
    updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    getStats: () => api.get('/admin/stats'),
    getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
};

// Notification API
export const notificationAPI = {
    getAll: (params) => api.get('/notifications', { params }),
    markRead: (id) => api.put(`/notifications/${id}/read`),
    markAllRead: () => api.put('/notifications/read-all'),
};

export default api;
