import { useState, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    RefreshControl, ActivityIndicator, TextInput, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../src/context/ThemeContext';
import { adminAPI } from '../../src/api';
import { SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

const ROLE_COLORS = {
    student: { text: '#7c3aed', bg: '#f3f0ff' },
    teacher: { text: '#06b6d4', bg: '#ecfeff' },
    admin: { text: '#f59e0b', bg: '#fffbeb' },
};

export default function UsersScreen() {
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const styles = useMemo(() => getStyles(colors), [colors]);

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await adminAPI.getUsers({ limit: 500 });
            setUsers(res.data.users || []);
        } catch {
            Toast.show({ type: 'error', text1: 'Failed to load users' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDelete = (user) => {
        Alert.alert('Delete User', `Delete ${user.fullName}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    try {
                        await adminAPI.deleteUser(user._id);
                        Toast.show({ type: 'success', text1: 'User deleted' });
                        fetchUsers();
                    } catch { Toast.show({ type: 'error', text1: 'Delete failed' }); }
                },
            },
        ]);
    };

    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        const matchSearch = !q || u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.registrationNumber?.toLowerCase().includes(q);
        const matchRole = roleFilter === 'all' || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    const renderItem = ({ item }) => {
        const rc = ROLE_COLORS[item.role] || ROLE_COLORS.student;
        return (
            <View style={styles.card}>
                <View style={[styles.avatar, { backgroundColor: rc.bg }]}>
                    <Text style={[styles.avatarText, { color: rc.text }]}>{item.fullName?.charAt(0)}</Text>
                </View>
                <View style={styles.cardBody}>
                    <Text style={styles.cardName} numberOfLines={1}>{item.fullName}</Text>
                    <Text style={styles.cardMeta}>{item.email}</Text>
                    <View style={styles.cardTags}>
                        <View style={[styles.rolePill, { backgroundColor: rc.bg }]}>
                            <Text style={[styles.roleText, { color: rc.text }]}>{item.role}</Text>
                        </View>
                        {item.registrationNumber && <Text style={styles.regText}>{item.registrationNumber}</Text>}
                    </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Users</Text>
                <Text style={styles.countText}>{filtered.length} users</Text>
            </View>

            <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color={colors.textTertiary} />
                <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Search users..." placeholderTextColor={colors.textTertiary} />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: SPACING.xl }}>
                {['all', 'student', 'teacher', 'admin'].map(r => (
                    <TouchableOpacity key={r} style={[styles.filterChip, roleFilter === r && styles.filterChipActive]} onPress={() => setRoleFilter(r)}>
                        <Text style={[styles.filterText, roleFilter === r && styles.filterTextActive]}>{r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: SPACING.xl, paddingTop: SPACING.sm }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} colors={[colors.primary]} />}
                    ListEmptyComponent={
                        <View style={styles.empty}><Ionicons name="people-outline" size={56} color={colors.textTertiary} /><Text style={styles.emptyText}>No users found</Text></View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
    title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
    countText: { fontSize: 13, color: colors.textTertiary, fontWeight: '500' },
    searchBar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginHorizontal: SPACING.xl, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: colors.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border, marginBottom: SPACING.sm },
    searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
    filterRow: { maxHeight: 50, marginBottom: SPACING.sm },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
    filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
    filterTextActive: { color: colors.textInverse, fontWeight: '600' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: colors.card, padding: SPACING.lg, borderRadius: RADIUS.lg, marginBottom: SPACING.sm, ...SHADOWS.sm },
    avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 17, fontWeight: '700' },
    cardBody: { flex: 1 },
    cardName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    cardMeta: { fontSize: 12, color: colors.textTertiary, marginTop: 1 },
    cardTags: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xs },
    rolePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    roleText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    regText: { fontSize: 11, color: colors.textTertiary },
    deleteBtn: { padding: SPACING.sm },
    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 15, color: colors.textTertiary, marginTop: SPACING.md },
});
