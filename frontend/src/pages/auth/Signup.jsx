import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api';
import { Button, Input, Select } from '../../components/ui';
import { Mail, Lock, User, Calendar, Hash, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

const Signup = () => {
    const navigate = useNavigate();
    const { isAuthenticated, verifyOtp } = useAuth();
    const [step, setStep] = useState(1); // 1: form, 2: OTP
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState({ branches: [], semesters: [], sections: [] });

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        registrationNumber: '',
        branch: '',
        semester: '',
        section: '',
        dob: '',
    });

    const [otp, setOtp] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/student');
        }
        fetchOptions();
    }, [isAuthenticated, navigate]);

    const fetchOptions = async () => {
        try {
            const response = await authAPI.getOptions();
            setOptions(response.data);
        } catch (error) {
            console.error('Failed to fetch options:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Only allow numeric input for registration number
        if (name === 'registrationNumber') {
            const numericValue = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';

        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.registrationNumber.trim()) {
            newErrors.registrationNumber = 'Registration number is required';
        } else if (!/^\d+$/.test(formData.registrationNumber)) {
            newErrors.registrationNumber = 'Registration number must contain only numbers';
        }

        if (!formData.branch) newErrors.branch = 'Branch is required';
        if (!formData.semester) newErrors.semester = 'Semester is required';
        if (!formData.dob) newErrors.dob = 'Date of birth is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            await authAPI.register({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                registrationNumber: formData.registrationNumber,
                branch: formData.branch,
                semester: formData.semester,
                section: formData.section,
                dob: formData.dob,
            });

            toast.success('OTP sent to your email!');
            setStep(2);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();

        if (otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        try {
            await verifyOtp(formData.email, otp);
            toast.success('Registration successful!');
            navigate('/student');
        } catch (error) {
            toast.error(error.response?.data?.message || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            await authAPI.resendOtp(formData.email);
            toast.success('New OTP sent!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resend OTP');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <div className="auth-logo">📊</div>
                    <h1>Create Account</h1>
                    <p>Join the Activity Point Management System</p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <Input
                            label="Full Name"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            icon={User}
                            error={errors.fullName}
                        />

                        <Input
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            icon={Mail}
                            error={errors.email}
                        />

                        <div className="form-row">
                            <Input
                                label="Password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create password"
                                icon={Lock}
                                error={errors.password}
                            />

                            <Input
                                label="Confirm Password"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm password"
                                icon={Lock}
                                error={errors.confirmPassword}
                            />
                        </div>

                        <Input
                            label="Registration Number"
                            name="registrationNumber"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={formData.registrationNumber}
                            onChange={handleChange}
                            placeholder="e.g., 12345678"
                            icon={Hash}
                            error={errors.registrationNumber}
                        />

                        <div className="form-row">
                            <Select
                                label="Branch"
                                name="branch"
                                value={formData.branch}
                                onChange={handleChange}
                                options={options.branches?.map(b => ({ value: b, label: b })) || []}
                                placeholder="Select branch"
                                error={errors.branch}
                            />

                            <Select
                                label="Semester"
                                name="semester"
                                value={formData.semester}
                                onChange={handleChange}
                                options={options.semesters?.map(s => ({ value: s, label: s })) || []}
                                placeholder="Select semester"
                                error={errors.semester}
                            />
                        </div>

                        <div className="form-row">
                            <Input
                                label="Date of Birth"
                                name="dob"
                                type="date"
                                value={formData.dob}
                                onChange={handleChange}
                                icon={Calendar}
                                error={errors.dob}
                            />
                        </div>

                        <Button
                            type="submit"
                            loading={loading}
                            fullWidth
                        >
                            Send OTP & Register
                        </Button>

                        <p className="auth-link">
                            Already have an account? <Link to="/login">Login</Link>
                        </p>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="auth-form">
                        <div className="otp-info">
                            <p>We've sent a 6-digit OTP to</p>
                            <strong>{formData.email}</strong>
                        </div>

                        <Input
                            label="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            className="otp-input"
                        />

                        <Button
                            type="submit"
                            loading={loading}
                            fullWidth
                        >
                            Verify & Complete Registration
                        </Button>

                        <div className="otp-actions">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={handleResendOtp}
                            >
                                Resend OTP
                            </button>
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => setStep(1)}
                            >
                                Go Back
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <div className="auth-decoration">
                <div className="decoration-content">
                    <h2>Track Your Activities</h2>
                    <p>Manage and track your activity points throughout your academic journey</p>
                    <div className="decoration-features">
                        <div className="feature">
                            <span className="feature-icon">📄</span>
                            <span>Upload Certificates</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon">🤖</span>
                            <span>AI-Powered Extraction</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon">✅</span>
                            <span>Easy Verification</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
