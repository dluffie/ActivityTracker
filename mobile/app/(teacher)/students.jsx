import { useState, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
    RefreshControl, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../src/context/ThemeContext';
import { teacherAPI } from '../../src/api';
import { SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

export default function StudentsScreen() {
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [detailVisible, setDetailVisible] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [studentDetail, setStudentDetail] = useState(null);
    const [verifyLoading, setVerifyLoading] = useState(false);

    const styles = useMemo(() => getStyles(colors), [colors]);

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

    const openStudentDetail = async (student) => {
        setSelected(student);
        setDetailVisible(true);
        setDetailLoading(true);
        setStudentDetail(null);
        try {
            const res = await teacherAPI.getStudentDetail(student._id);
            setStudentDetail(res.data);
        } catch {
            // If no detail endpoint, fallback to basic info
            setStudentDetail({ student, activities: [], stats: {} });
        } finally {
            setDetailLoading(false);
        }
    };

    const handleVerifyProfile = async (studentId, verified) => {
        setVerifyLoading(true);
        try {
            await teacherAPI.verifyProfile(studentId, { verified });
            Toast.show({ type: 'success', text1: verified ? 'Profile verified!' : 'Profile rejected' });
            fetchStudents();
            setDetailVisible(false);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Action failed', text2: error.response?.data?.message });
        } finally {
            setVerifyLoading(false);
        }
    };

    const filteredStudents = students.filter(s => {
        const q = search.toLowerCase();
        return !q || s.fullName?.toLowerCase().includes(q) || s.registrationNumber?.toLowerCase().includes(q) || s.branch?.toLowerCase().includes(q);
    });

    const getStatusColor = (s) => {
        switch (s) {
            case 'approved': return colors.success;
            case 'rejected': return colors.error;
            default: return colors.warning;
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => openStudentDetail(item)} activeOpacity={0.7}>
            <View style={styles.cardAvatar}>
                <Text style={styles.cardAvatarText}>{item.fullName?.charAt(0) || '?'}</Text>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.cardName}>{item.fullName}</Text>
                <Text style={styles.cardMeta}>{item.registrationNumber} • {item.branch}</Text>
                <Text style={styles.cardMeta}>Sem {item.semester} • {item.totalPoints || 0} pts</Text>
            </View>
            <View style={styles.cardRight}>
                {item.profileVerified ? (
                    <View style={[styles.verifyBadge, { backgroundColor: colors.successBg }]}>
                        <Ionicons name="shield-checkmark" size={14} color={colors.success} />
                        <Text style={[styles.verifyText, { color: colors.success }]}>Verified</Text>
                    </View>
                ) : (
                    <View style={[styles.verifyBadge, { backgroundColor: colors.warningBg }]}>
                        <Ionicons name="time" size={14} color={colors.warning} />
                        <Text style={[styles.verifyText, { color: colors.warning }]}>Pending</Text>
                    </View>
                )}
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Students</Text>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{students.length} total</Text>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={16} color={colors.textTertiary} />
                    <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Search by name, reg no, branch..." placeholderTextColor={colors.textTertiary} />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
            ) : (
                <FlatList
                    data={filteredStudents}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: SPACING.xl, paddingTop: SPACING.sm }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStudents(); }} colors={[colors.primary]} />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="people-outline" size={56} color={colors.textTertiary} />
                            <Text style={styles.emptyText}>{search ? 'No matching students' : 'No students found'}</Text>
                        </View>
                    }
                />
            )}

            {/* Student Detail Modal */}
            <Modal visible={detailVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Student Details</Text>
                            <TouchableOpacity onPress={() => setDetailVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {detailLoading ? (
                            <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
                        ) : selected && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Profile Header */}
                                <View style={styles.detailProfile}>
                                    <View style={styles.detailAvatar}>
                                        <Text style={styles.detailAvatarText}>{selected.fullName?.charAt(0)}</Text>
                                    </View>
                                    <Text style={styles.detailName}>{selected.fullName}</Text>
                                    <Text style={styles.detailEmail}>{selected.email}</Text>
                                    <View style={[styles.verifyBadge, { backgroundColor: selected.profileVerified ? colors.successBg : colors.warningBg }]}>
                                        <Ionicons name={selected.profileVerified ? 'shield-checkmark' : 'time'} size={14} color={selected.profileVerified ? colors.success : colors.warning} />
                                        <Text style={[styles.verifyText, { color: selected.profileVerified ? colors.success : colors.warning }]}>
                                            {selected.profileVerified ? 'Profile Verified' : 'Pending Verification'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Info Grid */}
                                <View style={styles.detailInfoCard}>
                                    {[
                                        { label: 'Reg No', value: selected.registrationNumber },
                                        { label: 'Branch', value: selected.branch },
                                        { label: 'Semester', value: selected.semester },
                                        { label: 'Points', value: `${selected.totalPoints || 0} / ${selected.isLateral ? 40 : 60}` },
                                        { label: 'Entry', value: selected.isLateral ? 'Lateral' : 'Regular' },
                                    ].map((item, idx) => (
                                        <View key={item.label} style={[styles.detailRow, idx < 4 && styles.detailRowBorder]}>
                                            <Text style={styles.detailLabel}>{item.label}</Text>
                                            <Text style={styles.detailValue}>{item.value || '—'}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Points Progress */}
                                <View style={styles.progressCard}>
                                    <Text style={styles.progressLabel}>Points Progress</Text>
                                    <View style={styles.progressBar}>
                                        <View style={[styles.progressFill, { width: `${Math.min(((selected.totalPoints || 0) / (selected.isLateral ? 40 : 60)) * 100, 100)}%`, backgroundColor: colors.primary }]} />
                                    </View>
                                    <Text style={styles.progressText}>
                                        {selected.totalPoints || 0} / {selected.isLateral ? 40 : 60} points
                                    </Text>
                                </View>

                                {/* Recent Activities from detail */}
                                {studentDetail?.activities?.length > 0 && (
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionLabel}>Recent Activities</Text>
                                        {studentDetail.activities.slice(0, 5).map(a => (
                                            <View key={a._id} style={styles.activityItem}>
                                                <View style={[styles.actDot, { backgroundColor: getStatusColor(a.status) }]} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.actName} numberOfLines={1}>{a.eventName}</Text>
                                                    <Text style={styles.actMeta}>{a.activityType} • {a.level}</Text>
                                                </View>
                                                <Text style={[styles.actStatus, { color: getStatusColor(a.status) }]}>{a.status}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* Verify/Reject Actions */}
                                {!selected.profileVerified && (
                                    <View style={styles.verifyActions}>
                                        <TouchableOpacity style={styles.verifyBtn} onPress={() => handleVerifyProfile(selected._id, true)} disabled={verifyLoading}>
                                            {verifyLoading ? <ActivityIndicator size="small" color={colors.textInverse} /> : (
                                                <><Ionicons name="shield-checkmark" size={18} color={colors.textInverse} /><Text style={styles.verifyBtnText}>Verify Profile</Text></>
                                            )}
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.rejectProfileBtn} onPress={() => handleVerifyProfile(selected._id, false)} disabled={verifyLoading}>
                                            <Ionicons name="shield" size={18} color={colors.error} />
                                            <Text style={styles.rejectProfileBtnText}>Reject</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <View style={{ height: 40 }} />
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
    title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
    countBadge: { backgroundColor: colors.primaryBg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full },
    countText: { fontSize: 12, fontWeight: '600', color: colors.primary },
    searchContainer: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.sm },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        backgroundColor: colors.card, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
        borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border,
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
    card: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
        backgroundColor: colors.card, padding: SPACING.lg, borderRadius: RADIUS.lg,
        marginBottom: SPACING.sm, ...SHADOWS.sm,
    },
    cardAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
    cardAvatarText: { fontSize: 17, fontWeight: '700', color: colors.primary },
    cardBody: { flex: 1 },
    cardName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    cardMeta: { fontSize: 12, color: colors.textTertiary, marginTop: 1 },
    cardRight: { alignItems: 'flex-end', gap: 6 },
    verifyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
    verifyText: { fontSize: 11, fontWeight: '600' },
    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 15, color: colors.textTertiary, marginTop: SPACING.md },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.card, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: SPACING.xl, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
    modalTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },

    detailProfile: { alignItems: 'center', marginBottom: SPACING.xl },
    detailAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
    detailAvatarText: { fontSize: 26, fontWeight: '700', color: colors.textInverse },
    detailName: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
    detailEmail: { fontSize: 14, color: colors.textSecondary, marginBottom: SPACING.sm },

    detailInfoCard: { backgroundColor: colors.background, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm },
    detailRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    detailLabel: { fontSize: 13, color: colors.textTertiary, fontWeight: '500' },
    detailValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },

    progressCard: { backgroundColor: colors.background, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg },
    progressLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: SPACING.sm },
    progressBar: { height: 8, borderRadius: 4, backgroundColor: colors.borderLight },
    progressFill: { height: 8, borderRadius: 4 },
    progressText: { fontSize: 12, color: colors.textTertiary, marginTop: SPACING.xs },

    detailSection: { marginBottom: SPACING.lg },
    sectionLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: SPACING.sm },
    activityItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    actDot: { width: 6, height: 6, borderRadius: 3 },
    actName: { fontSize: 13, fontWeight: '500', color: colors.textPrimary },
    actMeta: { fontSize: 11, color: colors.textTertiary },
    actStatus: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

    verifyActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
    verifyBtn: {
        flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs,
        backgroundColor: colors.success, paddingVertical: SPACING.md, borderRadius: RADIUS.md,
    },
    verifyBtnText: { fontSize: 14, fontWeight: '600', color: colors.textInverse },
    rejectProfileBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs,
        backgroundColor: colors.errorBg, borderWidth: 1, borderColor: colors.error + '30',
        paddingVertical: SPACING.md, borderRadius: RADIUS.md,
    },
    rejectProfileBtnText: { fontSize: 14, fontWeight: '600', color: colors.error },
});
