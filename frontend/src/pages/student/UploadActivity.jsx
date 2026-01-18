import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { activityAPI, authAPI } from '../../api';
import { Button, Input, Select, Card } from '../../components/ui';
import { Upload, FileText, Sparkles, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import './UploadActivity.css';

const ACTIVITY_TYPES = [
    { value: 'sports', label: 'Sports' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'technical', label: 'Technical' },
    { value: 'nss', label: 'NSS' },
    { value: 'ncc', label: 'NCC' },
    { value: 'internship', label: 'Internship' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'hackathon', label: 'Hackathon' },
    { value: 'paper_publication', label: 'Paper Publication' },
    { value: 'project', label: 'Project' },
    { value: 'volunteer', label: 'Volunteer Work' },
    { value: 'other', label: 'Other' },
];

const LEVELS = [
    { value: 'college', label: 'College Level' },
    { value: 'district', label: 'District Level' },
    { value: 'state', label: 'State Level' },
    { value: 'national', label: 'National Level' },
    { value: 'international', label: 'International Level' },
];

const POSITIONS = [
    { value: '', label: 'Not Applicable' },
    { value: 'first', label: 'First Place' },
    { value: 'second', label: 'Second Place' },
    { value: 'third', label: 'Third Place' },
    { value: 'participant', label: 'Participant' },
    { value: 'organizer', label: 'Organizer' },
];

const UploadActivity = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploadMode, setUploadMode] = useState('manual');
    const [filePreview, setFilePreview] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        activityType: '',
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
        };
        reader.readAsDataURL(file);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.activityType) newErrors.activityType = 'Activity type is required';
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
            toast.success('Activity submitted successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

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
                        <Button onClick={() => setSubmitted(false)}>
                            Upload Another
                        </Button>
                        <Button variant="secondary" onClick={() => navigate('/student/activities')}>
                            View My Activities
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

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
                    onClick={() => setUploadMode('manual')}
                >
                    <FileText size={20} />
                    Manual Entry
                </button>
                <button
                    className={`mode-btn ${uploadMode === 'ai' ? 'active' : ''}`}
                    onClick={() => setUploadMode('ai')}
                >
                    <Sparkles size={20} />
                    AI Extraction
                    <span className="badge badge-primary">Beta</span>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="upload-form">
                <div className="form-grid">
                    {/* Left: Form Fields */}
                    <Card className="form-card" hover={false}>
                        <h3>Activity Details</h3>

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

                    {/* Right: File Upload */}
                    <Card className="upload-card" hover={false}>
                        <h3>Upload Certificate</h3>
                        <p className="upload-hint">
                            Upload a clear image or PDF of your certificate
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

                        {uploadMode === 'ai' && filePreview && (
                            <div className="ai-info">
                                <Sparkles size={20} />
                                <p>AI will attempt to extract activity details from your document</p>
                            </div>
                        )}
                    </Card>
                </div>

                <div className="form-actions">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/student')}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        loading={loading}
                        icon={Upload}
                    >
                        Submit for Verification
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default UploadActivity;
