import { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    RefreshControl, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { teacherAPI } from '../../src/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

export default function StudentsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => { fetchStudents(); }, []);

    const fetchStudents = async () => {
        try {
            const res = await teacherAPI.getStudents({ limit: 500 });
            setStudents(res.data.students || []);
        } catch {
            Toast.show({ type: 'error', text1: 'Failed to load students' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filtered = students.filter(s => {
        const q = search.toLowerCase();
        return !q || s.fullName?.toLowerCase().includes(q) || s.registrationNumber?.toLowerCase().includes(q) || s.branch?.toLowerCase().includes(q);
    });

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardAvatar}>
                <Text style={styles.avatarText}>{item.fullName?.charAt(0) || '?'}</Text>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={1}>{item.fullName}</Text>
                <Text style={styles.cardMeta}>{item.registrationNumber} • {item.branch} {item.semester}</Text>
                <View style={styles.cardStats}>
                    <View style={styles.pointsPill}>
                        <Ionicons name="trophy" size={12} color="#f59e0b" />
                        <Text style={styles.pointsText}>{item.totalPoints || 0} pts</Text>
                    </View>
                    <View style={[styles.verifyPill, { backgroundColor: item.profileVerified ? COLORS.successBg : COLORS.warningBg }]}>
                        <Text style={[styles.verifyText, { color: item.profileVerified ? COLORS.success : COLORS.warning }]}>
                            {item.profileVerified ? 'Verified' : 'Pending'}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>My Students</Text>
                <Text style={styles.countText}>{filtered.length} students</Text>
            </View>

            <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color={COLORS.textTertiary} />
                <TextInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search by name, reg no, branch..."
                    placeholderTextColor={COLORS.textTertiary}
                />
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: SPACING.xl, paddingTop: SPACING.sm }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStudents(); }} colors={[COLORS.primary]} />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="people-outline" size={56} color={COLORS.textTertiary} />
                            <Text style={styles.emptyText}>{search ? 'No students match your search' : 'No students found'}</Text>
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
    searchBar: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        marginHorizontal: SPACING.xl, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
        backgroundColor: COLORS.white, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
        marginBottom: SPACING.sm,
    },
    searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
        backgroundColor: COLORS.white, padding: SPACING.lg, borderRadius: RADIUS.lg,
        marginBottom: SPACING.sm, ...SHADOWS.sm,
    },
    cardAvatar: {
        width: 46, height: 46, borderRadius: 23,
        backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
    cardBody: { flex: 1 },
    cardName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
    cardMeta: { fontSize: 12, color: COLORS.textTertiary, marginTop: 2 },
    cardStats: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
    pointsPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#fffbeb', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    pointsText: { fontSize: 11, fontWeight: '600', color: '#b45309' },
    verifyPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    verifyText: { fontSize: 11, fontWeight: '600' },
    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 15, color: COLORS.textTertiary, marginTop: SPACING.md },
});
