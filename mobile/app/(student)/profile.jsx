import { useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

const THEME_OPTIONS = [
    { key: 'light', label: 'Light', icon: 'sunny-outline', color: '#7c3aed' },
    { key: 'dark', label: 'Dark', icon: 'moon-outline', color: '#a78bfa' },
    { key: 'cyberpunk', label: 'Cyber', icon: 'flash-outline', color: '#00f0ff' },
    { key: 'brutalist', label: 'Brutal', icon: 'cube-outline', color: '#ff6b35' },
];

export default function ProfileScreen() {
    const { user, logout, checkAuth } = useAuth();
    const { colors, themeName, setTheme } = useTheme();

    const styles = useMemo(() => getStyles(colors), [colors]);

    useEffect(() => { checkAuth(); }, []);

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    await logout();
                    router.replace('/(auth)/login');
                },
            },
        ]);
    };

    const getVerificationColor = () => {
        if (user?.profileVerified) return colors.success;
        return colors.warning;
    };

    const getVerificationText = () => {
        if (user?.profileVerified) return 'Verified';
        return 'Pending Verification';
    };

    const infoItems = [
        { icon: 'mail-outline', label: 'Email', value: user?.email },
        { icon: 'card-outline', label: 'Reg. Number', value: user?.registrationNumber },
        { icon: 'school-outline', label: 'Branch', value: user?.branch },
        { icon: 'calendar-outline', label: 'Semester', value: user?.semester },
        { icon: 'trophy-outline', label: 'Total Points', value: `${user?.totalPoints || 0} / ${user?.isLateral ? 40 : 60}` },
    ];

    const filteredItems = user?.role === 'student' ? infoItems : infoItems.filter(i => i.label !== 'Reg. Number' && i.label !== 'Branch' && i.label !== 'Semester' && i.label !== 'Total Points');

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <Text style={styles.pageTitle}>Profile</Text>

                {/* Avatar & Name */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatar}>
                        {user?.profileImage ? (
                            <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || '?'}</Text>
                        )}
                    </View>
                    <Text style={styles.name}>{user?.fullName}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
                    </View>
                    {user?.role === 'student' && (
                        <View style={[styles.verifyBadge, { backgroundColor: getVerificationColor() + '15' }]}>
                            <Ionicons
                                name={user?.profileVerified ? 'shield-checkmark' : 'time-outline'}
                                size={14}
                                color={getVerificationColor()}
                            />
                            <Text style={[styles.verifyText, { color: getVerificationColor() }]}>
                                {getVerificationText()}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Lateral Badge */}
                {user?.isLateral && (
                    <View style={styles.lateralCard}>
                        <Ionicons name="flash" size={18} color={colors.accentText} />
                        <Text style={styles.lateralText}>Lateral Entry Student • 40 points required</Text>
                    </View>
                )}

                {/* Info Card */}
                <View style={styles.infoCard}>
                    {filteredItems.map((item, idx) => (
                        <View key={item.label} style={[styles.infoRow, idx < filteredItems.length - 1 && styles.infoRowBorder]}>
                            <View style={styles.infoLeft}>
                                <Ionicons name={item.icon} size={18} color={colors.textTertiary} />
                                <Text style={styles.infoLabel}>{item.label}</Text>
                            </View>
                            <Text style={styles.infoValue}>{item.value || '—'}</Text>
                        </View>
                    ))}
                </View>

                {/* Theme Selector */}
                <View style={styles.themeCard}>
                    <Text style={styles.themeTitle}>Theme</Text>
                    <View style={styles.themeOptions}>
                        {THEME_OPTIONS.map(t => (
                            <TouchableOpacity
                                key={t.key}
                                style={[styles.themeBtn, themeName === t.key && styles.themeBtnActive]}
                                onPress={() => setTheme(t.key)}
                            >
                                <View style={[styles.themePreview, { backgroundColor: t.color }]} />
                                <Ionicons name={t.icon} size={18} color={themeName === t.key ? colors.primary : colors.textTertiary} />
                                <Text style={[styles.themeBtnText, themeName === t.key && styles.themeBtnTextActive]}>{t.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Actions */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={colors.error} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: SPACING.xl },
    pageTitle: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: SPACING.xl },
    avatarSection: { alignItems: 'center', marginBottom: SPACING.xxl },
    avatar: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
        marginBottom: SPACING.md, overflow: 'hidden', ...SHADOWS.md,
    },
    avatarImage: { width: 80, height: 80, borderRadius: 40 },
    avatarText: { fontSize: 32, fontWeight: '700', color: colors.textInverse },
    name: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: SPACING.xs },
    roleBadge: {
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
        backgroundColor: colors.primaryBg, borderRadius: RADIUS.full,
        marginBottom: SPACING.sm,
    },
    roleText: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 1 },
    verifyBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full,
    },
    verifyText: { fontSize: 12, fontWeight: '600' },
    lateralCard: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        backgroundColor: colors.accent, padding: SPACING.md,
        borderRadius: RADIUS.md, marginBottom: SPACING.lg,
    },
    lateralText: { fontSize: 13, fontWeight: '500', color: colors.accentText },
    infoCard: {
        backgroundColor: colors.card, borderRadius: RADIUS.xl,
        padding: SPACING.lg, ...SHADOWS.sm, marginBottom: SPACING.xl,
    },
    infoRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    infoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    infoLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    infoLabel: { fontSize: 13, color: colors.textTertiary, fontWeight: '500' },
    infoValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },

    // Theme selector
    themeCard: {
        backgroundColor: colors.card, borderRadius: RADIUS.xl,
        padding: SPACING.lg, ...SHADOWS.sm, marginBottom: SPACING.xl,
    },
    themeTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: SPACING.md },
    themeOptions: { flexDirection: 'row', gap: SPACING.sm },
    themeBtn: {
        flex: 1, alignItems: 'center', gap: SPACING.xs,
        paddingVertical: SPACING.md, borderRadius: RADIUS.md,
        backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border,
    },
    themeBtnActive: {
        borderColor: colors.primary, backgroundColor: colors.primaryBg,
    },
    themePreview: {
        width: 20, height: 20, borderRadius: 10,
    },
    themeBtnText: { fontSize: 11, fontWeight: '600', color: colors.textTertiary },
    themeBtnTextActive: { color: colors.primary },

    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
        paddingVertical: SPACING.lg, backgroundColor: colors.errorBg,
        borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.error + '30',
    },
    logoutText: { fontSize: 15, fontWeight: '600', color: colors.error },
});
