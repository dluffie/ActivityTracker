import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../api';
import { Card, Loading, Button, Input, Select } from '../components/ui';
import {
    User,
    Mail,
    Phone,
    BookOpen,
    Award,
    Camera,
    Save,
    GraduationCap,
    Building
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        semester: '',
        section: '',
        phone: '',
        profileImage: ''
    });

    const SEMESTER_OPTIONS = [
        { value: 'S1', label: 'Semester 1' },
        { value: 'S2', label: 'Semester 2' },
        { value: 'S3', label: 'Semester 3' },
        { value: 'S4', label: 'Semester 4' },
        { value: 'S5', label: 'Semester 5' },
        { value: 'S6', label: 'Semester 6' },
        { value: 'S7', label: 'Semester 7' },
        { value: 'S8', label: 'Semester 8' },
    ];

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await userAPI.getProfile();
            setProfile(response.data.user);
            setFormData({
                semester: response.data.user.semester || '',
                section: response.data.user.section || '',
                phone: response.data.user.phone || '',
                profileImage: ''
            });
        } catch (error) {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image must be less than 5MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, profileImage: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updateData = {};
            if (formData.semester) updateData.semester = formData.semester;
            if (formData.section) updateData.section = formData.section;
            if (formData.phone) updateData.phone = formData.phone;
            if (formData.profileImage) updateData.profileImage = formData.profileImage;

            const response = await userAPI.updateProfile(updateData);
            setProfile(response.data.user);
            updateUser(response.data.user);
            setEditMode(false);
            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <Loading fullScreen text="Loading profile..." />;
    }

    return (
        <div className="profile-page">
            <div className="page-header">
                <div>
                    <h1>My Profile</h1>
                    <p>View and manage your account information</p>
                </div>
                {!editMode && (
                    <Button onClick={() => setEditMode(true)}>
                        Edit Profile
                    </Button>
                )}
            </div>

            <div className="profile-content">
                {/* Profile Card */}
                <Card className="profile-card">
                    <div className="profile-header">
                        <div className="avatar-section">
                            <div className="avatar">
                                {profile?.profileImage ? (
                                    <img src={profile.profileImage} alt={profile.fullName} />
                                ) : (
                                    <User size={48} />
                                )}
                                {editMode && (
                                    <label className="avatar-upload">
                                        <Camera size={20} />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            hidden
                                        />
                                    </label>
                                )}
                            </div>
                            {formData.profileImage && editMode && (
                                <span className="upload-indicator">New image selected</span>
                            )}
                        </div>
                        <div className="profile-name">
                            <h2>{profile?.fullName}</h2>
                            <span className={`role-badge badge-${profile?.role}`}>
                                {profile?.role}
                            </span>
                        </div>
                    </div>

                    {editMode ? (
                        <form onSubmit={handleSubmit} className="profile-form">
                            {profile?.role === 'student' && (
                                <Select
                                    label="Semester"
                                    name="semester"
                                    value={formData.semester}
                                    onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                                    options={SEMESTER_OPTIONS}
                                />
                            )}
                            <Input
                                label="Section"
                                name="section"
                                value={formData.section}
                                onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                                placeholder="Enter section (e.g., A, B)"
                            />
                            <Input
                                label="Phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="Enter phone number"
                            />
                            <div className="form-actions">
                                <Button type="button" variant="secondary" onClick={() => setEditMode(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" loading={saving}>
                                    <Save size={16} /> Save Changes
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="profile-details">
                            <div className="detail-row">
                                <Mail size={18} />
                                <div>
                                    <span className="detail-label">Email</span>
                                    <span className="detail-value">{profile?.email}</span>
                                </div>
                            </div>

                            {profile?.phone && (
                                <div className="detail-row">
                                    <Phone size={18} />
                                    <div>
                                        <span className="detail-label">Phone</span>
                                        <span className="detail-value">{profile.phone}</span>
                                    </div>
                                </div>
                            )}

                            {profile?.role === 'student' && (
                                <>
                                    <div className="detail-row">
                                        <GraduationCap size={18} />
                                        <div>
                                            <span className="detail-label">Registration Number</span>
                                            <span className="detail-value">{profile.registrationNumber}</span>
                                        </div>
                                    </div>

                                    <div className="detail-row">
                                        <Building size={18} />
                                        <div>
                                            <span className="detail-label">Branch</span>
                                            <span className="detail-value">{profile.branch}</span>
                                        </div>
                                    </div>

                                    <div className="detail-row">
                                        <BookOpen size={18} />
                                        <div>
                                            <span className="detail-label">Semester & Section</span>
                                            <span className="detail-value">
                                                {profile.semester} {profile.section && `- Section ${profile.section}`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="detail-row highlight">
                                        <Award size={18} />
                                        <div>
                                            <span className="detail-label">Total Activity Points</span>
                                            <span className="detail-value points">{profile.totalPoints || 0} / 60</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            {profile?.role === 'teacher' && profile?.subscribedClasses?.length > 0 && (
                                <div className="detail-row">
                                    <BookOpen size={18} />
                                    <div>
                                        <span className="detail-label">Subscribed Classes</span>
                                        <div className="classes-list">
                                            {profile.subscribedClasses.map((c, i) => (
                                                <span key={i} className="class-badge">
                                                    {c.branch} - {c.semester} {c.section && `(${c.section})`}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Profile;
