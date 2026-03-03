import { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { adminAPI } from '../../src/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

export default function RulesScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [rules, setRules] = useState([]);

    useEffect(() => { fetchRules(); }, []);

    const fetchRules = async () => {
        try {
            const res = await adminAPI.getRules();
            setRules(res.data.rules || res.data || []);
        } catch {
            Toast.show({ type: 'error', text1: 'Failed to load rules' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.categoryPill}>
                    <Ionicons name="pricetag" size={12} color={COLORS.primary} />
                    <Text style={styles.categoryText}>{item.activityType || item.category}</Text>
                </View>
                <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>{item.points || item.maxPoints} pts</Text>
                </View>
            </View>
            <Text style={styles.cardLevel}>{item.level || item.participationType || '—'}</Text>
            {item.description && <Text style={styles.cardDesc}>{item.description}</Text>}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Point Rules</Text>
                <Text style={styles.countText}>{rules.length} rules</Text>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
            ) : (
                <FlatList
                    data={rules}
                    keyExtractor={(item, idx) => item._id || String(idx)}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: SPACING.xl, paddingTop: SPACING.sm }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRules(); }} colors={[COLORS.primary]} />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="settings-outline" size={56} color={COLORS.textTertiary} />
                            <Text style={styles.emptyText}>No rules configured</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
    title: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary },
    countText: { fontSize: 13, color: COLORS.textTertiary, fontWeight: '500' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: {
        backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg,
        marginBottom: SPACING.sm, ...SHADOWS.sm,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
    categoryPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primaryBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    categoryText: { fontSize: 12, fontWeight: '600', color: COLORS.primary, textTransform: 'capitalize' },
    pointsBadge: { backgroundColor: COLORS.accent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    pointsText: { fontSize: 13, fontWeight: '700', color: COLORS.accentText },
    cardLevel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginTop: SPACING.xs, textTransform: 'capitalize' },
    cardDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 },
    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 15, color: COLORS.textTertiary, marginTop: SPACING.md },
});
