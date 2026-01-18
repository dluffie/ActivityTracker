import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components/ui';
import { Mail, Lock, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

const Login = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated, user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        identifier: '',
        password: '',
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isAuthenticated && user) {
            // Redirect based on role
            switch (user.role) {
                case 'admin':
                    navigate('/admin');
                    break;
                case 'teacher':
                    navigate('/teacher');
                    break;
                default:
                    navigate('/student');
            }
        }
    }, [isAuthenticated, user, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.identifier.trim()) {
            newErrors.identifier = 'Email or Registration number is required';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            const user = await login(formData.identifier, formData.password);
            toast.success(`Welcome back, ${user.fullName}!`);

            // Navigate based on role
            switch (user.role) {
                case 'admin':
                    navigate('/admin');
                    break;
                case 'teacher':
                    navigate('/teacher');
                    break;
                default:
                    navigate('/student');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <div className="auth-logo">📊</div>
                    <h1>Welcome Back</h1>
                    <p>Sign in to continue to your dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <Input
                        label="Email or Registration Number"
                        name="identifier"
                        value={formData.identifier}
                        onChange={handleChange}
                        placeholder="Enter email or registration number"
                        icon={Mail}
                        error={errors.identifier}
                    />

                    <Input
                        label="Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        icon={Lock}
                        error={errors.password}
                    />

                    <div className="forgot-password">
                        <Link to="/forgot-password">Forgot password?</Link>
                    </div>

                    <Button
                        type="submit"
                        loading={loading}
                        fullWidth
                    >
                        Sign In
                    </Button>

                    <p className="auth-link">
                        Don't have an account? <Link to="/signup">Create one</Link>
                    </p>
                </form>
            </div>

            <div className="auth-decoration">
                <div className="decoration-content">
                    <h2>Activity Point Management</h2>
                    <p>Track, manage, and verify your academic activities seamlessly</p>
                    <div className="decoration-features">
                        <div className="feature">
                            <span className="feature-icon">🎯</span>
                            <span>Track Your Progress</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon">📊</span>
                            <span>Real-time Analytics</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon">🔔</span>
                            <span>Instant Notifications</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
