import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { teacherAPI } from '../../api';
import { Card, Loading } from '../../components/ui';
import {
    Users,
    CheckSquare,
    Clock,
    TrendingUp,
    ArrowRight,
    AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [recentActivities, setRecentActivities] = useState([]);
    const [needsSubscription, setNeedsSubscription] = useState(false);

    useEffect(() => {
        checkSubscription();
    }, []);

    const checkSubscription = async () => {
        try {
            const classesRes = await teacherAPI.getMyClasses();
            if (!classesRes.data.classes?.length) {
                setNeedsSubscription(true);
                setLoading(false);
                return;
            }
            fetchDashboardData();
        } catch (error) {
            toast.error('Failed to load data');
            setLoading(false);
        }
    };

    const fetchDashboardData = async () => {
        try {
            const response = await teacherAPI.getDashboardStats();
            setStats(response.data.stats);
            setRecentActivities(response.data.recentActivities || []);
        } catch (error) {
            toast.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loading fullScreen text="Loading dashboard..." />;
    }

    if (needsSubscription) {
        return (
            <div className="subscription-prompt">
                <Card className="prompt-card">
                    <div className="prompt-icon">
                        <AlertCircle size={64} />
                    </div>
                    <h2>Subscribe to Classes</h2>
                    <p>You need to subscribe to classes to start receiving student activities for verification.</p>
                    <Link to="/teacher/classes" className="btn btn-primary">
                        Subscribe to Classes
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="teacher-dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>Welcome, {user?.fullName?.split(' ')[0]}! 👋</h1>
                    <p>Here's your overview of student activities</p>
                </div>
                <Link to="/teacher/verification" className="btn btn-primary">
                    <CheckSquare size={18} />
                    Review Activities
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <Card className="stat-card">
                    <div className="stat-icon gradient-blue">
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.totalStudents || 0}</span>
                        <span className="stat-label">Total Students</span>
                    </div>
                </Card>

                <Card className="stat-card highlight">
                    <div className="stat-icon gradient-yellow">
                        <Clock size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.pendingActivities || 0}</span>
                        <span className="stat-label">Pending Review</span>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-icon gradient-green">
                        <CheckSquare size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.approvedActivities || 0}</span>
                        <span className="stat-label">Approved</span>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-icon gradient-red">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.rejectedActivities || 0}</span>
                        <span className="stat-label">Rejected</span>
                    </div>
                </Card>
            </div>

            {/* Recent Activities */}
            <Card
                title="Recent Submissions"
                action={
                    <Link to="/teacher/verification" className="btn btn-ghost btn-sm">
                        View All <ArrowRight size={16} />
                    </Link>
                }
            >
                {recentActivities.length > 0 ? (
                    <div className="recent-list">
                        {recentActivities.map((activity) => (
                            <div key={activity._id} className="recent-item">
                                <div className="recent-info">
                                    <h4>{activity.eventName}</h4>
                                    <p>
                                        {activity.student?.fullName} • {activity.student?.registrationNumber}
                                    </p>
                                </div>
                                <div className="recent-meta">
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
                    <div className="empty-state">
                        <Clock size={48} className="text-tertiary" />
                        <p>No recent submissions</p>
                    </div>
                )}
            </Card>

            {/* Quick Actions */}
            <div className="quick-actions">
                <Card className="action-card" hover>
                    <Link to="/teacher/verification">
                        <CheckSquare size={32} />
                        <h4>Verify Activities</h4>
                        <p>Review pending student submissions</p>
                    </Link>
                </Card>

                <Card className="action-card" hover>
                    <Link to="/teacher/submit">
                        <Users size={32} />
                        <h4>Submit for Student</h4>
                        <p>Add activity on behalf of a student</p>
                    </Link>
                </Card>

                <Card className="action-card" hover>
                    <Link to="/teacher/reminders">
                        <TrendingUp size={32} />
                        <h4>Send Reminders</h4>
                        <p>Notify students about deadlines</p>
                    </Link>
                </Card>
            </div>
        </div>
    );
};

export default TeacherDashboard;
