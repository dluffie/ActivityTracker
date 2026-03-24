import { useState, useEffect } from 'react';
import { teacherAPI, activityAPI } from '../../api';
import { X, User, BookOpen, Award, Clock, CheckCircle, XCircle, AlertTriangle, TrendingUp, Star } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import './StudentDetailModal.css';

const STATUS_COLORS = {
    approved: '#10b981',
    pending: '#f59e0b',
    rejected: '#ef4444',
    correction_needed: '#8b5cf6',
};

const STATUS_ICONS = {
    approved: CheckCircle,
    pending: Clock,
    rejected: XCircle,
    correction_needed: AlertTriangle,
};

const TYPE_LABELS = {
    ncc: 'NCC', nss: 'NSS', disaster_management: 'Disaster Mgmt',
    sports: 'Sports', cultural: 'Cultural', online_courses: 'Online Courses',
    competitions: 'Competitions', conferences: 'Conferences',
    paper_presentation: 'Paper Presentation', leadership: 'Leadership',
    entrepreneurship: 'Entrepreneurship', custom: 'Custom',
    technical: 'Technical', internship: 'Internship', workshop: 'Workshop',
    seminar: 'Seminar', hackathon: 'Hackathon', paper_publication: 'Paper Publication',
    project: 'Project', volunteer: 'Volunteer', other: 'Other',
};

const StudentDetailModal = ({ studentId, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [blogToggles, setBlogToggles] = useState({});

    useEffect(() => {
        if (studentId) fetchDetail();
    }, [studentId]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const res = await teacherAPI.getStudentDetail(studentId);
            setData(res.data);
            // Initialize blog toggle states from activity data
            const toggles = {};
            res.data.activities.forEach(a => {
                toggles[a._id] = a.featuredOnBlog || false;
            });
            setBlogToggles(toggles);
        } catch (err) {
            toast.error('Failed to load student details');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    if (!studentId) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    const toggleBlog = async (activityId) => {
        const newValue = !blogToggles[activityId];
        setBlogToggles(prev => ({ ...prev, [activityId]: newValue }));
        try {
            await activityAPI.edit(activityId, { featuredOnBlog: newValue });
            toast.success(newValue ? 'Added to blog!' : 'Removed from blog');
        } catch (err) {
            // Revert on failure
            setBlogToggles(prev => ({ ...prev, [activityId]: !newValue }));
            toast.error('Failed to update blog status');
        }
    };

    if (loading) {
        return (
            <div className="sdm-overlay" onClick={handleOverlayClick}>
                <div className="sdm-modal">
                    <div className="sdm-loading">
                        <div className="sdm-spinner" />
                        <p>Loading student details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { student, activities, stats } = data;
    const earned = stats.totalPointsEarned;
    const required = stats.requiredPoints;
    const remaining = Math.max(0, required - earned);
    const pct = Math.min(100, Math.round((earned / required) * 100));

    // Pie chart data
    const pieData = earned >= required
        ? [{ name: 'Earned', value: earned }]
        : [
            { name: 'Earned', value: earned },
            { name: 'Remaining', value: remaining },
        ];
    const pieColors = earned >= required ? ['#10b981'] : ['#2563eb', '#e5e7eb'];

    // Points by type for breakdown
    const typeEntries = Object.entries(stats.pointsByType || {}).sort((a, b) => b[1] - a[1]);

    return (
        <div className="sdm-overlay" onClick={handleOverlayClick}>
            <div className="sdm-modal">
                {/* Header */}
                <div className="sdm-header">
                    <div className="sdm-header-info">
                        <div className="sdm-avatar">
                            {student.fullName?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                            <h2>{student.fullName}</h2>
                            <p className="sdm-subtitle">
                                {student.registrationNumber} · {student.branch} — Sem {student.semester}
                                {student.section ? ` · Sec ${student.section}` : ''}
                            </p>
                        </div>
                    </div>
                    <button className="sdm-close" onClick={onClose}><X size={20} /></button>
                </div>

                {/* Body */}
                <div className="sdm-body">
                    {/* Progress Section */}
                    <div className="sdm-progress-section">
                        <div className="sdm-chart-wrap">
                            <ResponsiveContainer width={180} height={180}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        startAngle={90}
                                        endAngle={-270}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {pieData.map((_, i) => (
                                            <Cell key={i} fill={pieColors[i]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="sdm-chart-center">
                                <span className="sdm-chart-pct">{pct}%</span>
                                <span className="sdm-chart-label">{earned}/{required}</span>
                            </div>
                        </div>

                        <div className="sdm-stats-column">
                            <div className="sdm-stat-pill sdm-stat-approved">
                                <CheckCircle size={16} />
                                <span>{stats.approved} Approved</span>
                            </div>
                            <div className="sdm-stat-pill sdm-stat-pending">
                                <Clock size={16} />
                                <span>{stats.pending} Pending</span>
                            </div>
                            <div className="sdm-stat-pill sdm-stat-rejected">
                                <XCircle size={16} />
                                <span>{stats.rejected} Rejected</span>
                            </div>
                            {stats.correction > 0 && (
                                <div className="sdm-stat-pill sdm-stat-correction">
                                    <AlertTriangle size={16} />
                                    <span>{stats.correction} Correction</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Points Breakdown */}
                    {typeEntries.length > 0 && (
                        <div className="sdm-breakdown">
                            <h3><Award size={18} /> Points Breakdown</h3>
                            <div className="sdm-breakdown-bars">
                                {typeEntries.map(([type, points]) => (
                                    <div key={type} className="sdm-bar-row">
                                        <span className="sdm-bar-label">{TYPE_LABELS[type] || type}</span>
                                        <div className="sdm-bar-track">
                                            <div
                                                className="sdm-bar-fill"
                                                style={{ width: `${Math.min(100, (points / required) * 100)}%` }}
                                            />
                                        </div>
                                        <span className="sdm-bar-value">{points}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Activity Log */}
                    <div className="sdm-log">
                        <h3><BookOpen size={18} /> Activity Log ({activities.length})</h3>
                        {activities.length === 0 ? (
                            <p className="sdm-empty">No activities submitted yet.</p>
                        ) : (
                            <div className="sdm-log-list">
                                {activities.map((a) => {
                                    const StatusIcon = STATUS_ICONS[a.status] || Clock;
                                    return (
                                        <div key={a._id} className={`sdm-log-item sdm-status-${a.status}`}>
                                            <div className="sdm-log-icon">
                                                <StatusIcon size={16} />
                                            </div>
                                            <div className="sdm-log-info">
                                                <span className="sdm-log-event">{a.eventName}</span>
                                                <span className="sdm-log-meta">
                                                    {TYPE_LABELS[a.activityType] || a.activityType} · {a.level}
                                                    {a.pointsAssigned > 0 ? ` · ${a.pointsAssigned} pts` : ''}
                                                </span>
                                            </div>
                                            <div className="sdm-log-right">
                                                {a.status === 'approved' && (
                                                    <button
                                                        className={`sdm-blog-toggle ${blogToggles[a._id] ? 'active' : ''}`}
                                                        onClick={() => toggleBlog(a._id)}
                                                        title={blogToggles[a._id] ? 'Remove from blog' : 'Feature on blog'}
                                                    >
                                                        <Star size={14} fill={blogToggles[a._id] ? 'currentColor' : 'none'} />
                                                    </button>
                                                )}
                                                <span className={`sdm-status-badge sdm-badge-${a.status}`}>
                                                    {a.status === 'correction_needed' ? 'Correction' : a.status}
                                                </span>
                                                <span className="sdm-log-date">
                                                    {new Date(a.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDetailModal;
