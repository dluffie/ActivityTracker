import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { activityAPI } from '../../api';
import { Card, Loading } from '../../components/ui';
import {
    TrendingUp,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    Upload,
    ArrowRight
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip
} from 'recharts';
import toast from 'react-hot-toast';
import './StudentDashboard.css';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6', '#8b5cf6'];

const StudentDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [recentActivities, setRecentActivities] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, activitiesRes] = await Promise.all([
                activityAPI.getStats(),
                activityAPI.getMy({ limit: 5 })
            ]);
            setStats(statsRes.data);
            setRecentActivities(activitiesRes.data.activities);
        } catch (error) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const getStatusCounts = () => {
        if (!stats?.byStatus) return { pending: 0, approved: 0, rejected: 0 };
        return stats.byStatus.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, { pending: 0, approved: 0, rejected: 0 });
    };

    const getTotalApprovedPoints = () => {
        if (!stats?.byStatus) return 0;
        const approved = stats.byStatus.find(s => s._id === 'approved');
        return approved?.points || 0;
    };

    const statusCounts = getStatusCounts();
    const totalPoints = user?.totalPoints || getTotalApprovedPoints();
    const requiredPoints = 60;
    const progressPercent = Math.min((totalPoints / requiredPoints) * 100, 100);

    if (loading) {
        return <Loading fullScreen text="Loading dashboard..." />;
    }

    return (
        <div className="student-dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>Welcome, {user?.fullName?.split(' ')[0]}! 👋</h1>
                    <p>Here's your activity points overview</p>
                </div>
                <Link to="/student/upload" className="btn btn-primary">
                    <Upload size={18} />
                    Upload Activity
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <Card className="stat-card-main">
                    <div className="stat-icon gradient-purple">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{totalPoints}</span>
                        <span className="stat-label">Total Points</span>
                    </div>
                    <div className="stat-progress-section">
                        <div className="progress">
                            <div
                                className="progress-bar"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <span className="progress-label">
                            {totalPoints} / {requiredPoints} points required
                        </span>
                    </div>
                </Card>

                <Card className="stat-card-small">
                    <div className="stat-icon gradient-yellow">
                        <Clock size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{statusCounts.pending}</span>
                        <span className="stat-label">Pending</span>
                    </div>
                </Card>

                <Card className="stat-card-small">
                    <div className="stat-icon gradient-green">
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{statusCounts.approved}</span>
                        <span className="stat-label">Approved</span>
                    </div>
                </Card>

                <Card className="stat-card-small">
                    <div className="stat-icon gradient-red">
                        <XCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{statusCounts.rejected}</span>
                        <span className="stat-label">Rejected</span>
                    </div>
                </Card>
            </div>

            {/* Charts and Recent Activities */}
            <div className="dashboard-content">
                {/* Points by Activity Type */}
                <Card title="Points by Category" className="chart-card">
                    {stats?.byType?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={stats.byType}
                                    dataKey="points"
                                    nameKey="_id"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={({ _id, points }) => `${_id}: ${points}`}
                                >
                                    {stats.byType.map((entry, index) => (
                                        <Cell
                                            key={entry._id}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-chart">
                            <FileText size={48} className="text-tertiary" />
                            <p>No activities yet</p>
                        </div>
                    )}
                </Card>

                {/* Recent Activities */}
                <Card
                    title="Recent Activities"
                    action={
                        <Link to="/student/activities" className="btn btn-ghost btn-sm">
                            View All <ArrowRight size={16} />
                        </Link>
                    }
                    className="recent-card"
                >
                    {recentActivities.length > 0 ? (
                        <div className="recent-list">
                            {recentActivities.map((activity) => (
                                <div key={activity._id} className="recent-item">
                                    <div className="recent-info">
                                        <h4>{activity.eventName}</h4>
                                        <p>{activity.activityType} • {activity.level}</p>
                                    </div>
                                    <div className="recent-meta">
                                        <span className={`badge badge-${activity.status === 'approved' ? 'success' :
                                            activity.status === 'rejected' ? 'error' :
                                                activity.status === 'correction_needed' ? 'warning' :
                                                    'info'
                                            }`}>
                                            {activity.status}
                                        </span>
                                        {activity.status === 'approved' && (
                                            <span className="points">+{activity.pointsAssigned} pts</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <FileText size={48} className="text-tertiary" />
                            <p>No activities uploaded yet</p>
                            <Link to="/student/upload" className="btn btn-primary btn-sm">
                                Upload Your First Activity
                            </Link>
                        </div>
                    )}
                </Card>
            </div>

            {/* Quick Tips */}
            <Card className="tips-card" hover={false}>
                <h3>💡 Quick Tips</h3>
                <ul>
                    <li>Upload clear, readable certificates for faster verification</li>
                    <li>You need {requiredPoints} points total to graduate - you have {totalPoints}</li>
                    <li>Points from different categories (sports, cultural, tech) all count towards your total</li>
                </ul>
            </Card>
        </div>
    );
};

export default StudentDashboard;
