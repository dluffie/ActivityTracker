import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout';
import { Loading } from './components/ui';
import MaintenancePage from './pages/MaintenancePage';

// Auth Pages
import { Login, Signup, ForgotPassword } from './pages/auth';
import LandingPage from './pages/LandingPage';

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
  SendReminders,
  SubmitForStudent
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
      <Route path="/forgot-password" element={
        <PublicRoute><ForgotPassword /></PublicRoute>
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
        <Route path="submit" element={<SubmitForStudent />} />
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

      {/* Landing Page - redirect logged-in users to dashboard */}
      <Route path="/" element={
        <PublicRoute><LandingPage /></PublicRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceChecked, setMaintenanceChecked] = useState(false);

  useEffect(() => {
    // Check maintenance status FIRST before anything else
    const checkMaintenance = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${API_URL}/maintenance-status`);
        const data = await res.json();
        if (data.maintenance) {
          // Only block logged-in non-admin users
          // Public pages (landing, login, signup, forgot-password) must stay accessible
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            const user = JSON.parse(savedUser);
            if (user.role !== 'admin') {
              // Logged-in student/teacher → show maintenance
              setIsMaintenance(true);
            }
            // Admin → bypass maintenance
          }
          // Not logged in → let them through to access login/landing
        }
      } catch {
        // If check fails, don't block the app
      }
      setMaintenanceChecked(true);
    };

    checkMaintenance();

    // Also listen for 503 responses during active sessions
    const handleMaintenance = () => {
      // Only show maintenance page if logged-in as non-admin
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.role !== 'admin') {
          setIsMaintenance(true);
        }
      }
    };
    window.addEventListener('maintenance-mode', handleMaintenance);
    return () => window.removeEventListener('maintenance-mode', handleMaintenance);
  }, []);

  if (isMaintenance) {
    return <MaintenancePage />;
  }

  if (!maintenanceChecked) {
    return null; // Brief blank while checking — no loading spinner flash
  }

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
