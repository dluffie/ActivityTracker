import { useState, useRef, useMemo } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { authAPI } from '../../src/api';
import { SPACING, RADIUS, BRANCHES, SEMESTERS } from '../../src/constants/theme';

export default function SignupScreen() {
    const { verifyOtp } = useAuth();
    const { colors } = useTheme();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState('');
    const otpRefs = useRef([]);

    const [formData, setFormData] = useState({
        fullName: '', email: '', password: '', confirmPassword: '',
        registrationNumber: '', branch: '', semester: '', dob: '',
        isLateral: false,
    });

    const styles = useMemo(() => getStyles(colors), [colors]);
    const update = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

    const handleRegister = async () => {
        const { fullName, email, password, confirmPassword, registrationNumber, branch, semester, dob } = formData;
        if (!fullName || !email || !password || !confirmPassword || !registrationNumber || !branch || !semester || !dob) {
            Toast.show({ type: 'error', text1: 'Please fill in all fields' });
            return;
        }
        if (password !== confirmPassword) {
            Toast.show({ type: 'error', text1: 'Passwords do not match' });
            return;
        }
        if (password.length < 6) {
            Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' });
            return;
        }

        setLoading(true);
        try {
            await authAPI.register({
                fullName, email, password, registrationNumber, branch, semester, dob,
                isLateral: formData.isLateral,
            });
            Toast.show({ type: 'success', text1: 'OTP Sent!', text2: 'Check your email for the OTP' });
            setStep(2);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Registration Failed', text2: error.response?.data?.message || 'Something went wrong' });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) {
            Toast.show({ type: 'error', text1: 'Please enter the 6-digit OTP' });
            return;
        }
        setLoading(true);
        try {
            const userData = await verifyOtp(formData.email, otp);
            Toast.show({ type: 'success', text1: 'Account Created!', text2: `Welcome, ${userData.fullName}` });
            router.replace('/(student)/dashboard');
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Verification Failed', text2: error.response?.data?.message || 'Invalid OTP' });
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            await authAPI.resendOtp({ email: formData.email });
            Toast.show({ type: 'success', text1: 'OTP Resent', text2: 'Check your email' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Failed to resend OTP' });
        }
    };

    const handleOtpChange = (index, value) => {
        const val = value.replace(/[^0-9]/g, '');
        const newOtp = otp.split('');
        newOtp[index] = val;
        setOtp(newOtp.join(''));
        if (val && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyPress = (index, key) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const renderPicker = (label, value, options, onSelect) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {options.map(opt => (
                    <TouchableOpacity
                        key={opt}
                        style={[styles.chip, value === opt && styles.chipActive]}
                        onPress={() => onSelect(opt)}
                    >
                        <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    if (step === 2) {
        return (
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <View style={styles.header}>
                        <View style={[styles.logoCircle, { backgroundColor: colors.success }]}>
                            <Ionicons name="shield-checkmark" size={36} color={colors.textInverse} />
                        </View>
                        <Text style={styles.title}>Verify Email</Text>
                        <Text style={styles.subtitle}>We've sent a 6-digit OTP to</Text>
                        <Text style={styles.emailText}>{formData.email}</Text>
                    </View>

                    <View style={styles.spamWarning}>
                        <Ionicons name="mail-outline" size={16} color="#dc2626" />
                        <Text style={styles.spamText}>
                            Can't find it? <Text style={styles.spamBold}>Check your Spam / Junk folder!</Text>
                        </Text>
                    </View>

                    <Text style={styles.otpLabel}>ENTER OTP</Text>
                    <View style={styles.otpRow}>
                        {[0, 1, 2, 3, 4, 5].map(i => (
                            <TextInput
                                key={i}
                                ref={ref => otpRefs.current[i] = ref}
                                style={[styles.otpBox, otp[i] && styles.otpBoxFilled]}
                                value={otp[i] || ''}
                                onChangeText={val => handleOtpChange(i, val)}
                                onKeyPress={({ nativeEvent }) => handleOtpKeyPress(i, nativeEvent.key)}
                                keyboardType="number-pad"
                                maxLength={1}
                                autoFocus={i === 0}
                            />
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.button, (loading || otp.length !== 6) && styles.buttonDisabled]}
                        onPress={handleVerifyOtp}
                        disabled={loading || otp.length !== 6}
                    >
                        {loading ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.buttonText}>Verify & Complete</Text>}
                    </TouchableOpacity>

                    <View style={styles.otpActions}>
                        <TouchableOpacity onPress={handleResendOtp}>
                            <Text style={styles.otpActionText}>Resend OTP</Text>
                        </TouchableOpacity>
                        <Text style={styles.otpDivider}>|</Text>
                        <TouchableOpacity onPress={() => setStep(1)}>
                            <Text style={styles.otpActionText}>Go Back</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <View style={styles.logoCircle}>
                        <Ionicons name="person-add" size={32} color={colors.textInverse} />
                    </View>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join the Activity Point System</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputRow}>
                            <Ionicons name="person-outline" size={20} color={colors.textTertiary} />
                            <TextInput style={styles.input} value={formData.fullName} onChangeText={v => update('fullName', v)} placeholder="Enter full name" placeholderTextColor={colors.textTertiary} />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <View style={styles.inputRow}>
                            <Ionicons name="mail-outline" size={20} color={colors.textTertiary} />
                            <TextInput style={styles.input} value={formData.email} onChangeText={v => update('email', v)} placeholder="Enter email" placeholderTextColor={colors.textTertiary} autoCapitalize="none" keyboardType="email-address" />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Registration Number</Text>
                        <View style={styles.inputRow}>
                            <Ionicons name="card-outline" size={20} color={colors.textTertiary} />
                            <TextInput style={styles.input} value={formData.registrationNumber} onChangeText={v => update('registrationNumber', v)} placeholder="e.g. KTE22CS001" placeholderTextColor={colors.textTertiary} autoCapitalize="characters" />
                        </View>
                    </View>

                    {renderPicker('Branch', formData.branch, BRANCHES, v => update('branch', v))}
                    {renderPicker('Semester', formData.semester, SEMESTERS, v => update('semester', v))}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Date of Birth</Text>
                        <View style={styles.inputRow}>
                            <Ionicons name="calendar-outline" size={20} color={colors.textTertiary} />
                            <TextInput style={styles.input} value={formData.dob} onChangeText={v => update('dob', v)} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textTertiary} keyboardType="numbers-and-punctuation" />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputRow}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} />
                            <TextInput style={styles.input} value={formData.password} onChangeText={v => update('password', v)} placeholder="Min 6 characters" placeholderTextColor={colors.textTertiary} secureTextEntry />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <View style={styles.inputRow}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} />
                            <TextInput style={styles.input} value={formData.confirmPassword} onChangeText={v => update('confirmPassword', v)} placeholder="Re-enter password" placeholderTextColor={colors.textTertiary} secureTextEntry />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.lateralBox, formData.isLateral && styles.lateralBoxActive]}
                        onPress={() => update('isLateral', !formData.isLateral)}
                    >
                        <Ionicons
                            name={formData.isLateral ? 'checkbox' : 'square-outline'}
                            size={22}
                            color={formData.isLateral ? colors.primary : colors.textTertiary}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.lateralText}>I am a Lateral Entry student</Text>
                            <Text style={styles.lateralHint}>Lateral entry students need only 40 activity points</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.buttonText}>Create Account</Text>}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <Link href="/(auth)/login" asChild>
                            <TouchableOpacity>
                                <Text style={styles.footerLink}>Sign In</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.card },
    scroll: { flexGrow: 1, padding: SPACING.xl, paddingTop: 60 },
    header: { alignItems: 'center', marginBottom: SPACING.xxl },
    logoCircle: {
        width: 68, height: 68, borderRadius: 34, backgroundColor: colors.primary,
        alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
    },
    title: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, marginBottom: SPACING.xs },
    subtitle: { fontSize: 14, color: colors.textSecondary },
    emailText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginTop: 4 },
    form: { gap: SPACING.md },
    inputGroup: { gap: 4 },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginLeft: 4 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        backgroundColor: colors.background, borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.lg, paddingVertical: Platform.OS === 'ios' ? 14 : 10,
        borderWidth: 1, borderColor: colors.border,
    },
    input: { flex: 1, fontSize: 15, color: colors.textPrimary },
    chipRow: { flexDirection: 'row', marginTop: 4 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, marginRight: 8,
    },
    chipActive: { backgroundColor: colors.primaryBg, borderColor: colors.primary },
    chipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
    chipTextActive: { color: colors.primary, fontWeight: '600' },
    lateralBox: {
        flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
        padding: SPACING.lg, borderRadius: RADIUS.md,
        backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    },
    lateralBoxActive: { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder },
    lateralText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    lateralHint: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
    button: {
        backgroundColor: colors.primary, paddingVertical: SPACING.lg,
        borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.sm,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { fontSize: 16, fontWeight: '600', color: colors.textInverse },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.lg, marginBottom: SPACING.xxxl },
    footerText: { fontSize: 14, color: colors.textSecondary },
    footerLink: { fontSize: 14, fontWeight: '600', color: colors.primary },
    // OTP Styles
    spamWarning: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, padding: 10, marginBottom: SPACING.lg,
        backgroundColor: '#fef2f2', borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#fecaca',
    },
    spamText: { fontSize: 13, color: '#dc2626' },
    spamBold: { fontWeight: '700', color: '#b91c1c' },
    otpLabel: { fontSize: 12, fontWeight: '600', color: colors.textTertiary, textAlign: 'center', letterSpacing: 1, marginBottom: 10 },
    otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: SPACING.xl },
    otpBox: {
        width: 46, height: 54, borderRadius: RADIUS.md, borderWidth: 2,
        borderColor: colors.border, backgroundColor: colors.background,
        textAlign: 'center', fontSize: 20, fontWeight: '700', color: colors.textPrimary,
    },
    otpBoxFilled: { borderColor: colors.primaryLight, backgroundColor: colors.primaryBg },
    otpActions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: SPACING.lg },
    otpActionText: { fontSize: 14, fontWeight: '500', color: colors.primary },
    otpDivider: { fontSize: 14, color: colors.border },
});
