import { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { adminAPI } from '../../src/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState(null);

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
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    const cards = [
        { label: 'Total Users', value: stats?.totalUsers || 0, icon: 'people', color: COLORS.primary, bg: COLORS.primaryBg },
        { label: 'Students', value: stats?.totalStudents || 0, icon: 'school', color: '#8b5cf6', bg: '#f5f3ff' },
        { label: 'Teachers', value: stats?.totalTeachers || 0, icon: 'person', color: '#06b6d4', bg: '#ecfeff' },
        { label: 'Activities', value: stats?.totalActivities || 0, icon: 'document-text', color: '#f59e0b', bg: COLORS.warningBg },
        { label: 'Pending', value: stats?.pendingActivities || 0, icon: 'time', color: COLORS.warning, bg: COLORS.warningBg },
        { label: 'Approved', value: stats?.approvedActivities || 0, icon: 'checkmark-circle', color: COLORS.success, bg: COLORS.successBg },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} colors={[COLORS.primary]} />}
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
    header: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.md },
    greeting: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary },
    subGreeting: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.xl, gap: SPACING.sm },
    card: {
        width: '48%', backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
        padding: SPACING.lg, alignItems: 'center', ...SHADOWS.sm,
    },
    cardIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
    cardValue: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary },
    cardLabel: { fontSize: 12, color: COLORS.textTertiary, fontWeight: '500', marginTop: 2 },
});
