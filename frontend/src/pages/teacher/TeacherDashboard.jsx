import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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

    if (loading) {
        return <Loading fullScreen text="Loading dashboard..." />;
    }

    if (needsSubscription) {
        return (
            <div className="td-subscription-prompt">
                <div className="td-prompt-card">
                    <div className="td-prompt-icon-wrap">
                        <AlertCircle size={48} />
                    </div>
                    <h2>Subscribe to Classes</h2>
                    <p>You need to subscribe to classes to start receiving student activities for verification.</p>
                    <Link to="/teacher/classes" className="btn btn-primary btn-lg">
                        Subscribe to Classes
                    </Link>
                </div>
            </div>
        );
    }

    const pending = stats?.pendingActivities || 0;

    return (
        <div className="teacher-dashboard">
            {/* Header */}
            <div className="td-header">
                <div className="td-header-info">
                    <h1>Welcome back, {user?.fullName?.split(' ')[0]}! 👋</h1>
                    <p>Here's your overview of student activities</p>
                </div>
                <Link to="/teacher/verification" className="btn btn-primary">
                    <CheckSquare size={18} />
                    Review Activities
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
                        <span className="td-stat-label">Total Students</span>
                    </div>
                    <div className="td-stat-decoration" />
                </div>

                <div className={`td-stat-card td-stat-amber ${pending > 0 ? 'td-stat-pulse' : ''}`}>
                    <div className="td-stat-icon-wrap">
                        <Clock size={26} />
                    </div>
                    <div className="td-stat-body">
                        <span className="td-stat-value">{pending}</span>
                        <span className="td-stat-label">Pending Review</span>
                    </div>
                    <div className="td-stat-decoration" />
                </div>

                <div className="td-stat-card td-stat-emerald">
                    <div className="td-stat-icon-wrap">
                        <CheckSquare size={26} />
                    </div>
                    <div className="td-stat-body">
                        <span className="td-stat-value">{stats?.approvedActivities || 0}</span>
                        <span className="td-stat-label">Approved</span>
                    </div>
                    <div className="td-stat-decoration" />
                </div>

                <div className="td-stat-card td-stat-rose">
                    <div className="td-stat-icon-wrap">
                        <TrendingUp size={26} />
                    </div>
                    <div className="td-stat-body">
                        <span className="td-stat-value">{stats?.rejectedActivities || 0}</span>
                        <span className="td-stat-label">Rejected</span>
                    </div>
                    <div className="td-stat-decoration" />
                </div>
            </div>

            {/* Recent Activities */}
            <Card
                title="Recent Submissions"
                action={
                    <Link to="/teacher/verification" className="btn btn-ghost btn-sm">
                        View All <ArrowRight size={16} />
                    </Link>
                }
                className="td-recent-card"
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
                                        {activity.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="td-empty-state">
                        <Clock size={48} className="text-tertiary" />
                        <p>No recent submissions</p>
                    </div>
                )}
            </Card>

            {/* Quick Actions */}
            <div className="td-quick-actions">
                <Link to="/teacher/verification" className="td-action-card">
                    <div className="td-action-icon td-action-purple">
                        <ClipboardCheck size={28} />
                    </div>
                    <h4>Verify Activities</h4>
                    <p>Review pending student submissions</p>
                    <span className="td-action-arrow"><ArrowRight size={18} /></span>
                </Link>

                <Link to="/teacher/submit" className="td-action-card">
                    <div className="td-action-icon td-action-blue">
                        <UserPlus size={28} />
                    </div>
                    <h4>Submit for Student</h4>
                    <p>Add activity on behalf of a student</p>
                    <span className="td-action-arrow"><ArrowRight size={18} /></span>
                </Link>

                <Link to="/teacher/reminders" className="td-action-card">
                    <div className="td-action-icon td-action-teal">
                        <Send size={28} />
                    </div>
                    <h4>Send Reminders</h4>
                    <p>Notify students about deadlines</p>
                    <span className="td-action-arrow"><ArrowRight size={18} /></span>
                </Link>
            </div>

            {/* Recent Notifications */}
            {notifications.length > 0 && (
                <Card
                    title="Recent Notifications"
                    className="td-notif-card"
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
