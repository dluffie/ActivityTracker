import { useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

export default function ProfileScreen() {
    const { user, logout, checkAuth } = useAuth();

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
        if (user?.profileVerified) return COLORS.success;
        return COLORS.warning;
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

    // Only show student-specific items for students
    const filteredItems = user?.role === 'student' ? infoItems : infoItems.filter(i => i.label !== 'Reg. Number' && i.label !== 'Branch' && i.label !== 'Semester' && i.label !== 'Total Points');

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <Text style={styles.pageTitle}>Profile</Text>

                {/* Avatar & Name */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || '?'}</Text>
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
                        <Ionicons name="flash" size={18} color={COLORS.accentText} />
                        <Text style={styles.lateralText}>Lateral Entry Student • 40 points required</Text>
                    </View>
                )}

                {/* Info Card */}
                <View style={styles.infoCard}>
                    {filteredItems.map((item, idx) => (
                        <View key={item.label} style={[styles.infoRow, idx < filteredItems.length - 1 && styles.infoRowBorder]}>
                            <View style={styles.infoLeft}>
                                <Ionicons name={item.icon} size={18} color={COLORS.textTertiary} />
                                <Text style={styles.infoLabel}>{item.label}</Text>
                            </View>
                            <Text style={styles.infoValue}>{item.value || '—'}</Text>
                        </View>
                    ))}
                </View>

                {/* Actions */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scroll: { padding: SPACING.xl },
    pageTitle: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.xl },
    avatarSection: { alignItems: 'center', marginBottom: SPACING.xxl },
    avatar: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
        marginBottom: SPACING.md, ...SHADOWS.md,
    },
    avatarText: { fontSize: 32, fontWeight: '700', color: COLORS.white },
    name: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.xs },
    roleBadge: {
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
        backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.full,
        marginBottom: SPACING.sm,
    },
    roleText: { fontSize: 11, fontWeight: '700', color: COLORS.primary, letterSpacing: 1 },
    verifyBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full,
    },
    verifyText: { fontSize: 12, fontWeight: '600' },
    lateralCard: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        backgroundColor: COLORS.accent, padding: SPACING.md,
        borderRadius: RADIUS.md, marginBottom: SPACING.lg,
    },
    lateralText: { fontSize: 13, fontWeight: '500', color: COLORS.accentText },
    infoCard: {
        backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
        padding: SPACING.lg, ...SHADOWS.sm, marginBottom: SPACING.xl,
    },
    infoRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    infoRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
    infoLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    infoLabel: { fontSize: 13, color: COLORS.textTertiary, fontWeight: '500' },
    infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
        paddingVertical: SPACING.lg, backgroundColor: COLORS.errorBg,
        borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#fecaca',
    },
    logoutText: { fontSize: 15, fontWeight: '600', color: COLORS.error },
});
