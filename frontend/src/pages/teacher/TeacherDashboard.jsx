import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { teacherAPI, notificationAPI } from '../../api';
import { Card, Loading } from '../../components/ui';
import useDataCache from '../../hooks/useDataCache';
import {
    Users,
    CheckSquare,
    Clock,
    TrendingUp,
    ArrowRight,
    AlertCircle,
    Send,
    ClipboardCheck,
    UserPlus,
    Bell,
    CheckCircle,
    XCircle,
    FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
    const { user } = useAuth();
    const { isBrutalist } = useTheme();
    const [needsSubscription, setNeedsSubscription] = useState(false);
    const [subscriptionChecked, setSubscriptionChecked] = useState(false);

    // Check subscription on mount
    useEffect(() => {
        const checkSub = async () => {
            try {
                const classesRes = await teacherAPI.getMyClasses();
                if (!classesRes.data.classes?.length) {
                    setNeedsSubscription(true);
                }
            } catch (error) {
                toast.error('Failed to load data');
            } finally {
                setSubscriptionChecked(true);
            }
        };
        checkSub();
    }, []);

    const fetchDashboardFn = useCallback(async () => {
        const [dashRes, notifRes] = await Promise.all([
            teacherAPI.getDashboardStats(),
            notificationAPI.getAll({ limit: 5 })
        ]);
        return {
            stats: dashRes.data.stats,
            recentActivities: dashRes.data.recentActivities || [],
            notifications: notifRes.data.notifications || [],
        };
    }, []);

    const { data: dashData, loading: dataLoading } = useDataCache(
        'teacher-dashboard',
        fetchDashboardFn,
        { deps: [subscriptionChecked] }
    );

    const loading = !subscriptionChecked || (dataLoading && !dashData);
    const stats = dashData?.stats || null;
    const recentActivities = dashData?.recentActivities || [];
    const notifications = dashData?.notifications || [];

    // Helper for label text
    const label = (normal, brutal) => isBrutalist ? brutal : normal;

    if (loading) {
        return <Loading fullScreen text={isBrutalist ? "LOADING_SYSTEMS..." : "Loading dashboard..."} />;
    }

    if (needsSubscription) {
        return (
            <div className={`td-subscription-prompt ${isBrutalist ? 'brutalist-mode' : ''}`}>
                <div className="td-prompt-card">
                    <div className="td-prompt-icon-wrap">
                        <AlertCircle size={48} />
                    </div>
                    <h2>{label('Subscribe to Classes', 'SUBSCRIBE_TO_CLASSES')}</h2>
                    <p>{label('You need to subscribe to classes to start receiving student activities for verification.', '→ SUBSCRIPTION_REQUIRED: SUBSCRIBE TO RECEIVE STUDENT ACTIVITY FEED.')}</p>
                    <Link to="/teacher/classes" className={`btn ${isBrutalist ? 'td-brutal-btn' : 'btn-primary'} btn-lg`}>
                        {label('Subscribe to Classes', 'SUBSCRIBE')}
                    </Link>
                </div>
            </div>
        );
    }

    const pending = stats?.pendingActivities || 0;

    return (
        <div className={`teacher-dashboard ${isBrutalist ? 'brutalist-mode' : ''}`}>
            {/* Brutalist blueprint background */}
            {isBrutalist && (
                <div className="td-brutalist-bg">
                    <div className="td-blueprint-grid" />
                    <div className="td-crosshair td-crosshair-tl" />
                    <div className="td-crosshair td-crosshair-tr" />
                    <div className="td-crosshair td-crosshair-bl" />
                    <div className="td-crosshair td-crosshair-br" />
                    <div className="td-stamp">CONTROL ROOM</div>
                </div>
            )}

            {/* Header */}
            <div className="td-header">
                <div className="td-header-info">
                    <h1>{label(
                        `Welcome back, ${user?.fullName?.split(' ')[0]}! 👋`,
                        `CONTROL_ROOM: ${user?.fullName?.split(' ')[0]?.toUpperCase()}`
                    )}</h1>
                    <p>{label(
                        "Here's your overview of student activities",
                        '// STUDENT_OVERSIGHT_PANEL — LIVE'
                    )}</p>
                </div>
                <Link to="/teacher/verification" className={`btn ${isBrutalist ? 'td-brutal-btn' : 'btn-primary'}`}>
                    <CheckSquare size={18} />
                    {label('Review Activities', 'REVIEW')}
                    {pending > 0 && <span className="td-badge-count">{pending}</span>}
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="td-stats-grid">
                <div className="td-stat-card td-stat-blue">
                    <div className="td-stat-icon-wrap">
                        <Users size={26} />
                    </div>
                    <div className="td-stat-body">
                        <span className="td-stat-value">{stats?.totalStudents || 0}</span>
                        <span className="td-stat-label">{label('Total Students', 'PERSONNEL')}</span>
                    </div>
                    {!isBrutalist && <div className="td-stat-decoration" />}
                </div>

                <div className={`td-stat-card td-stat-amber ${pending > 0 ? 'td-stat-pulse' : ''}`}>
                    <div className="td-stat-icon-wrap">
                        <Clock size={26} />
                    </div>
                    <div className="td-stat-body">
                        <span className="td-stat-value">{pending}</span>
                        <span className="td-stat-label">{label('Pending Review', 'QUEUE')}</span>
                    </div>
                    {!isBrutalist && <div className="td-stat-decoration" />}
                </div>

                <div className="td-stat-card td-stat-emerald">
                    <div className="td-stat-icon-wrap">
                        <CheckSquare size={26} />
                    </div>
                    <div className="td-stat-body">
                        <span className="td-stat-value">{stats?.approvedActivities || 0}</span>
                        <span className="td-stat-label">{label('Approved', 'CLEARED')}</span>
                    </div>
                    {!isBrutalist && <div className="td-stat-decoration" />}
                </div>

                <div className="td-stat-card td-stat-rose">
                    <div className="td-stat-icon-wrap">
                        <TrendingUp size={26} />
                    </div>
                    <div className="td-stat-body">
                        <span className="td-stat-value">{stats?.rejectedActivities || 0}</span>
                        <span className="td-stat-label">{label('Rejected', 'DENIED')}</span>
                    </div>
                    {!isBrutalist && <div className="td-stat-decoration" />}
                </div>
            </div>

            {/* Recent Activities */}
            <Card
                title={label('Recent Submissions', '// RECENT_ENTRIES')}
                action={
                    <Link to="/teacher/verification" className="btn btn-ghost btn-sm">
                        {label('View All', 'VIEW_ALL')} <ArrowRight size={16} />
                    </Link>
                }
                className={`td-recent-card ${isBrutalist ? 'brutal-card' : ''}`}
            >
                {recentActivities.length > 0 ? (
                    <div className="td-recent-list">
                        {recentActivities.map((activity, i) => (
                            <div key={activity._id}
                                className="td-recent-item"
                                style={{ animationDelay: `${i * 0.08}s` }}
                            >
                                <div className="td-recent-avatar">
                                    {activity.student?.fullName?.charAt(0) || '?'}
                                </div>
                                <div className="td-recent-info">
                                    <h4>{activity.eventName}</h4>
                                    <p>
                                        {activity.student?.fullName} • {activity.student?.registrationNumber}
                                    </p>
                                </div>
                                <div className="td-recent-meta">
                                    <span className={`badge badge-${activity.status === 'approved' ? 'success' :
                                        activity.status === 'rejected' ? 'error' :
                                            'warning'
                                        }`}>
                                        {isBrutalist ? activity.status.toUpperCase() : activity.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="td-empty-state">
                        <Clock size={48} className="text-tertiary" />
                        <p>{label('No recent submissions', 'NO_ENTRIES_LOGGED')}</p>
                    </div>
                )}
            </Card>

            {/* Quick Actions */}
            <div className="td-quick-actions">
                <Link to="/teacher/verification" className="td-action-card">
                    <div className="td-action-icon td-action-purple">
                        <ClipboardCheck size={28} />
                    </div>
                    <h4>{label('Verify Activities', 'VERIFY_ACTIVITIES')}</h4>
                    <p>{label('Review pending student submissions', 'REVIEW PENDING SUBMISSIONS')}</p>
                    <span className="td-action-arrow"><ArrowRight size={18} /></span>
                </Link>

                <Link to="/teacher/submit" className="td-action-card">
                    <div className="td-action-icon td-action-blue">
                        <UserPlus size={28} />
                    </div>
                    <h4>{label('Submit for Student', 'SUBMIT_FOR_STUDENT')}</h4>
                    <p>{label('Add activity on behalf of a student', 'ADD ACTIVITY ON BEHALF')}</p>
                    <span className="td-action-arrow"><ArrowRight size={18} /></span>
                </Link>

                <Link to="/teacher/reminders" className="td-action-card">
                    <div className="td-action-icon td-action-teal">
                        <Send size={28} />
                    </div>
                    <h4>{label('Send Reminders', 'SEND_REMINDERS')}</h4>
                    <p>{label('Notify students about deadlines', 'NOTIFY STUDENTS')}</p>
                    <span className="td-action-arrow"><ArrowRight size={18} /></span>
                </Link>
            </div>

            {/* Recent Notifications */}
            {notifications.length > 0 && (
                <Card
                    title={label('Recent Notifications', '// NOTIFICATIONS')}
                    className={`td-notif-card ${isBrutalist ? 'brutal-card' : ''}`}
                >
                    <div className="td-notif-list">
                        {notifications.map((notif) => {
                            const iconColor = notif.type === 'approval' ? '#22c55e'
                                : notif.type === 'rejection' ? '#ef4444'
                                    : notif.type === 'activity_submitted' ? '#3b82f6'
                                        : notif.type === 'teacher_submission' ? '#6366f1'
                                            : '#f59e0b';
                            const NotifIcon = notif.type === 'approval' ? CheckCircle
                                : notif.type === 'rejection' ? XCircle
                                    : notif.type === 'activity_submitted' ? FileText
                                        : Bell;
                            return (
                                <div key={notif._id} className={`td-notif-item ${!notif.read ? 'td-notif-unread' : ''}`}>
                                    <div className="td-notif-icon" style={{ color: iconColor }}>
                                        <NotifIcon size={18} />
                                    </div>
                                    <div className="td-notif-content">
                                        <span className="td-notif-title">{notif.title}</span>
                                        <span className="td-notif-message">
                                            {notif.message?.length > 80 ? notif.message.substring(0, 80) + '...' : notif.message}
                                        </span>
                                        <span className="td-notif-time">
                                            {new Date(notif.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        </span>
                                    </div>
                                    {!notif.read && <div className="td-notif-dot" />}
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default TeacherDashboard;
