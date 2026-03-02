import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { activityAPI, teacherAPI } from '../../api';
import { Button, Input, Select, Card } from '../../components/ui';
import { Upload, FileText, CheckCircle, Users, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import './SubmitForStudent.css';

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

const SubmitForStudent = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [studentsLoading, setStudentsLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [filePreview, setFilePreview] = useState(null);

    const [formData, setFormData] = useState({
        studentId: '',
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

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await teacherAPI.getStudents({ limit: 500 });
            setStudents(response.data.students || []);
        } catch (error) {
            toast.error('Failed to load students');
        } finally {
            setStudentsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'endDate' && formData.startDate && value) {
            if (new Date(value) < new Date(formData.startDate)) {
                toast.error('End date cannot be before start date');
                return;
            }
        }
        if (name === 'startDate' && formData.endDate && value) {
            if (new Date(value) > new Date(formData.endDate)) {
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

        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Please upload a PDF, JPG, or PNG file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

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
        if (!formData.studentId) newErrors.studentId = 'Please select a student';
        if (!formData.activityType) newErrors.activityType = 'Activity type is required';
        if (formData.activityType === 'custom' && !formData.customActivityType.trim()) {
            newErrors.customActivityType = 'Please specify your activity type';
        }
        if (!formData.eventName.trim()) newErrors.eventName = 'Event name is required';
        if (!formData.level) newErrors.level = 'Level is required';
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        // Note: document is optional for teacher submissions

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            await activityAPI.upload({
                activityType: formData.activityType === 'custom' ? formData.customActivityType : formData.activityType,
                eventName: formData.eventName,
                description: formData.description,
                level: formData.level,
                position: formData.position,
                organization: formData.organization,
                startDate: formData.startDate,
                endDate: formData.endDate,
                docBase64: formData.docBase64 || undefined,
                studentId: formData.studentId,
                uploadMode: 'manual',
            });

            setSubmitted(true);
            toast.success('Activity submitted and approved for student!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            studentId: '',
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
        setSubmitted(false);
    };

    const selectedStudent = students.find(s => s._id === formData.studentId);

    const filteredStudents = students.filter(s => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            s.fullName?.toLowerCase().includes(q) ||
            s.registrationNumber?.toLowerCase().includes(q) ||
            s.branch?.toLowerCase().includes(q)
        );
    });

    if (submitted) {
        return (
            <div className="sfs-success">
                <Card className="sfs-success-card">
                    <div className="sfs-success-icon">
                        <CheckCircle size={64} />
                    </div>
                    <h2>Activity Submitted & Approved!</h2>
                    <p>
                        The activity has been submitted and auto-approved for{' '}
                        <strong>{selectedStudent?.fullName}</strong>.
                        The student has been notified and their points have been updated.
                    </p>
                    <div className="sfs-success-actions">
                        <Button onClick={resetForm}>Submit Another</Button>
                        <Button variant="secondary" onClick={() => navigate('/teacher')}>
                            Back to Dashboard
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="submit-for-student">
            <div className="page-header">
                <div>
                    <h1>Submit for Student</h1>
                    <p>Submit an activity on behalf of a student — it will be auto-approved</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="sfs-form">
                {/* Student Selection */}
                <Card className="sfs-card" hover={false}>
                    <h3><Users size={20} /> Select Student</h3>

                    <div className="sfs-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, reg number, or branch..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="sfs-search-input"
                        />
                    </div>

                    {studentsLoading ? (
                        <p className="sfs-loading-text">Loading students...</p>
                    ) : (
                        <>
                            <select
                                name="studentId"
                                value={formData.studentId}
                                onChange={handleChange}
                                className={`sfs-student-select ${errors.studentId ? 'has-error' : ''}`}
                            >
                                <option value="">-- Select a Student --</option>
                                {filteredStudents.map(s => (
                                    <option key={s._id} value={s._id}>
                                        {s.fullName} — {s.registrationNumber} ({s.branch} {s.semester})
                                    </option>
                                ))}
                            </select>
                            {errors.studentId && <span className="form-error">{errors.studentId}</span>}

                            {selectedStudent && (
                                <div className="sfs-selected-info">
                                    <div className="sfs-selected-avatar">
                                        {selectedStudent.fullName?.charAt(0)}
                                    </div>
                                    <div>
                                        <strong>{selectedStudent.fullName}</strong>
                                        <span>{selectedStudent.registrationNumber} • {selectedStudent.branch} {selectedStudent.semester}</span>
                                        <span>Current Points: {selectedStudent.totalPoints || 0}</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </Card>

                {/* Activity Details */}
                <Card className="sfs-card" hover={false}>
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

                {/* Document Upload (Optional) */}
                <Card className="sfs-card" hover={false}>
                    <h3>Upload Certificate (Optional)</h3>
                    <p className="sfs-doc-hint">
                        You can optionally attach a certificate or document. Teacher submissions are auto-approved even without a document.
                    </p>

                    <div className="upload-zone">
                        <input
                            type="file"
                            id="sfs-doc-upload"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            className="upload-input"
                        />
                        <label htmlFor="sfs-doc-upload" className="upload-label">
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
                </Card>

                {/* Submit Actions */}
                <div className="sfs-actions">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/teacher')}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        loading={loading}
                        icon={Upload}
                    >
                        Submit & Approve Activity
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default SubmitForStudent;
