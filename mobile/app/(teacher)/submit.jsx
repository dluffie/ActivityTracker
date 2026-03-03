import { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { activityAPI, teacherAPI } from '../../src/api';
import { COLORS, SPACING, RADIUS, ACTIVITY_TYPES, ACTIVITY_LEVELS } from '../../src/constants/theme';

export default function SubmitForStudent() {
    const [loading, setLoading] = useState(false);
    const [studentsLoading, setStudentsLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [document, setDocument] = useState(null);
    const [formData, setFormData] = useState({
        activityType: '', eventName: '', level: '',
        startDate: '', endDate: '', description: '',
    });

    useEffect(() => { fetchStudents(); }, []);

    const fetchStudents = async () => {
        try {
            const res = await teacherAPI.getStudents({ limit: 500 });
            setStudents(res.data.students || []);
        } catch {
            Toast.show({ type: 'error', text1: 'Failed to load students' });
        } finally {
            setStudentsLoading(false);
        }
    };

    const update = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

    const filteredStudents = students.filter(s => {
        const q = search.toLowerCase();
        return !q || s.fullName?.toLowerCase().includes(q) || s.registrationNumber?.toLowerCase().includes(q);
    });

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], allowsEditing: false, quality: 0.8, base64: true,
        });
        if (!result.canceled && result.assets[0]) setDocument(result.assets[0]);
    };

    const handleSubmit = async () => {
        if (!selectedStudent) { Toast.show({ type: 'error', text1: 'Please select a student' }); return; }
        if (!formData.activityType || !formData.eventName || !formData.level || !formData.startDate) {
            Toast.show({ type: 'error', text1: 'Please fill all required fields' }); return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                studentId: selectedStudent._id,
            };
            if (document?.base64) payload.docBase64 = `data:image/jpeg;base64,${document.base64}`;
            await activityAPI.upload(payload);
            Toast.show({ type: 'success', text1: 'Activity submitted!', text2: `For ${selectedStudent.fullName}` });
            setFormData({ activityType: '', eventName: '', level: '', startDate: '', endDate: '', description: '' });
            setSelectedStudent(null);
            setDocument(null);
            setSearch('');
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Submit failed', text2: error.response?.data?.message || 'Something went wrong' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                    <Text style={styles.title}>Submit for Student</Text>
                    <Text style={styles.subtitle}>Add an activity on behalf of a student</Text>

                    {/* Student Search */}
                    <Text style={styles.label}>Select Student *</Text>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={16} color={COLORS.textTertiary} />
                        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Search students..." placeholderTextColor={COLORS.textTertiary} />
                    </View>

                    {studentsLoading ? <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.lg }} /> : (
                        <>
                            {search.length > 0 && (
                                <View style={styles.studentList}>
                                    {filteredStudents.slice(0, 5).map(s => (
                                        <TouchableOpacity key={s._id} style={[styles.studentItem, selectedStudent?._id === s._id && styles.studentItemActive]}
                                            onPress={() => { setSelectedStudent(s); setSearch(''); }}>
                                            <View style={styles.studentAvatar}><Text style={styles.studentAvatarText}>{s.fullName?.charAt(0)}</Text></View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.studentName}>{s.fullName}</Text>
                                                <Text style={styles.studentMeta}>{s.registrationNumber} • {s.branch}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                            {selectedStudent && (
                                <View style={styles.selectedCard}>
                                    <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                                    <Text style={styles.selectedText}>{selectedStudent.fullName} ({selectedStudent.registrationNumber})</Text>
                                    <TouchableOpacity onPress={() => setSelectedStudent(null)}>
                                        <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </>
                    )}

                    {/* Activity Type */}
                    <Text style={styles.label}>Activity Type *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.chipRow}>
                            {ACTIVITY_TYPES.map(t => (
                                <TouchableOpacity key={t.value} style={[styles.chip, formData.activityType === t.value && styles.chipActive]}
                                    onPress={() => update('activityType', t.value)}>
                                    <Text style={[styles.chipText, formData.activityType === t.value && styles.chipTextActive]}>{t.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Level */}
                    <Text style={styles.label}>Level *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.chipRow}>
                            {ACTIVITY_LEVELS.map(l => (
                                <TouchableOpacity key={l.value} style={[styles.chip, formData.level === l.value && styles.chipActive]}
                                    onPress={() => update('level', l.value)}>
                                    <Text style={[styles.chipText, formData.level === l.value && styles.chipTextActive]}>{l.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Event Name */}
                    <Text style={styles.label}>Event Name *</Text>
                    <TextInput style={styles.input} value={formData.eventName} onChangeText={v => update('eventName', v)} placeholder="e.g. National Hackathon" placeholderTextColor={COLORS.textTertiary} />

                    {/* Dates */}
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Start Date *</Text>
                            <TextInput style={styles.input} value={formData.startDate} onChangeText={v => update('startDate', v)} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textTertiary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>End Date</Text>
                            <TextInput style={styles.input} value={formData.endDate} onChangeText={v => update('endDate', v)} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textTertiary} />
                        </View>
                    </View>

                    {/* Description */}
                    <Text style={styles.label}>Description</Text>
                    <TextInput style={[styles.input, styles.textArea]} value={formData.description} onChangeText={v => update('description', v)} placeholder="Brief description..." placeholderTextColor={COLORS.textTertiary} multiline textAlignVertical="top" />

                    {/* Document */}
                    <Text style={styles.label}>Certificate (optional)</Text>
                    {document ? (
                        <View style={styles.docPreview}>
                            <Image source={{ uri: document.uri }} style={styles.docImage} resizeMode="cover" />
                            <TouchableOpacity style={styles.removeDoc} onPress={() => setDocument(null)}>
                                <Ionicons name="close-circle" size={28} color={COLORS.error} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                            <Ionicons name="images-outline" size={28} color={COLORS.primary} />
                            <Text style={styles.uploadBtnText}>Choose Image</Text>
                        </TouchableOpacity>
                    )}

                    {/* Submit */}
                    <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
                        {loading ? <ActivityIndicator color={COLORS.white} /> : (
                            <><Ionicons name="send" size={18} color={COLORS.white} /><Text style={styles.submitBtnText}>Submit Activity</Text></>
                        )}
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scroll: { padding: SPACING.xl },
    title: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary },
    subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.xl },
    label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, marginTop: SPACING.md, marginLeft: 2 },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        backgroundColor: COLORS.white, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
        borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    },
    searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
    studentList: { marginTop: SPACING.sm },
    studentItem: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        padding: SPACING.md, backgroundColor: COLORS.white, borderRadius: RADIUS.md,
        marginBottom: SPACING.xs, borderWidth: 1, borderColor: COLORS.border,
    },
    studentItemActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryBg },
    studentAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center' },
    studentAvatarText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
    studentName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
    studentMeta: { fontSize: 12, color: COLORS.textTertiary },
    selectedCard: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        padding: SPACING.md, backgroundColor: COLORS.successBg, borderRadius: RADIUS.md,
        marginTop: SPACING.sm, borderWidth: 1, borderColor: '#bbf7d0',
    },
    selectedText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.success },
    chipRow: { flexDirection: 'row', gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
    chipActive: { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primary },
    chipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
    chipTextActive: { color: COLORS.primary, fontWeight: '600' },
    input: {
        backgroundColor: COLORS.white, borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.lg, paddingVertical: Platform.OS === 'ios' ? 14 : 10,
        borderWidth: 1, borderColor: COLORS.border, fontSize: 15, color: COLORS.textPrimary,
    },
    textArea: { minHeight: 70, paddingTop: 12 },
    row: { flexDirection: 'row', gap: SPACING.sm },
    uploadBtn: {
        alignItems: 'center', justifyContent: 'center', gap: SPACING.xs,
        paddingVertical: SPACING.xxl, backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
        borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed',
    },
    uploadBtnText: { fontSize: 13, fontWeight: '500', color: COLORS.primary },
    docPreview: { position: 'relative', borderRadius: RADIUS.lg, overflow: 'hidden' },
    docImage: { width: '100%', height: 180, borderRadius: RADIUS.lg },
    removeDoc: { position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.white, borderRadius: 14 },
    submitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
        backgroundColor: COLORS.primary, paddingVertical: SPACING.lg, borderRadius: RADIUS.md,
        marginTop: SPACING.xl,
    },
    submitBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
});
