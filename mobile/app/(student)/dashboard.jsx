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
import { activityAPI } from '../../src/api';
import { SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

const CircleProgress = ({ percentage, size = 120, strokeWidth = 10, colors }) => {
    const clampedPct = Math.min(Math.max(percentage, 0), 100);

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{
                position: 'absolute', width: size, height: size, borderRadius: size / 2,
                borderWidth: strokeWidth, borderColor: colors.borderLight,
            }} />
            {clampedPct > 0 && (
                <View style={{
                    position: 'absolute', width: size, height: size, borderRadius: size / 2,
                    borderWidth: strokeWidth,
                    borderColor: colors.primary,
                    borderTopColor: clampedPct >= 25 ? colors.primary : colors.borderLight,
                    borderRightColor: clampedPct >= 50 ? colors.primary : colors.borderLight,
                    borderBottomColor: clampedPct >= 75 ? colors.primary : colors.borderLight,
                    borderLeftColor: clampedPct >= 100 ? colors.primary : colors.borderLight,
                    transform: [{ rotate: '-90deg' }],
                }} />
            )}
            <Text style={{ fontSize: 28, fontWeight: '700', color: colors.primary }}>{Math.round(clampedPct)}%</Text>
            <Text style={{ fontSize: 10, color: colors.textTertiary, fontWeight: '500' }}>Complete</Text>
        </View>
    );
};

