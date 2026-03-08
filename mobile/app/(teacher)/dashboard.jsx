import { useState, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { teacherAPI } from '../../src/api';
import { SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

export default function TeacherDashboard() {
    const { user } = useAuth();
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState(null);
    const [recentActivities, setRecentActivities] = useState([]);
    const [needsSubscription, setNeedsSubscription] = useState(false);

    const styles = useMemo(() => getStyles(colors), [colors]);

    useEffect(() => { checkAndLoad(); }, []);

    const checkAndLoad = async () => {
        try {
            const classesRes = await teacherAPI.getMyClasses();
            if (!classesRes.data.classes?.length) {
                setNeedsSubscription(true);
                setLoading(false);
                return;
            }
            await fetchDashboard();
        } catch {
            Toast.show({ type: 'error', text1: 'Failed to load data' });
            setLoading(false);
        }
    };

    const fetchDashboard = async () => {
        try {
            const dashRes = await teacherAPI.getDashboardStats();
            setStats(dashRes.data.stats);
            setRecentActivities(dashRes.data.recentActivities || []);
        } catch {
            Toast.show({ type: 'error', text1: 'Failed to load dashboard' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getStatusColor = (s) => {
        switch (s) {
            case 'approved': return colors.success;
            case 'rejected': return colors.error;
            default: return colors.warning;
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </SafeAreaView>
        );
    }

    if (needsSubscription) {
        return (
            <SafeAreaView style={styles.emptyContainer}>
                <Ionicons name="school-outline" size={64} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>Subscribe to Classes</Text>
                <Text style={styles.emptyDesc}>You need to subscribe to classes to start managing student activities.</Text>
            </SafeAreaView>
        );
    }

    const pending = stats?.pendingActivities || 0;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboard(); }} colors={[colors.primary]} />}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Welcome, {user?.fullName?.split(' ')[0]} 👋</Text>
                        <Text style={styles.subGreeting}>Manage student activities</Text>
                    </View>
                </View>

                <View style={styles.statsGrid}>
                    {[
                        { label: 'Students', value: stats?.totalStudents || 0, icon: 'people', color: colors.primary, bg: colors.primaryBg },
                        { label: 'Pending', value: pending, icon: 'time', color: colors.warning, bg: colors.warningBg },
                        { label: 'Approved', value: stats?.approvedActivities || 0, icon: 'checkmark-circle', color: colors.success, bg: colors.successBg },
                        { label: 'Rejected', value: stats?.rejectedActivities || 0, icon: 'close-circle', color: colors.error, bg: colors.errorBg },
                    ].map((stat) => (
                        <View key={stat.label} style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                                <Ionicons name={stat.icon} size={22} color={stat.color} />
                            </View>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionPrimary} onPress={() => router.push('/(teacher)/verification')}>
                        <Ionicons name="checkmark-circle" size={22} color={colors.textInverse} />
                        <Text style={styles.actionPrimaryText}>Verify Activities</Text>
                        {pending > 0 && <View style={styles.actionBadge}><Text style={styles.actionBadgeText}>{pending}</Text></View>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionSecondary} onPress={() => router.push('/(teacher)/submit')}>
                        <Ionicons name="add-circle" size={22} color={colors.primary} />
                        <Text style={styles.actionSecondaryText}>Submit for Student</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Submissions</Text>
                    {recentActivities.length > 0 ? (
                        recentActivities.slice(0, 5).map((a) => (
                            <View key={a._id} style={styles.recentItem}>
                                <View style={styles.recentAvatar}>
                                    <Text style={styles.recentAvatarText}>{a.student?.fullName?.charAt(0) || '?'}</Text>
                                </View>
                                <View style={styles.recentInfo}>
                                    <Text style={styles.recentName} numberOfLines={1}>{a.eventName}</Text>
                                    <Text style={styles.recentMeta}>{a.student?.fullName} • {a.student?.registrationNumber}</Text>
                                </View>
                                <View style={[styles.statusPill, { backgroundColor: getStatusColor(a.status) + '15' }]}>
                                    <Text style={[styles.statusText, { color: getStatusColor(a.status) }]}>{a.status}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.noData}>
                            <Text style={styles.noDataText}>No recent submissions</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.card },
    loadingText: { marginTop: SPACING.md, color: colors.textSecondary },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl, backgroundColor: colors.background },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginTop: SPACING.lg },
    emptyDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: SPACING.sm },
    header: {
        paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.md,
    },
    greeting: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
    subGreeting: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
    statsGrid: {
        flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.xl, gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    statCard: {
        width: '48%', backgroundColor: colors.card, borderRadius: RADIUS.lg,
        padding: SPACING.lg, alignItems: 'center', ...SHADOWS.sm,
    },
    statIcon: {
        width: 44, height: 44, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
    },
    statValue: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
    statLabel: { fontSize: 12, color: colors.textTertiary, fontWeight: '500', marginTop: 2 },
    actions: {
        flexDirection: 'row', paddingHorizontal: SPACING.xl, gap: SPACING.sm, marginBottom: SPACING.xl,
    },
    actionPrimary: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
        backgroundColor: colors.primary, paddingVertical: SPACING.md, borderRadius: RADIUS.md,
    },
    actionPrimaryText: { fontSize: 14, fontWeight: '600', color: colors.textInverse },
    actionBadge: {
        backgroundColor: colors.card, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10,
    },
    actionBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
    actionSecondary: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
        backgroundColor: colors.primaryBg, paddingVertical: SPACING.md, borderRadius: RADIUS.md,
        borderWidth: 1, borderColor: colors.primaryBorder,
    },
    actionSecondaryText: { fontSize: 14, fontWeight: '600', color: colors.primary },
    section: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.lg },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: SPACING.md },
    recentItem: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        backgroundColor: colors.card, padding: SPACING.md, borderRadius: RADIUS.md,
        marginBottom: SPACING.sm, ...SHADOWS.sm,
    },
    recentAvatar: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center',
    },
    recentAvatarText: { fontSize: 14, fontWeight: '700', color: colors.primary },
    recentInfo: { flex: 1 },
    recentName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    recentMeta: { fontSize: 12, color: colors.textTertiary, marginTop: 1 },
    statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    noData: { alignItems: 'center', paddingVertical: SPACING.xxl },
    noDataText: { fontSize: 14, color: colors.textTertiary },
});
