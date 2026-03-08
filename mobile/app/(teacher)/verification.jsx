import { useState, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    RefreshControl, ActivityIndicator, Modal, ScrollView, TextInput, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../src/context/ThemeContext';
import { teacherAPI } from '../../src/api';
import { SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

export default function VerificationScreen() {
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activities, setActivities] = useState([]);
    const [selected, setSelected] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [comments, setComments] = useState('');
    const [points, setPoints] = useState('');

    const styles = useMemo(() => getStyles(colors), [colors]);

    useEffect(() => { fetchActivities(); }, []);

    const fetchActivities = async () => {
        try {
            const res = await teacherAPI.getPendingActivities({ limit: 50 });
            setActivities(res.data.activities || []);
        } catch {
            Toast.show({ type: 'error', text1: 'Failed to load activities' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleAction = async (action) => {
        if (!selected) return;
        if (action === 'approved' && !points) {
            Toast.show({ type: 'error', text1: 'Please enter points to assign' });
            return;
        }
        setActionLoading(true);
        try {
            await teacherAPI.reviewActivity(selected._id, {
                status: action,
                teacherComments: comments,
                pointsAssigned: action === 'approved' ? Number(points) : 0,
                rejectionReason: action === 'rejected' ? comments : undefined,
            });
            Toast.show({ type: 'success', text1: `Activity ${action}!` });
            setModalVisible(false);
            setSelected(null);
            setComments('');
            setPoints('');
            fetchActivities();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Action failed', text2: error.response?.data?.message });
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => { setSelected(item); setModalVisible(true); setComments(''); setPoints(String(item.pointsAssigned || '')); }}
            activeOpacity={0.7}
        >
            <View style={styles.cardLeft}>
                <View style={styles.cardAvatar}>
                    <Text style={styles.cardAvatarText}>{item.student?.fullName?.charAt(0) || '?'}</Text>
                </View>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.eventName}</Text>
                <Text style={styles.cardStudent}>{item.student?.fullName}</Text>
                <Text style={styles.cardMeta}>{item.activityType} • {item.level}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Verification Queue</Text>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{activities.length} pending</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
            ) : (
                <FlatList
                    data={activities}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: SPACING.xl, paddingTop: SPACING.sm }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchActivities(); }} colors={[colors.primary]} />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.textTertiary} />
                            <Text style={styles.emptyTitle}>All caught up!</Text>
                            <Text style={styles.emptyText}>No pending activities to review</Text>
                        </View>
                    }
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Review Activity</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        {selected && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={styles.modalEventName}>{selected.eventName}</Text>

                                <View style={styles.detailGrid}>
                                    <View style={styles.detailItem}><Text style={styles.detailLabel}>Student</Text><Text style={styles.detailValue}>{selected.student?.fullName}</Text></View>
                                    <View style={styles.detailItem}><Text style={styles.detailLabel}>Reg No</Text><Text style={styles.detailValue}>{selected.student?.registrationNumber}</Text></View>
                                    <View style={styles.detailItem}><Text style={styles.detailLabel}>Type</Text><Text style={styles.detailValue}>{selected.activityType}</Text></View>
                                    <View style={styles.detailItem}><Text style={styles.detailLabel}>Level</Text><Text style={styles.detailValue}>{selected.level}</Text></View>
                                    <View style={styles.detailItem}><Text style={styles.detailLabel}>Date</Text><Text style={styles.detailValue}>{formatDate(selected.startDate || selected.createdAt)}</Text></View>
                                </View>

                                {selected.description && <Text style={styles.descText}>{selected.description}</Text>}

                                {selected.documentUrl && (
                                    <Image source={{ uri: selected.documentUrl }} style={styles.docImage} resizeMode="contain" />
                                )}

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Points to Assign</Text>
                                    <TextInput style={styles.input} value={points} onChangeText={setPoints} keyboardType="numeric" placeholder="e.g. 10" placeholderTextColor={colors.textTertiary} />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Comments</Text>
                                    <TextInput style={[styles.input, styles.textArea]} value={comments} onChangeText={setComments} placeholder="Optional comments..." placeholderTextColor={colors.textTertiary} multiline numberOfLines={3} textAlignVertical="top" />
                                </View>

                                <View style={styles.actionRow}>
                                    <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleAction('approved')} disabled={actionLoading}>
                                        {actionLoading ? <ActivityIndicator size="small" color={colors.textInverse} /> : (
                                            <><Ionicons name="checkmark" size={18} color={colors.textInverse} /><Text style={styles.approveBtnText}>Approve</Text></>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionBtn, styles.correctBtn]} onPress={() => handleAction('correction_needed')} disabled={actionLoading}>
                                        <Ionicons name="alert" size={18} color={colors.warning} />
                                        <Text style={styles.correctBtnText}>Correction</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleAction('rejected')} disabled={actionLoading}>
                                        <Ionicons name="close" size={18} color={colors.error} />
                                        <Text style={styles.rejectBtnText}>Reject</Text>
                                    </TouchableOpacity>
                                </View>
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
    countBadge: { backgroundColor: colors.warningBg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full },
    countText: { fontSize: 12, fontWeight: '600', color: colors.warning },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
        backgroundColor: colors.card, padding: SPACING.lg, borderRadius: RADIUS.lg,
        marginBottom: SPACING.sm, ...SHADOWS.sm,
    },
    cardLeft: {},
    cardAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
    cardAvatarText: { fontSize: 16, fontWeight: '700', color: colors.primary },
    cardBody: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    cardStudent: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
    cardMeta: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
    empty: { alignItems: 'center', paddingVertical: 80 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: SPACING.md },
    emptyText: { fontSize: 14, color: colors.textTertiary, marginTop: SPACING.xs },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.card, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: SPACING.xl, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
    modalTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
    modalEventName: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: SPACING.md },
    detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.lg },
    detailItem: { minWidth: '45%' },
    detailLabel: { fontSize: 11, fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
    detailValue: { fontSize: 14, fontWeight: '500', color: colors.textPrimary, marginTop: 2 },
    descText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: SPACING.md },
    docImage: { width: '100%', height: 200, borderRadius: RADIUS.lg, marginBottom: SPACING.lg },
    inputGroup: { marginBottom: SPACING.md },
    inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
    input: { backgroundColor: colors.background, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderWidth: 1, borderColor: colors.border, fontSize: 15, color: colors.textPrimary },
    textArea: { minHeight: 70, paddingTop: SPACING.md },
    actionRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xxxl },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: SPACING.md, borderRadius: RADIUS.md },
    approveBtn: { backgroundColor: colors.success },
    approveBtnText: { fontSize: 13, fontWeight: '600', color: colors.textInverse },
    correctBtn: { backgroundColor: colors.warningBg, borderWidth: 1, borderColor: colors.warning + '40' },
    correctBtnText: { fontSize: 13, fontWeight: '600', color: colors.warning },
    rejectBtn: { backgroundColor: colors.errorBg, borderWidth: 1, borderColor: colors.error + '30' },
    rejectBtnText: { fontSize: 13, fontWeight: '600', color: colors.error },
});
