import { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';

export default function LoginScreen() {
    const { login } = useAuth();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!identifier.trim() || !password.trim()) {
            Toast.show({ type: 'error', text1: 'Please fill in all fields' });
            return;
        }
        setLoading(true);
        try {
            const userData = await login(identifier.trim(), password);
            Toast.show({ type: 'success', text1: 'Welcome back!', text2: `Logged in as ${userData.fullName}` });
            if (userData.role === 'student') router.replace('/(student)/dashboard');
            else if (userData.role === 'teacher') router.replace('/(teacher)/dashboard');
            else if (userData.role === 'admin') router.replace('/(admin)/dashboard');
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Login Failed',
                text2: error.response?.data?.message || error.message || 'Something went wrong',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoCircle}>
                        <Ionicons name="school" size={36} color={COLORS.white} />
                    </View>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to Activity Tracker</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email or Registration Number</Text>
                        <View style={styles.inputRow}>
                            <Ionicons name="person-outline" size={20} color={COLORS.textTertiary} />
                            <TextInput
                                style={styles.input}
                                value={identifier}
                                onChangeText={setIdentifier}
                                placeholder="Enter email or reg. number"
                                placeholderTextColor={COLORS.textTertiary}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputRow}>
                            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textTertiary} />
                            <TextInput
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Enter password"
                                placeholderTextColor={COLORS.textTertiary}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color={COLORS.textTertiary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.buttonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <Link href="/(auth)/signup" asChild>
                            <TouchableOpacity>
                                <Text style={styles.footerLink}>Sign Up</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.xl },
    header: { alignItems: 'center', marginBottom: SPACING.xxxl },
    logoCircle: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: COLORS.primary, alignItems: 'center',
        justifyContent: 'center', marginBottom: SPACING.lg,
    },
    title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.xs },
    subtitle: { fontSize: 15, color: COLORS.textSecondary },
    form: { gap: SPACING.lg },
    inputGroup: { gap: SPACING.xs },
    label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginLeft: SPACING.xs },
    inputRow: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        backgroundColor: COLORS.background, borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.lg, paddingVertical: Platform.OS === 'ios' ? SPACING.lg : SPACING.md,
        borderWidth: 1, borderColor: COLORS.border,
    },
    input: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
    button: {
        backgroundColor: COLORS.primary, paddingVertical: SPACING.lg,
        borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.sm,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.lg },
    footerText: { fontSize: 14, color: COLORS.textSecondary },
    footerLink: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
});
