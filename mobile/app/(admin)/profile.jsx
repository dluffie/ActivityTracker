import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

export default function AdminProfileScreen() {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
        ]);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <Text style={styles.pageTitle}>Profile</Text>
                <View style={styles.avatarSection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || '?'}</Text>
                    </View>
                    <Text style={styles.name}>{user?.fullName}</Text>
                    <View style={styles.roleBadge}><Text style={styles.roleText}>ADMIN</Text></View>
                </View>
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoLeft}>
                            <Ionicons name="mail-outline" size={18} color={COLORS.textTertiary} />
                            <Text style={styles.infoLabel}>Email</Text>
                        </View>
                        <Text style={styles.infoValue}>{user?.email || '—'}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scroll: { padding: SPACING.xl },
    pageTitle: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.xl },
    avatarSection: { alignItems: 'center', marginBottom: SPACING.xxl },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md, ...SHADOWS.md },
    avatarText: { fontSize: 32, fontWeight: '700', color: COLORS.white },
    name: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.xs },
    roleBadge: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.full },
    roleText: { fontSize: 11, fontWeight: '700', color: COLORS.primary, letterSpacing: 1 },
    infoCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOWS.sm, marginBottom: SPACING.xl },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.md },
    infoLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    infoLabel: { fontSize: 13, color: COLORS.textTertiary, fontWeight: '500' },
    infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.lg, backgroundColor: COLORS.errorBg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#fecaca' },
    logoutText: { fontSize: 15, fontWeight: '600', color: COLORS.error },
});
