import { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    RefreshControl, ActivityIndicator, Modal, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { activityAPI } from '../../src/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

const FILTERS = ['all', 'pending', 'approved', 'rejected', 'correction_needed'];
const FILTER_LABELS = { all: 'All', pending: 'Pending', approved: 'Approved', rejected: 'Rejected', correction_needed: 'Correction' };

export default function MyActivities() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activities, setActivities] = useState([]);
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selected, setSelected] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => { fetchActivities(); }, [filter, page]);

    const fetchActivities = async () => {
        try {
            const params = { page, limit: 15 };
            if (filter !== 'all') params.status = filter;
            const res = await activityAPI.getMy(params);
            setActivities(res.data.activities || []);
            setTotalPages(res.data.pagination?.pages || 1);
        } catch {
            Toast.show({ type: 'error', text1: 'Failed to load activities' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const getStatusColor = (s) => {
        switch (s) {
            case 'approved': return COLORS.success;
            case 'rejected': return COLORS.error;
            case 'correction_needed': return COLORS.warning;
            default: return COLORS.info;
        }
    };

    const openDetail = (item) => { setSelected(item); setModalVisible(true); };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => openDetail(item)} activeOpacity={0.7}>
            <View style={[styles.statusBar, { backgroundColor: getStatusColor(item.status) }]} />
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.eventName}</Text>
                <Text style={styles.cardMeta}>{item.activityType} • {item.level}</Text>
                {item.submittedByRole === 'teacher' && item.submittedBy && (
                    <View style={styles.teacherTag}>
                        <Ionicons name="person-circle" size={14} color={COLORS.primary} />
                        <Text style={styles.teacherTagText}>By TR {item.submittedBy?.fullName || ''}</Text>
                    </View>
                )}
                <Text style={styles.cardDate}>{formatDate(item.startDate || item.eventDate || item.createdAt)}</Text>
            </View>
            <View style={styles.cardRight}>
                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
                        {item.status === 'correction_needed' ? 'Correction' : item.status}
                    </Text>
                </View>
                {item.status === 'approved' && (
                    <Text style={styles.pts}>+{item.pointsAssigned} pts</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>My Activities</Text>
            </View>

            {/* Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: SPACING.xl }}>
                {FILTERS.map(f => (
                    <TouchableOpacity
                        key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]}
                        onPress={() => { setFilter(f); setPage(1); }}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{FILTER_LABELS[f]}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
            ) : (
                <FlatList
                    data={activities}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: SPACING.xl, paddingTop: SPACING.md }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchActivities(); }} colors={[COLORS.primary]} />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="document-text-outline" size={56} color={COLORS.textTertiary} />
                            <Text style={styles.emptyText}>No activities found</Text>
                        </View>
                    }
                />
            )}

            {/* Detail Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Activity Details</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        {selected && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={styles.modalEventName}>{selected.eventName}</Text>
                                <View style={[styles.badge, { backgroundColor: getStatusColor(selected.status) + '15', alignSelf: 'flex-start', marginBottom: SPACING.lg }]}>
                                    <Text style={[styles.badgeText, { color: getStatusColor(selected.status) }]}>{selected.status}</Text>
                                </View>

                                <View style={styles.detailGrid}>
                                    <View style={styles.detailItem}><Text style={styles.detailLabel}>Type</Text><Text style={styles.detailValue}>{selected.activityType}</Text></View>
                                    <View style={styles.detailItem}><Text style={styles.detailLabel}>Level</Text><Text style={styles.detailValue}>{selected.level}</Text></View>
                                    <View style={styles.detailItem}><Text style={styles.detailLabel}>Date</Text><Text style={styles.detailValue}>{formatDate(selected.startDate || selected.eventDate)}</Text></View>
                                    {selected.status === 'approved' && (
                                        <View style={styles.detailItem}><Text style={styles.detailLabel}>Points</Text><Text style={[styles.detailValue, { color: COLORS.success, fontWeight: '700' }]}>+{selected.pointsAssigned}</Text></View>
                                    )}
                                    {selected.submittedByRole === 'teacher' && selected.submittedBy && (
                                        <View style={styles.detailItem}><Text style={styles.detailLabel}>Submitted By</Text><Text style={[styles.detailValue, { color: COLORS.primary }]}>TR {selected.submittedBy?.fullName || ''}</Text></View>
                                    )}
                                </View>

                                {selected.description && (
                                    <View style={styles.detailSection}>
                                        <Text style={styles.detailLabel}>Description</Text>
                                        <Text style={styles.descText}>{selected.description}</Text>
                                    </View>
                                )}

                                {selected.teacherComments && selected.status === 'correction_needed' && (
                                    <View style={[styles.detailSection, { backgroundColor: COLORS.warningBg, borderRadius: RADIUS.md, padding: SPACING.md }]}>
                                        <Text style={[styles.detailLabel, { color: COLORS.warning }]}>⚠️ Correction Required</Text>
                                        <Text style={styles.descText}>{selected.teacherComments}</Text>
                                    </View>
                                )}

                                {selected.rejectionReason && (
                                    <View style={[styles.detailSection, { backgroundColor: COLORS.errorBg, borderRadius: RADIUS.md, padding: SPACING.md }]}>
                                        <Text style={[styles.detailLabel, { color: COLORS.error }]}>❌ Rejection Reason</Text>
                                        <Text style={styles.descText}>{selected.rejectionReason}</Text>
                                    </View>
                                )}

                                {selected.documentUrl && (
                                    <Image source={{ uri: selected.documentUrl }} style={styles.docImage} resizeMode="contain" />
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
    title: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary },
    filterRow: { maxHeight: 50, marginBottom: SPACING.sm },
    filterChip: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, marginRight: 8,
    },
    filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    filterText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
    filterTextActive: { color: COLORS.white, fontWeight: '600' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: {
        flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
        marginBottom: SPACING.sm, overflow: 'hidden', ...SHADOWS.sm,
    },
    statusBar: { width: 4 },
    cardBody: { flex: 1, padding: SPACING.md },
    cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
    cardMeta: { fontSize: 12, color: COLORS.textTertiary, marginTop: 2 },
    cardDate: { fontSize: 11, color: COLORS.textTertiary, marginTop: 4 },
    teacherTag: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        marginTop: 4, backgroundColor: COLORS.primaryBg, alignSelf: 'flex-start',
        paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
    },
    teacherTagText: { fontSize: 11, color: COLORS.primary, fontWeight: '500' },
    cardRight: { padding: SPACING.md, alignItems: 'flex-end', justifyContent: 'center', gap: 6 },
    badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
    badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    pts: { fontSize: 13, fontWeight: '700', color: COLORS.success },
    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 15, color: COLORS.textTertiary, marginTop: SPACING.md },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
        padding: SPACING.xl, maxHeight: '85%',
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
    modalTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary },
    modalEventName: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
    detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.lg },
    detailItem: { minWidth: '45%' },
    detailLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
    detailValue: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary, marginTop: 2 },
    detailSection: { marginBottom: SPACING.lg },
    descText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginTop: 4 },
    docImage: { width: '100%', height: 250, borderRadius: RADIUS.lg, marginTop: SPACING.md, marginBottom: SPACING.lg },
});
