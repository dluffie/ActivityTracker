import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { activityAPI } from '../../api';
import { Button, Input, Select, Card } from '../../components/ui';
import useClickSound from '../../hooks/useClickSound';
import { Upload, FileText, Sparkles, CheckCircle, Loader2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import './UploadActivity.css';

const ACTIVITY_TYPES = [
    { value: 'ncc', label: 'NCC' },
    { value: 'nss', label: 'NSS' },
    { value: 'disaster_management', label: 'Disaster Management' },
    { value: 'sports', label: 'Sports & Games' },
    { value: 'cultural', label: 'Cultural Activities' },
    { value: 'online_courses', label: 'Online Courses (NPTEL / SWAYAM / Coursera)' },
    { value: 'competitions', label: 'Competitions (IEEE / IET / ISTE)' },
    { value: 'conferences', label: 'Conferences / Seminars' },
    { value: 'paper_presentation', label: 'Paper / Poster Presentation' },
    { value: 'leadership', label: 'Leadership & Management' },
    { value: 'entrepreneurship', label: 'Entrepreneurship & Innovation' },
    { value: 'custom', label: '✏️ Custom (Type your own)' },
];

const LEVELS = [
    { value: 'college', label: 'College Level' },
    { value: 'zonal', label: 'Zonal Level' },
    { value: 'district', label: 'District Level' },
    { value: 'state', label: 'State Level' },
    { value: 'national', label: 'National Level' },
    { value: 'international', label: 'International Level' },
];

const POSITIONS = [
    { value: '', label: 'Not Applicable' },
    { value: 'first', label: 'First Prize' },
    { value: 'second', label: 'Second Prize' },
    { value: 'third', label: 'Third Prize' },
    { value: 'participant', label: 'Participant' },
    { value: 'organizer', label: 'Organizer' },
    { value: 'coordinator', label: 'Core Coordinator' },
    { value: 'sub_coordinator', label: 'Sub Coordinator' },
    { value: 'volunteer', label: 'Volunteer' },
    { value: 'chairman', label: 'Chairman' },
    { value: 'secretary', label: 'Secretary' },
    { value: 'council_member', label: 'Council Member' },
    { value: 'class_representative', label: 'Class Representative' },
];

// Map AI category responses to our form values
const categoryMap = {
    'ncc': 'ncc',
    'nss': 'nss',
    'disaster_management': 'disaster_management',
    'sports': 'sports',
    'cultural': 'cultural',
    'online_courses': 'online_courses',
    'competitions': 'competitions',
    'conferences': 'conferences',
    'paper_presentation': 'paper_presentation',
    'leadership': 'leadership',
    'entrepreneurship': 'entrepreneurship',
    'custom': 'custom',
};

// Map AI position responses to our form values
const positionMap = {
    'first': 'first',
    'first prize': 'first',
    'second': 'second',
    'second prize': 'second',
    'third': 'third',
    'third prize': 'third',
    'participant': 'participant',
    'participation': 'participant',
    'organizer': 'organizer',
    'coordinator': 'coordinator',
    'core coordinator': 'coordinator',
    'sub coordinator': 'sub_coordinator',
    'sub_coordinator': 'sub_coordinator',
    'volunteer': 'volunteer',
    'chairman': 'chairman',
    'secretary': 'secretary',
    'council member': 'council_member',
    'council_member': 'council_member',
    'class representative': 'class_representative',
    'class_representative': 'class_representative',
};

// Map AI level responses to our form values
const levelMap = {
    'college': 'college',
    'zonal': 'zonal',
    'district': 'district',
    'state': 'state',
    'national': 'national',
    'international': 'international',
};

const UploadActivity = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isCyberpunk } = useTheme();
    const { playClick, playHover, playSuccess } = useClickSound();
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiExtracted, setAiExtracted] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [uploadMode, setUploadMode] = useState('manual');
    const [filePreview, setFilePreview] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [showAiWarning, setShowAiWarning] = useState(false);

    const [formData, setFormData] = useState({
        activityType: '',
        customActivityType: '',
        eventName: '',
        description: '',
        level: '',
        position: '',
        organization: '',
        startDate: '',
        endDate: '',
        docBase64: '',
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Date validation: endDate cannot be before startDate
        if (name === 'endDate' && formData.startDate && value) {
            if (new Date(value) < new Date(formData.startDate)) {
                toast.error('End date cannot be before start date');
                return;
            }
        }
        if (name === 'startDate' && formData.endDate && value) {
            if (new Date(value) > new Date(formData.endDate)) {
                // Auto-clear endDate if startDate is moved past it
                setFormData(prev => ({ ...prev, [name]: value, endDate: '' }));
                if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
                return;
            }
        }

        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Please upload a PDF, JPG, or PNG file');
            return;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onload = () => {
            setFormData(prev => ({ ...prev, docBase64: reader.result }));
            setFilePreview({
                name: file.name,
                type: file.type,
                size: (file.size / 1024).toFixed(1) + ' KB'
            });
            // Reset AI state when new file is uploaded
            setAiExtracted(false);
            setAiResult(null);
            playClick();
        };
        reader.readAsDataURL(file);
    };

    const handleAIExtract = async () => {
        if (!formData.docBase64) {
            toast.error('Please upload a document first');
            return;
        }

        setAiLoading(true);
        try {
            const response = await activityAPI.aiExtract({ docBase64: formData.docBase64 });
            const data = response.data.data;
            setAiResult(data);

            // Map AI response to form fields
            const mappedCategory = categoryMap[data.category?.toLowerCase()] || 'custom';
            const mappedLevel = levelMap[data.level?.toLowerCase()] || '';
            const mappedPosition = positionMap[data.position?.toLowerCase()] || positionMap[data.participation_type?.toLowerCase()] || '';

            setFormData(prev => ({
                ...prev,
                activityType: mappedCategory,
                customActivityType: mappedCategory === 'custom' ? (data.category || '') : '',
                eventName: data.title || '',
                description: data.remarks || '',
                level: mappedLevel,
                position: mappedPosition,
                organization: data.issuing_authority || '',
                startDate: data.start_date || '',
                endDate: data.end_date || '',
            }));

            setAiExtracted(true);
            playSuccess();
            const remaining = response.data.remaining;
            toast.success(`AI extracted details! (${remaining} use${remaining !== 1 ? 's' : ''} remaining today)`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'AI extraction failed. Please fill manually.');
        } finally {
            setAiLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.activityType) newErrors.activityType = 'Activity type is required';
        if (formData.activityType === 'custom' && !formData.customActivityType.trim()) {
            newErrors.customActivityType = 'Please specify your activity type';
        }
        if (!formData.eventName.trim()) newErrors.eventName = 'Event name is required';
        if (!formData.level) newErrors.level = 'Level is required';
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.docBase64) newErrors.doc = 'Please upload a certificate/document';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            await activityAPI.upload({
                ...formData,
                uploadMode,
            });

            setSubmitted(true);
            playSuccess();
            toast.success('Activity submitted successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            activityType: '',
            customActivityType: '',
            eventName: '',
            description: '',
            level: '',
            position: '',
            organization: '',
            startDate: '',
            endDate: '',
            docBase64: '',
        });
        setFilePreview(null);
        setAiExtracted(false);
        setAiResult(null);
        setSubmitted(false);
    };

    // Block uploads if student profile is not verified
    if (!user?.profileVerified) {
        return (
            <div className="upload-blocked">
                <Card className="blocked-card">
                    <div className="blocked-icon">
                        <ShieldAlert size={64} />
                    </div>
                    <h2>Profile Verification Required</h2>
                    <p>Your profile is pending verification by a teacher. You can upload activities once your profile is verified.</p>
                    <Link to="/student" className="btn btn-primary" onClick={playClick}>
                        Back to Dashboard
                    </Link>
                </Card>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="upload-success">
                <Card className="success-card">
                    <div className="success-icon">
                        <CheckCircle size={64} />
                    </div>
                    <h2>Activity Submitted!</h2>
                    <p>Your activity has been submitted for verification. You'll be notified once it's reviewed.</p>
                    <div className="success-actions">
                        <Button onClick={() => { playClick(); resetForm(); }}>
                            Upload Another
                        </Button>
                        <Button variant="secondary" onClick={() => { playClick(); navigate('/student/activities'); }}>
                            View My Activities
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    // In AI mode, show form fields only after AI extraction or if user wants to fill manually
    const showFormFields = uploadMode === 'manual' || aiExtracted;

    return (
        <div className="upload-activity">
            <div className="page-header">
                <h1>Upload Activity</h1>
                <p>Submit your certificates and documents for verification</p>
            </div>

            {/* Upload Mode Toggle */}
            <div className="mode-toggle">
                <button
                    className={`mode-btn ${uploadMode === 'manual' ? 'active' : ''}`}
                    onClick={() => { playClick(); setUploadMode('manual'); setAiExtracted(false); setAiResult(null); }}
                    onMouseEnter={playHover}
                >
                    <FileText size={20} />
                    Manual Entry
                </button>
                <button
                    className={`mode-btn ${uploadMode === 'ai' ? 'active' : ''}`}
                    onClick={() => { playClick(); setUploadMode('ai'); }}
                    onMouseEnter={playHover}
                >
                    <Sparkles size={20} />
                    AI Extraction
                    <span className="badge badge-primary">Beta</span>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="upload-form">
                <div className={`form-grid ${uploadMode === 'ai' && !aiExtracted ? 'ai-upload-only' : ''}`}>
                    {/* Left: Form Fields - hidden in AI mode until extraction */}
                    {showFormFields && (
                        <Card className={`form-card ${aiExtracted ? 'ai-filled' : ''}`} hover={false}>
                            <h3>
                                {aiExtracted ? (
                                    <span className="ai-filled-header">
                                        <Sparkles size={18} />
                                        AI Extracted Details
                                        <span className="badge badge-success">Auto-filled</span>
                                    </span>
                                ) : 'Activity Details'}
                            </h3>
                            {aiExtracted && aiResult && (
                                <div className="ai-marks-banner">
                                    <div className="marks-info">
                                        <span className="marks-label">AI Suggested Marks</span>
                                        <span className="marks-value">{aiResult.marks_awarded || 0}</span>
                                    </div>
                                    <div className="marks-info">
                                        <span className="marks-label">Max Allowed</span>
                                        <span className="marks-value">{aiResult.max_allowed_marks || 0}</span>
                                    </div>
                                    {aiResult.verified === false && (
                                        <div className="marks-warning">
                                            ⚠️ AI could not fully verify this document
                                        </div>
                                    )}
                                </div>
                            )}

                            <p className="edit-hint">
                                {aiExtracted ? 'You can edit any field below before submitting.' : ''}
                            </p>

                            <div className="form-row">
                                <Select
                                    label="Activity Type *"
                                    name="activityType"
                                    value={formData.activityType}
                                    onChange={handleChange}
                                    options={ACTIVITY_TYPES}
                                    placeholder="Select type"
                                    error={errors.activityType}
                                />

                                <Select
                                    label="Level *"
                                    name="level"
                                    value={formData.level}
                                    onChange={handleChange}
                                    options={LEVELS}
                                    placeholder="Select level"
                                    error={errors.level}
                                />
                            </div>

                            {formData.activityType === 'custom' && (
                                <Input
                                    label="Custom Activity Type *"
                                    name="customActivityType"
                                    value={formData.customActivityType}
                                    onChange={handleChange}
                                    placeholder="Type your activity type..."
                                    error={errors.customActivityType}
                                />
                            )}

                            <Input
                                label="Event Name *"
                                name="eventName"
                                value={formData.eventName}
                                onChange={handleChange}
                                placeholder="e.g., Inter-College Football Championship"
                                error={errors.eventName}
                            />

                            <div className="form-row">
                                <Select
                                    label="Position/Role"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleChange}
                                    options={POSITIONS}
                                    placeholder="Select position"
                                />

                                <Input
                                    label="Organization"
                                    name="organization"
                                    value={formData.organization}
                                    onChange={handleChange}
                                    placeholder="Organizing body"
                                />
                            </div>

                            <div className="form-row">
                                <Input
                                    label="Start Date *"
                                    name="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    error={errors.startDate}
                                />

                                <Input
                                    label="End Date"
                                    name="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    min={formData.startDate || undefined}
                                    error={errors.endDate}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description (Optional)</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Brief description of the activity..."
                                    className="form-input"
                                    rows={3}
                                />
                            </div>
                        </Card>
                    )}

                    {/* Right: File Upload */}
                    <Card className={`upload-card ${uploadMode === 'ai' && !aiExtracted ? 'upload-card-full' : ''}`} hover={false}>
                        <h3>{uploadMode === 'ai' ? '📄 Upload & Extract' : 'Upload Certificate'}</h3>
                        <p className="upload-hint">
                            {uploadMode === 'ai'
                                ? 'Upload your certificate and AI will automatically extract the details'
                                : 'Upload a clear image or PDF of your certificate'}
                        </p>

                        <div className="upload-zone">
                            <input
                                type="file"
                                id="doc-upload"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                                className="upload-input"
                            />
                            <label htmlFor="doc-upload" className="upload-label">
                                {filePreview ? (
                                    <div className="file-preview">
                                        <FileText size={48} />
                                        <span className="file-name">{filePreview.name}</span>
                                        <span className="file-size">{filePreview.size}</span>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setFilePreview(null);
                                                setFormData(prev => ({ ...prev, docBase64: '' }));
                                                setAiExtracted(false);
                                                setAiResult(null);
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div className="upload-prompt">
                                        <Upload size={48} />
                                        <span>Click to upload or drag & drop</span>
                                        <span className="upload-formats">PDF, JPG, PNG (max 10MB)</span>
                                    </div>
                                )}
                            </label>
                        </div>
                        {errors.doc && <span className="form-error">{errors.doc}</span>}

                        {/* AI Extract Button */}
                        {uploadMode === 'ai' && filePreview && !aiExtracted && (
                            <button
                                type="button"
                                className="ai-extract-btn"
                                onClick={() => { playClick(); setShowAiWarning(true); }}
                                onMouseEnter={playHover}
                                disabled={aiLoading}
                            >
                                {aiLoading ? (
                                    <>
                                        <Loader2 size={20} className="spin-icon" />
                                        Analyzing Document...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} />
                                        Extract with AI ✨
                                    </>
                                )}
                            </button>
                        )}

                        {/* AI Info / Status */}
                        {uploadMode === 'ai' && !filePreview && (
                            <div className="ai-info">
                                <Sparkles size={20} />
                                <p>Upload a certificate and click "Extract with AI" to auto-fill the form</p>
                            </div>
                        )}

                        {aiExtracted && aiResult && (
                            <div className="ai-success-info">
                                <CheckCircle size={20} />
                                <p>AI extraction complete! Review the auto-filled fields and submit.</p>
                            </div>
                        )}
                    </Card>
                </div>

                {/* AI Loading Overlay */}
                {aiLoading && (
                    <div className="ai-loading-overlay">
                        <div className="ai-loading-content">
                            <div className="ai-loading-spinner">
                                <Sparkles size={40} className="ai-sparkle-icon" />
                            </div>
                            <h3>AI is analyzing your document...</h3>
                            <p>Extracting activity details, this may take a few seconds</p>
                            <div className="ai-loading-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Warning Popup */}
                {showAiWarning && (
                    <div className="ai-warning-overlay" onClick={() => setShowAiWarning(false)}>
                        <div className="ai-warning-dialog" onClick={(e) => e.stopPropagation()}>
                            <div className="ai-warning-icon">⚠️</div>
                            <h3>AI Extraction Notice</h3>
                            <p>
                                AI can make mistakes. Please review the extracted data carefully
                                and make any necessary corrections before submitting your activity.
                            </p>
                            <div className="ai-warning-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowAiWarning(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary ai-warning-ok-btn"
                                    onClick={() => {
                                        setShowAiWarning(false);
                                        handleAIExtract();
                                    }}
                                >
                                    <Sparkles size={16} />
                                    OK, Extract
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showFormFields && (
                    <div className="form-actions">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => { playClick(); navigate('/student'); }}
                            onMouseEnter={playHover}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={loading}
                            icon={Upload}
                            onClick={playClick}
                            onMouseEnter={playHover}
                        >
                            Submit for Verification
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default UploadActivity;
