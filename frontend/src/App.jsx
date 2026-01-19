import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout';
import { Loading } from './components/ui';

// Auth Pages
import { Login, Signup } from './pages/auth';

// Student Pages
import { StudentDashboard, UploadActivity, MyActivities } from './pages/student';
import Profile from './pages/Profile';

// Teacher Pages
import {
  TeacherDashboard,
  Verification,
  StudentManagement,
  StudentVerification,
  ClassSubscription,
  SendReminders
} from './pages/teacher';

// Admin Pages
import {
  AdminDashboard,
  UserManagement,
  RulesManagement,
  Analytics,
  AuditLogs,
  Settings
} from './pages/admin';

import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <Loading fullScreen text="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard
    switch (user?.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'teacher':
        return <Navigate to="/teacher" replace />;
      default:
        return <Navigate to="/student" replace />;
    }
  }

  return children;
};

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <Loading fullScreen text="Loading..." />;
  }

  if (isAuthenticated) {
    switch (user?.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'teacher':
        return <Navigate to="/teacher" replace />;
      default:
        return <Navigate to="/student" replace />;
    }
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute><Signup /></PublicRoute>
      } />

      {/* Student Routes */}
      <Route path="/student" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<StudentDashboard />} />
        <Route path="upload" element={<UploadActivity />} />
        <Route path="activities" element={<MyActivities />} />
      </Route>

      {/* Teacher Routes */}
      <Route path="/teacher" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<TeacherDashboard />} />
        <Route path="verification" element={<Verification />} />
        <Route path="verify-students" element={<StudentVerification />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="classes" element={<ClassSubscription />} />
        <Route path="reminders" element={<SendReminders />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="rules" element={<RulesManagement />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="audit" element={<AuditLogs />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Profile Route - Accessible by all authenticated users */}
      <Route path="/profile" element={
        <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
          <Layout><Profile /></Layout>
        </ProtectedRoute>
      } />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
