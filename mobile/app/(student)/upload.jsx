import { useState, useMemo } from 'react';
import {
    View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
    Platform, KeyboardAvoidingView, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { activityAPI } from '../../src/api';
import { SPACING, RADIUS, SHADOWS, ACTIVITY_TYPES, ACTIVITY_LEVELS } from '../../src/constants/theme';

const categoryMap = {
    'sports': 'sports', 'arts': 'arts', 'technical': 'technical',
    'social': 'social_service', 'social service': 'social_service',
    'social_service': 'social_service', 'leadership': 'leadership',
    'entrepreneurship': 'entrepreneurship', 'innovation': 'innovation',
    'ncc': 'ncc_nss', 'nss': 'ncc_nss', 'ncc/nss': 'ncc_nss', 'ncc_nss': 'ncc_nss',
};
const levelMap = {
    'college': 'college', 'district': 'district', 'state': 'state',
    'national': 'national', 'international': 'international',
    'zonal': 'zonal', 'university': 'university',
};

export default function UploadScreen() {
    const { user } = useAuth();
    const { colors } = useTheme();
    const [uploadMode, setUploadMode] = useState('manual');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiExtracted, setAiExtracted] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [docBase64, setDocBase64] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [formData, setFormData] = useState({
        activityType: '', level: '', eventName: '',
        startDate: '', endDate: '', description: '',
    });

    const styles = useMemo(() => getStyles(colors), [colors]);
    const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    const pickDocument = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.8,
                base64: true,
            });
            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                setDocBase64(asset.base64);
                setFilePreview(asset.uri);
                setAiExtracted(false);
                setAiResult(null);
            }
        } catch {
            Toast.show({ type: 'error', text1: 'Failed to pick image' });
        }
    };

    const handleAIExtract = async () => {
        if (!docBase64) {
            Toast.show({ type: 'error', text1: 'Upload a certificate first' });
            return;
        }
        setAiLoading(true);
        try {
            const response = await activityAPI.aiExtract({ docBase64 });
            const data = response.data.data;
            setAiResult(data);

            const mappedCategory = categoryMap[data.category?.toLowerCase()] || '';
            const mappedLevel = levelMap[data.level?.toLowerCase()] || '';

            setFormData({
                activityType: mappedCategory,
                eventName: data.title || '',
                description: data.remarks || '',
                level: mappedLevel,
                startDate: data.start_date || '',
                endDate: data.end_date || '',
            });

            setAiExtracted(true);
            const remaining = response.data.remaining;
            Toast.show({
                type: 'success',
                text1: 'AI Extracted! ✨',
                text2: `${remaining} extraction${remaining !== 1 ? 's' : ''} remaining today`,
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'AI Extraction Failed',
                text2: error.response?.data?.message || 'Please fill manually',
            });
        } finally {
            setAiLoading(false);
        }
    };

    const handleSubmit = async () => {
        const { activityType, level, eventName, startDate, endDate } = formData;
        if (!activityType || !level || !eventName || !startDate || !endDate) {
            Toast.show({ type: 'error', text1: 'Please fill all required fields' });
            return;
        }
        // Date validation
        if (new Date(endDate) < new Date(startDate)) {
            Toast.show({ type: 'error', text1: 'End date must be on or after start date' });
            return;
        }
        if (!docBase64) {
            Toast.show({ type: 'error', text1: 'Please upload a certificate' });
            return;
        }
        setSubmitting(true);
        try {
            await activityAPI.upload({ ...formData, docBase64 });
            Toast.show({ type: 'success', text1: 'Activity submitted!', text2: 'Awaiting teacher verification' });
            setFormData({ activityType: '', level: '', eventName: '', startDate: '', endDate: '', description: '' });
            setDocBase64(null);
            setFilePreview(null);
            setAiExtracted(false);
            setAiResult(null);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Upload Failed', text2: error.response?.data?.message || 'Something went wrong' });
        } finally {
            setSubmitting(false);
        }
    };

    const renderChips = (label, value, options, onSelect) => (
        <View style={styles.field}>
            <Text style={styles.label}>{label} *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                    {options.map(opt => {
                        const optValue = typeof opt === 'object' ? opt.value : opt;
                        const optLabel = typeof opt === 'object' ? opt.label : opt;
                        return (
                            <TouchableOpacity
                                key={optValue} style={[styles.chip, value === optValue && styles.chipActive]}
                                onPress={() => onSelect(optValue)}
                            >
                                <Text style={[styles.chipText, value === optValue && styles.chipTextActive]}>{optLabel}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );

    // Profile verification gate
    if (!user?.profileVerified) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.blockedContainer}>
                    <View style={styles.blockedIcon}>
                        <Ionicons name="shield-outline" size={64} color={colors.warning} />
                    </View>
                    <Text style={styles.blockedTitle}>Profile Not Verified</Text>
                    <Text style={styles.blockedDesc}>
                        Your profile needs to be verified by a teacher before you can upload activities.
                        Please wait for verification or contact your class teacher.
                    </Text>
                    <View style={styles.blockedBadge}>
                        <Ionicons name="time-outline" size={16} color={colors.warning} />
                        <Text style={styles.blockedBadgeText}>Verification Pending</Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    const showFormFields = uploadMode === 'manual' || aiExtracted;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                    <Text style={styles.title}>Upload Activity</Text>
                    <Text style={styles.subtitle}>Submit your activity certificate for verification</Text>

                    {/* Mode Toggle */}
                    <View style={styles.modeToggle}>
                        <TouchableOpacity
                            style={[styles.modeBtn, uploadMode === 'manual' && styles.modeBtnActive]}
                            onPress={() => { setUploadMode('manual'); setAiExtracted(false); setAiResult(null); }}
                        >
                            <Ionicons name="create-outline" size={18} color={uploadMode === 'manual' ? colors.textInverse : colors.primary} />
                            <Text style={[styles.modeBtnText, uploadMode === 'manual' && styles.modeBtnTextActive]}>Manual Entry</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeBtn, uploadMode === 'ai' && styles.modeBtnActive]}
                            onPress={() => { setUploadMode('ai'); setAiExtracted(false); setAiResult(null); }}
                        >
                            <Ionicons name="sparkles" size={18} color={uploadMode === 'ai' ? colors.textInverse : colors.primary} />
                            <Text style={[styles.modeBtnText, uploadMode === 'ai' && styles.modeBtnTextActive]}>AI Extraction</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Upload Certificate */}
                    <View style={styles.field}>
                        <Text style={styles.label}>
                            {uploadMode === 'ai' ? '📄 Upload & Extract' : 'Upload Certificate'} *
                        </Text>
                        <TouchableOpacity style={styles.uploadBox} onPress={pickDocument}>
                            {filePreview ? (
                                <Image source={{ uri: filePreview }} style={styles.previewImg} />
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Ionicons name="cloud-upload-outline" size={40} color={colors.primary} />
                                    <Text style={styles.uploadText}>Tap to select certificate image</Text>
                                    <Text style={styles.uploadHint}>JPG, PNG supported</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        {filePreview && (
                            <TouchableOpacity style={styles.removeBtn} onPress={() => { setFilePreview(null); setDocBase64(null); setAiExtracted(false); }}>
                                <Ionicons name="trash-outline" size={16} color={colors.error} />
                                <Text style={styles.removeBtnText}>Remove</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* AI Extract Button */}
                    {uploadMode === 'ai' && filePreview && !aiExtracted && (
                        <TouchableOpacity
                            style={[styles.aiBtn, aiLoading && styles.aiBtnLoading]}
                            onPress={handleAIExtract}
                            disabled={aiLoading}
                        >
                            {aiLoading ? (
                                <>
                                    <ActivityIndicator size="small" color={colors.textInverse} />
                                    <Text style={styles.aiBtnText}>Extracting with AI...</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="sparkles" size={20} color={colors.textInverse} />
                                    <Text style={styles.aiBtnText}>Extract with AI ✨</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* AI Result Banner */}
                    {aiExtracted && aiResult && (
                        <View style={styles.aiBanner}>
                            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.aiBannerTitle}>AI Extraction Complete!</Text>
                                <Text style={styles.aiBannerSub}>Review and edit the fields below before submitting</Text>
                                {aiResult.confidence && (
                                    <Text style={styles.aiConfidence}>Confidence: {Math.round(aiResult.confidence * 100)}%</Text>
                                )}
                            </View>
                        </View>
                    )}

                    {/* AI mode instruction when no file */}
                    {uploadMode === 'ai' && !filePreview && (
                        <View style={styles.aiInstruction}>
                            <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
                            <Text style={styles.aiInstructionText}>Upload a certificate and click "Extract with AI" to auto-fill the form</Text>
                        </View>
                    )}

                    {/* Form Fields */}
                    {showFormFields && (
                        <>
                            {renderChips('Activity Type', formData.activityType, ACTIVITY_TYPES, v => update('activityType', v))}
                            {renderChips('Level', formData.level, ACTIVITY_LEVELS, v => update('level', v))}

                            <View style={styles.field}>
                                <Text style={styles.label}>Event Name *</Text>
                                <TextInput
                                    style={styles.input} value={formData.eventName}
                                    onChangeText={v => update('eventName', v)}
                                    placeholder="e.g. Science Fair 2025"
                                    placeholderTextColor={colors.textTertiary}
                                />
                            </View>

                            <View style={styles.dateRow}>
                                <View style={[styles.field, { flex: 1 }]}>
                                    <Text style={styles.label}>Start Date *</Text>
                                    <TextInput
                                        style={styles.input} value={formData.startDate}
                                        onChangeText={v => update('startDate', v)}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={colors.textTertiary}
                                    />
                                </View>
                                <View style={[styles.field, { flex: 1 }]}>
                                    <Text style={styles.label}>End Date *</Text>
                                    <TextInput
                                        style={styles.input} value={formData.endDate}
                                        onChangeText={v => update('endDate', v)}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={colors.textTertiary}
                                    />
                                </View>
                            </View>

                            <View style={styles.field}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]} value={formData.description}
                                    onChangeText={v => update('description', v)}
                                    placeholder="Brief description of the activity"
                                    placeholderTextColor={colors.textTertiary}
                                    multiline numberOfLines={3} textAlignVertical="top"
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                                onPress={handleSubmit} disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color={colors.textInverse} />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
                                        <Text style={styles.submitText}>Submit Activity</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </>
                    )}

                    <View style={{ height: 30 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: SPACING.xl },
    title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
    subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: SPACING.lg },

    // Blocked state
    blockedContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl * 2,
    },
    blockedIcon: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: colors.warningBg, alignItems: 'center', justifyContent: 'center',
        marginBottom: SPACING.xl,
    },
    blockedTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: SPACING.md, textAlign: 'center' },
    blockedDesc: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xl },
    blockedBadge: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
        backgroundColor: colors.warningBg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
        borderRadius: RADIUS.full, borderWidth: 1, borderColor: colors.warning + '40',
    },
    blockedBadgeText: { fontSize: 14, fontWeight: '600', color: colors.warning },

    // Mode toggle
    modeToggle: {
        flexDirection: 'row', backgroundColor: colors.card, borderRadius: RADIUS.lg,
        padding: 4, marginBottom: SPACING.lg, ...SHADOWS.sm,
    },
    modeBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: SPACING.xs, paddingVertical: SPACING.md, borderRadius: RADIUS.md,
    },
    modeBtnActive: { backgroundColor: colors.primary },
    modeBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },
    modeBtnTextActive: { color: colors.textInverse },

    // Fields
    field: { marginBottom: SPACING.md },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: SPACING.xs },
    input: {
        backgroundColor: colors.card, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md, fontSize: 15, color: colors.textPrimary,
        borderWidth: 1, borderColor: colors.border,
    },
    textArea: { minHeight: 80 },
    dateRow: { flexDirection: 'row', gap: SPACING.sm },

    // Chips
    chipRow: { flexDirection: 'row', gap: SPACING.xs },
    chip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
    chipTextActive: { color: colors.textInverse },

    // Upload
    uploadBox: {
        backgroundColor: colors.card, borderRadius: RADIUS.lg, borderWidth: 2,
        borderColor: colors.border, borderStyle: 'dashed', overflow: 'hidden',
        minHeight: 160, alignItems: 'center', justifyContent: 'center',
    },
    uploadPlaceholder: { alignItems: 'center', padding: SPACING.xl },
    uploadText: { fontSize: 14, color: colors.textSecondary, marginTop: SPACING.sm, fontWeight: '500' },
    uploadHint: { fontSize: 12, color: colors.textTertiary, marginTop: 4 },
    previewImg: { width: '100%', height: 200, resizeMode: 'contain' },
    removeBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end',
        marginTop: SPACING.xs, paddingVertical: 4,
    },
    removeBtnText: { fontSize: 13, color: colors.error, fontWeight: '500' },

    // AI Button
    aiBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
        backgroundColor: colors.info || colors.primary, paddingVertical: SPACING.lg, borderRadius: RADIUS.md,
        marginBottom: SPACING.lg, ...SHADOWS.md,
    },
    aiBtnLoading: { opacity: 0.8 },
    aiBtnText: { fontSize: 16, fontWeight: '600', color: colors.textInverse },

    // AI Banner
    aiBanner: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        backgroundColor: colors.successBg, padding: SPACING.md, borderRadius: RADIUS.md,
        marginBottom: SPACING.lg, borderWidth: 1, borderColor: colors.success + '40',
    },
    aiBannerTitle: { fontSize: 14, fontWeight: '600', color: colors.success },
    aiBannerSub: { fontSize: 12, color: colors.success, marginTop: 2, opacity: 0.8 },
    aiConfidence: { fontSize: 11, fontWeight: '700', color: colors.success, marginTop: 4 },

    // AI Instruction
    aiInstruction: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        backgroundColor: colors.primaryBg, padding: SPACING.md, borderRadius: RADIUS.md,
        marginBottom: SPACING.lg, borderWidth: 1, borderColor: colors.primaryBorder,
    },
    aiInstructionText: { fontSize: 13, color: colors.primary, flex: 1 },

    // Submit
    submitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
        backgroundColor: colors.primary, paddingVertical: SPACING.lg, borderRadius: RADIUS.md,
        marginTop: SPACING.md,
    },
    submitText: { fontSize: 16, fontWeight: '600', color: colors.textInverse },
});