export default function StudentDashboard() {
    const { user, checkAuth } = useAuth();
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState(null);
    const [recentActivities, setRecentActivities] = useState([]);

    const requiredPoints = user?.isLateral ? 40 : 60;
    const totalPoints = user?.totalPoints || 0;
    const progressPercent = Math.min((totalPoints / requiredPoints) * 100, 100);

    const styles = useMemo(() => getStyles(colors), [colors]);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [statsRes, activitiesRes] = await Promise.all([
                activityAPI.getStats(),
                activityAPI.getMy({ limit: 5 }),
            ]);
            setStats(statsRes.data);
            setRecentActivities(activitiesRes.data.activities || []);
            await checkAuth();
        } catch (err) {
            console.log('Dashboard fetch error:', err.message);
            Toast.show({ type: 'error', text1: 'Failed to load dashboard' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getStatusCounts = () => {
        if (!stats?.byStatus) return { pending: 0, approved: 0, rejected: 0 };
        return stats.byStatus.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, { pending: 0, approved: 0, rejected: 0 });
    };

    const statusCounts = getStatusCounts();

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return colors.success;
            case 'rejected': return colors.error;
            case 'correction_needed': return colors.warning;
            default: return colors.info;
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

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[colors.primary]} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Welcome, {user?.fullName?.split(' ')[0]} 👋</Text>
                        <Text style={styles.subGreeting}>Here's your activity overview</Text>
                    </View>
                    <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/(student)/notifications')}>
                        <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Verification Banner */}
                {!user?.profileVerified && (
                    <View style={styles.verifyBanner}>
                        <Ionicons name="alert-circle" size={20} color={colors.warning} />
                        <Text style={styles.verifyBannerText}>Profile pending verification by teacher</Text>
                    </View>
                )}

                {/* Points Card with Circle */}
                <View style={styles.pointsCard}>
                    <View style={styles.pointsRow}>
                        <CircleProgress percentage={progressPercent} size={110} strokeWidth={10} colors={colors} />
                        <View style={styles.pointsInfo}>
                            <Text style={styles.pointsLabel}>Total Points</Text>
                            <Text style={styles.pointsValue}>{totalPoints}<Text style={styles.pointsRequired}> / {requiredPoints}</Text></Text>
                            <View style={styles.pointsBadge}>
                                <Ionicons name="trophy" size={16} color="#f59e0b" />
                                <Text style={styles.pointsBadgeText}>
                                    {progressPercent >= 100 ? '🎉 Goal reached!' : `${requiredPoints - totalPoints} more needed`}
                                </Text>
                            </View>
                            {user?.isLateral && (
                                <View style={styles.lateralBadge}>
                                    <Ionicons name="flash" size={12} color="#b45309" />
                                    <Text style={styles.lateralBadgeText}>Lateral Entry</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {[
                        { label: 'Pending', value: statusCounts.pending, icon: 'time-outline', color: colors.warning, bg: colors.warningBg },
                        { label: 'Approved', value: statusCounts.approved, icon: 'checkmark-circle-outline', color: colors.success, bg: colors.successBg },
                        { label: 'Rejected', value: statusCounts.rejected, icon: 'close-circle-outline', color: colors.error, bg: colors.errorBg },
                    ].map((stat) => (
                        <View key={stat.label} style={[styles.statCard, { borderColor: stat.color + '20' }]}>
                            <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                                <Ionicons name={stat.icon} size={22} color={stat.color} />
                            </View>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(student)/upload')}>
                        <Ionicons name="cloud-upload" size={22} color={colors.textInverse} />
                        <Text style={[styles.actionText, { color: colors.textInverse }]}>Upload Activity</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => router.push('/(student)/activities')}>
                        <Ionicons name="list" size={22} color={colors.primary} />
                        <Text style={[styles.actionText, { color: colors.primary }]}>My Activities</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Activities */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Activities</Text>
                        <TouchableOpacity onPress={() => router.push('/(student)/activities')}>
                            <Text style={styles.seeAll}>See All →</Text>
                        </TouchableOpacity>
                    </View>
                    {recentActivities.length > 0 ? (
                        recentActivities.map((activity) => (
                            <View key={activity._id} style={styles.activityItem}>
                                <View style={[styles.statusDot, { backgroundColor: getStatusColor(activity.status) }]} />
                                <View style={styles.activityInfo}>
                                    <Text style={styles.activityName} numberOfLines={1}>{activity.eventName}</Text>
                                    <Text style={styles.activityMeta}>
                                        {activity.activityType} • {activity.level}
                                        {activity.submittedByRole === 'teacher' && activity.submittedBy && (
                                            ` • By TR ${activity.submittedBy?.fullName || ''}`
                                        )}
                                    </Text>
                                </View>
                                <View style={styles.activityRight}>
                                    <View style={[styles.statusPill, { backgroundColor: getStatusColor(activity.status) + '15' }]}>
                                        <Text style={[styles.statusText, { color: getStatusColor(activity.status) }]}>
                                            {activity.status}
                                        </Text>
                                    </View>
                                    {activity.status === 'approved' && (
                                        <Text style={styles.pointsEarned}>+{activity.pointsAssigned}</Text>
                                    )}
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
                            <Text style={styles.emptyText}>No activities yet</Text>
                            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(student)/upload')}>
                                <Text style={styles.emptyBtnText}>Upload Your First Activity</Text>
                            </TouchableOpacity>
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
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: SPACING.xl, paddingBottom: SPACING.md,
    },
    greeting: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
    subGreeting: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
    notifBtn: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card,
        alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm,
    },
    verifyBanner: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        marginHorizontal: SPACING.xl, marginBottom: SPACING.md,
        backgroundColor: colors.warningBg, padding: SPACING.md,
        borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.warning + '40',
    },
    verifyBannerText: { fontSize: 13, fontWeight: '500', color: colors.warning, flex: 1 },
    pointsCard: {
        marginHorizontal: SPACING.xl, padding: SPACING.xl,
        backgroundColor: colors.card, borderRadius: RADIUS.xl, ...SHADOWS.md,
        marginBottom: SPACING.lg,
    },
    pointsRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xl },
    pointsInfo: { flex: 1 },
    pointsLabel: { fontSize: 13, color: colors.textTertiary, fontWeight: '500' },
    pointsValue: { fontSize: 36, fontWeight: '700', color: colors.primary },
    pointsRequired: { fontSize: 18, fontWeight: '500', color: colors.textTertiary },
    pointsBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.xs,
    },
    pointsBadgeText: { fontSize: 12, fontWeight: '500', color: colors.accentText || '#92400e' },
    lateralBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.xs,
        backgroundColor: colors.warningBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start',
    },
    lateralBadgeText: { fontSize: 11, fontWeight: '600', color: colors.warning },
    statsGrid: {
        flexDirection: 'row', paddingHorizontal: SPACING.xl, gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    statCard: {
        flex: 1, backgroundColor: colors.card, borderRadius: RADIUS.lg,
        padding: SPACING.md, alignItems: 'center', borderWidth: 1, ...SHADOWS.sm,
    },
    statIcon: {
        width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
        marginBottom: SPACING.xs,
    },
    statValue: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
    statLabel: { fontSize: 11, color: colors.textTertiary, fontWeight: '500', marginTop: 2 },
    quickActions: {
        flexDirection: 'row', paddingHorizontal: SPACING.xl, gap: SPACING.sm, marginBottom: SPACING.lg,
    },
    actionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
        backgroundColor: colors.primary, paddingVertical: SPACING.md, borderRadius: RADIUS.md,
    },
    actionBtnSecondary: {
        backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primaryBorder,
    },
    actionText: { fontSize: 14, fontWeight: '600' },
    section: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.lg },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
    seeAll: { fontSize: 13, fontWeight: '500', color: colors.primary },
    activityItem: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        backgroundColor: colors.card, padding: SPACING.md, borderRadius: RADIUS.md,
        marginBottom: SPACING.sm, ...SHADOWS.sm,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    activityInfo: { flex: 1 },
    activityName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    activityMeta: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
    activityRight: { alignItems: 'flex-end', gap: 4 },
    statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    pointsEarned: { fontSize: 13, fontWeight: '700', color: colors.success },
    emptyState: { alignItems: 'center', paddingVertical: SPACING.xxxl },
    emptyText: { fontSize: 15, color: colors.textTertiary, marginTop: SPACING.md, marginBottom: SPACING.lg },
    emptyBtn: { backgroundColor: colors.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.md },
    emptyBtnText: { fontSize: 14, fontWeight: '600', color: colors.textInverse },
});
