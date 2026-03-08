import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api';
import { Button, Input, Select } from '../../components/ui';
import { Mail, Lock, User, Calendar, Hash, BookOpen, ShieldCheck, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import signupImage from '../../assets/i.png';
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
        isLateral: false,
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
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
            return;
        }

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
                isLateral: formData.isLateral,
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
                    <div className="auth-logo"><ClipboardList size={40} /></div>
                    <h1>Create Account</h1>
                    <p>Join the Activity Point Management System</p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleSubmit} className="auth-form auth-form-green">
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

                        <div className="lateral-entry-option">
                            <label className="lateral-checkbox-label">
                                <input
                                    type="checkbox"
                                    name="isLateral"
                                    checked={formData.isLateral}
                                    onChange={handleChange}
                                    className="lateral-checkbox"
                                />
                                <span className="lateral-checkbox-text">
                                    I am a <strong>Lateral Entry</strong> student
                                    <span className="lateral-hint">(Only 40 activity points required instead of 60)</span>
                                </span>
                            </label>
                        </div>

                        <Button
                            type="submit"
                            loading={loading}
                            fullWidth
                            className="btn-green"
                        >
                            Send OTP & Register
                        </Button>

                        <p className="auth-link">
                            Already have an account? <Link to="/login">Login</Link>
                        </p>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="auth-form auth-form-green">
                        <div className="otp-info">
                            <div className="otp-icon-wrapper">
                                <ShieldCheck size={40} className="text-success" />
                            </div>
                            <h3>Verify Your Email</h3>
                            <p>We've sent a 6-digit OTP to</p>
                            <strong>{formData.email}</strong>
                        </div>

                        <div className="otp-spam-warning">
                            <Mail size={16} />
                            <span>Can't find it? <strong>Check your Spam / Junk folder!</strong></span>
                        </div>

                        <div className="otp-input-section">
                            <label className="otp-input-label">Enter OTP</label>
                            <div className="otp-digit-wrapper">
                                {[...Array(6)].map((_, i) => (
                                    <input
                                        key={i}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        className="otp-digit-box"
                                        value={otp[i] || ''}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            const newOtp = otp.split('');
                                            newOtp[i] = val;
                                            setOtp(newOtp.join(''));
                                            // Auto-focus next input
                                            if (val && i < 5) {
                                                const next = e.target.parentElement.children[i + 1];
                                                if (next) next.focus();
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Backspace' && !otp[i] && i > 0) {
                                                const prev = e.target.parentElement.children[i - 1];
                                                if (prev) prev.focus();
                                            }
                                        }}
                                        onPaste={(e) => {
                                            e.preventDefault();
                                            const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
                                            setOtp(pasted);
                                            // Focus last filled or last box
                                            const boxes = e.target.parentElement.children;
                                            const focusIdx = Math.min(pasted.length, 5);
                                            if (boxes[focusIdx]) boxes[focusIdx].focus();
                                        }}
                                        autoFocus={i === 0}
                                    />
                                ))}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            loading={loading}
                            fullWidth
                            className="btn-green"
                            disabled={otp.length !== 6}
                        >
                            Verify & Complete Registration
                        </Button>

                        <div className="otp-actions">
                            <button
                                type="button"
                                className="otp-action-btn"
                                onClick={handleResendOtp}
                            >
                                <Mail size={15} /> Resend OTP
                            </button>
                            <span className="otp-action-divider">|</span>
                            <button
                                type="button"
                                className="otp-action-btn"
                                onClick={() => setStep(1)}
                            >
                                Go Back
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {step === 1 && (
                <div className="auth-decoration auth-decoration-green">
                    <div className="decoration-content">
                        <img src={signupImage} alt="Join the community" className="auth-image" />
                        <h2>Join the Community</h2>
                        <p>Start tracking your academic journey today</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Signup;
