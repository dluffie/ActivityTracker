import { useState, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../src/context/ThemeContext';
import { notificationAPI } from '../../src/api';
import { SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

const NOTIF_CONFIG = {
    approval: { icon: 'checkmark-circle', color: '#22c55e' },
    rejection: { icon: 'close-circle', color: '#ef4444' },
    correction: { icon: 'alert-circle', color: '#f59e0b' },
    teacher_submission: { icon: 'person-circle', color: '#7c3aed' },
    activity_submitted: { icon: 'document-text', color: '#3b82f6' },
    profile_verified: { icon: 'shield-checkmark', color: '#22c55e' },
    profile_rejected: { icon: 'shield', color: '#ef4444' },
    reminder: { icon: 'notifications', color: '#f59e0b' },
    system: { icon: 'information-circle', color: '#7c3aed' },
};

const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

export default function NotificationsScreen() {
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const styles = useMemo(() => getStyles(colors), [colors]);

    useEffect(() => { fetchNotifications(); }, []);

    const fetchNotifications = async () => {
        try {
            const res = await notificationAPI.getAll({ limit: 50 });
            setNotifications(res.data.notifications || []);
        } catch {
            Toast.show({ type: 'error', text1: 'Failed to load notifications' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await notificationAPI.markRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch { }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationAPI.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            Toast.show({ type: 'success', text1: 'All marked as read' });
        } catch { }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const renderItem = ({ item }) => {
        const config = NOTIF_CONFIG[item.type] || NOTIF_CONFIG.system;
        return (
            <TouchableOpacity
                style={[styles.card, !item.read && styles.cardUnread]}
                onPress={() => !item.read && handleMarkRead(item._id)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconWrap, { backgroundColor: config.color + '15' }]}>
                    <Ionicons name={config.icon} size={22} color={config.color} />
                </View>
                <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.cardMessage} numberOfLines={2}>{item.message}</Text>
                    <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
                </View>
                {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Notifications</Text>
                {unreadCount > 0 && (
                    <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
                        <Text style={styles.markAllText}>Mark all read</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: SPACING.xl, paddingTop: SPACING.sm }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} colors={[colors.primary]} />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="notifications-off-outline" size={56} color={colors.textTertiary} />
                            <Text style={styles.emptyText}>No notifications yet</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.sm,
    },
    title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
    markAllBtn: {
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
        backgroundColor: colors.primaryBg, borderRadius: RADIUS.full,
    },
    markAllText: { fontSize: 12, fontWeight: '600', color: colors.primary },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: {
        flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md,
        backgroundColor: colors.card, borderRadius: RADIUS.lg, padding: SPACING.lg,
        marginBottom: SPACING.sm, ...SHADOWS.sm,
    },
    cardUnread: { backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primaryBorder },
    iconWrap: {
        width: 42, height: 42, borderRadius: 21,
        alignItems: 'center', justifyContent: 'center',
    },
    cardBody: { flex: 1 },
    cardTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    cardMessage: { fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
    cardTime: { fontSize: 11, color: colors.textTertiary, marginTop: 4 },
    unreadDot: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: colors.primary, marginTop: 6,
    },
    empty: { alignItems: 'center', paddingVertical: 80 },
    emptyText: { fontSize: 15, color: colors.textTertiary, marginTop: SPACING.md },
});
