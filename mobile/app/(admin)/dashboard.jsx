import { useState, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../src/context/ThemeContext';
import { adminAPI } from '../../src/api';
import { SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

export default function AdminDashboard() {
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState(null);

    const styles = useMemo(() => getStyles(colors), [colors]);

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        try {
            const res = await adminAPI.getStats();
            setStats(res.data.stats || res.data);
        } catch {
            Toast.show({ type: 'error', text1: 'Failed to load stats' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    const cards = [
        { label: 'Total Users', value: stats?.totalUsers || 0, icon: 'people', color: colors.primary, bg: colors.primaryBg },
        { label: 'Students', value: stats?.totalStudents || 0, icon: 'school', color: '#8b5cf6', bg: '#f5f3ff' },
        { label: 'Teachers', value: stats?.totalTeachers || 0, icon: 'person', color: '#06b6d4', bg: '#ecfeff' },
        { label: 'Activities', value: stats?.totalActivities || 0, icon: 'document-text', color: '#f59e0b', bg: colors.warningBg },
        { label: 'Pending', value: stats?.pendingActivities || 0, icon: 'time', color: colors.warning, bg: colors.warningBg },
        { label: 'Approved', value: stats?.approvedActivities || 0, icon: 'checkmark-circle', color: colors.success, bg: colors.successBg },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} colors={[colors.primary]} />}
            >
                <View style={styles.header}>
                    <Text style={styles.greeting}>Admin Dashboard</Text>
                    <Text style={styles.subGreeting}>System overview</Text>
                </View>

                <View style={styles.grid}>
                    {cards.map(card => (
                        <View key={card.label} style={styles.card}>
                            <View style={[styles.cardIcon, { backgroundColor: card.bg }]}>
                                <Ionicons name={card.icon} size={24} color={card.color} />
                            </View>
                            <Text style={styles.cardValue}>{card.value}</Text>
                            <Text style={styles.cardLabel}>{card.label}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.card },
    header: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.md },
    greeting: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
    subGreeting: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.xl, gap: SPACING.sm },
    card: {
        width: '48%', backgroundColor: colors.card, borderRadius: RADIUS.xl,
        padding: SPACING.lg, alignItems: 'center', ...SHADOWS.sm,
    },
    cardIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
    cardValue: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
    cardLabel: { fontSize: 12, color: colors.textTertiary, fontWeight: '500', marginTop: 2 },
});
