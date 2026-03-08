import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../api';
import { Button, Input } from '../../components/ui';
import { Mail, KeyRound, Lock, ShieldCheck, ArrowLeft, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1=email, 2=otp, 3=password, 4=success
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const otpRefs = useRef([]);

    // ── Step 1: Send OTP ─────────────────────
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error('Please enter your email');
            return;
        }
        setLoading(true);
        try {
            await authAPI.forgotPassword(email.trim());
            toast.success('OTP sent! Check your inbox');
            setStep(2);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: Verify OTP ─────────────────────
    const handleOtpChange = (index, value) => {
        const val = value.replace(/[^0-9]/g, '');
        const digits = otp.split('');
        digits[index] = val;
        const newOtp = digits.join('');
        setOtp(newOtp);
        if (val && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index, key) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
        setOtp(pasted);
        const nextFocus = Math.min(pasted.length, 5);
        otpRefs.current[nextFocus]?.focus();
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast.error('Enter all 6 digits');
            return;
        }
        setLoading(true);
        try {
            const res = await authAPI.verifyResetOtp({ email, otp });
            setResetToken(res.data.resetToken);
            toast.success('OTP verified!');
            setStep(3);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            await authAPI.forgotPassword(email);
            toast.success('New OTP sent!');
            setOtp('');
        } catch {
            toast.error('Failed to resend');
        }
    };

    // ── Step 3: Set New Password ─────────────────────
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await authAPI.resetPassword({ resetToken, newPassword: password });
            toast.success('Password reset successfully!');
            setStep(4);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Reset failed');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 4: Success ─────────────────────
    if (step === 4) {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="forgot-success">
                        <div className="forgot-success-icon">
                            <CheckCircle2 size={48} />
                        </div>
                        <h2>Password Reset Complete!</h2>
                        <p>Your password has been updated successfully. You can now sign in with your new password.</p>
                        <Button
                            onClick={() => navigate('/login')}
                            fullWidth
                            className="btn-purple"
                        >
                            Back to Sign In
                        </Button>
                    </div>
                </div>
                <div className="auth-decoration auth-decoration-reset">
                    <div className="decoration-content">
                        <div className="forgot-deco-icon"><ShieldCheck size={80} /></div>
                        <h2>You're All Set!</h2>
                        <p>Your account is secure again</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                {/* ── Step 1: Enter Email ── */}
                {step === 1 && (
                    <>
                        <div className="auth-header">
                            <div className="auth-logo auth-logo-reset">
                                <KeyRound size={36} />
                            </div>
                            <h1 className="forgot-title">Forgot Password?</h1>
                            <p>No worries! Enter your email and we'll send you a reset code.</p>
                        </div>

                        <form onSubmit={handleSendOtp} className="auth-form auth-form-purple">
                            <Input
                                label="Email Address"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your registered email"
                                icon={Mail}
                            />

                            <Button
                                type="submit"
                                loading={loading}
                                fullWidth
                                className="btn-purple"
                            >
                                Send Reset Code
                            </Button>

                            <p className="auth-link">
                                <Link to="/login"><ArrowLeft size={14} style={{ verticalAlign: 'middle' }} /> Back to Sign In</Link>
                            </p>
                        </form>
                    </>
                )}

                {/* ── Step 2: Enter OTP ── */}
                {step === 2 && (
                    <>
                        <div className="otp-info">
                            <div className="otp-icon-wrapper otp-icon-reset">
                                <ShieldCheck size={32} />
                            </div>
                            <h3>Check Your Email</h3>
                            <p>We sent a 6-digit code to</p>
                            <strong>{email}</strong>
                        </div>

                        {/* Spam warning */}
                        <div className="otp-spam-warning">
                            <AlertTriangle size={16} />
                            <span>
                                Can't find it? <strong>Check your Spam / Junk folder!</strong>
                            </span>
                        </div>

                        <form onSubmit={handleVerifyOtp} className="auth-form auth-form-purple">
                            <div className="otp-input-section">
                                <span className="otp-input-label">Enter OTP</span>
                                <div className="otp-digit-wrapper" onPaste={handleOtpPaste}>
                                    {[0, 1, 2, 3, 4, 5].map(i => (
                                        <input
                                            key={i}
                                            ref={ref => otpRefs.current[i] = ref}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            className="otp-digit-box"
                                            value={otp[i] || ''}
                                            onChange={e => handleOtpChange(i, e.target.value)}
                                            onKeyDown={e => handleOtpKeyDown(i, e.key)}
                                            autoFocus={i === 0}
                                        />
                                    ))}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                loading={loading}
                                fullWidth
                                className="btn-purple"
                                disabled={otp.length !== 6}
                            >
                                Verify Code
                            </Button>

                            <div className="otp-actions">
                                <button type="button" className="otp-action-btn" onClick={handleResendOtp}>
                                    <RefreshCw size={14} /> Resend Code
                                </button>
                                <span className="otp-action-divider">|</span>
                                <button type="button" className="otp-action-btn" onClick={() => { setStep(1); setOtp(''); }}>
                                    <ArrowLeft size={14} /> Change Email
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {/* ── Step 3: New Password ── */}
                {step === 3 && (
                    <>
                        <div className="auth-header">
                            <div className="auth-logo auth-logo-reset-success">
                                <Lock size={36} />
                            </div>
                            <h1 className="forgot-title">Set New Password</h1>
                            <p>Choose a strong password for your account</p>
                        </div>

                        <form onSubmit={handleResetPassword} className="auth-form auth-form-purple">
                            <Input
                                label="New Password"
                                name="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 6 characters"
                                icon={Lock}
                            />

                            <Input
                                label="Confirm Password"
                                name="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter password"
                                icon={Lock}
                            />

                            <div className="password-requirements">
                                <div className={`req ${password.length >= 6 ? 'met' : ''}`}>
                                    <CheckCircle2 size={14} /> At least 6 characters
                                </div>
                                <div className={`req ${password && password === confirmPassword ? 'met' : ''}`}>
                                    <CheckCircle2 size={14} /> Passwords match
                                </div>
                            </div>

                            <Button
                                type="submit"
                                loading={loading}
                                fullWidth
                                className="btn-purple"
                                disabled={password.length < 6 || password !== confirmPassword}
                            >
                                Reset Password
                            </Button>
                        </form>
                    </>
                )}
            </div>

            <div className="auth-decoration auth-decoration-reset">
                <div className="decoration-content">
                    <div className="forgot-deco-icon"><KeyRound size={80} /></div>
                    <h2>{step === 3 ? 'Almost There!' : 'Reset Your Password'}</h2>
                    <p>{step === 3 ? 'Choose a password you\'ll remember' : 'We\'ll help you get back into your account'}</p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
