import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../api';
import { Card, Loading } from '../../components/ui';
import {
    Users,
    FileText,
    TrendingUp,
    Clock,
    ArrowRight,
    Award
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6', '#8b5cf6'];

const AdminDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await adminAPI.getStats();
            setStats(response.data);
        } catch (error) {
            toast.error('Failed to load statistics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loading fullScreen text="Loading dashboard..." />;
    }

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>Admin Dashboard</h1>
                    <p>System overview and management</p>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="stats-grid">
                <Card className="stat-card">
                    <div className="stat-icon gradient-blue">
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.overview?.totalStudents || 0}</span>
                        <span className="stat-label">Students</span>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-icon gradient-purple">
                        <Award size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.overview?.totalTeachers || 0}</span>
                        <span className="stat-label">Teachers</span>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-icon gradient-green">
                        <FileText size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.overview?.totalActivities || 0}</span>
                        <span className="stat-label">Total Activities</span>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-icon gradient-yellow">
                        <Clock size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.overview?.pendingActivities || 0}</span>
                        <span className="stat-label">Pending</span>
                    </div>
                </Card>
            </div>

            {/* Charts */}
            <div className="charts-grid">
                <Card title="Activities by Type">
                    {stats?.byType?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stats.byType}
                                    dataKey="count"
                                    nameKey="_id"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={({ _id, count }) => `${_id}: ${count}`}
                                >
                                    {stats.byType.map((entry, index) => (
                                        <Cell key={entry._id} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-chart">No data</div>
                    )}
                </Card>

                <Card title="Monthly Submissions">
                    {stats?.byMonth?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.byMonth}>
                                <XAxis dataKey="_id" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-chart">No data</div>
                    )}
                </Card>
            </div>

            {/* Top Students */}
            <Card
                title="Top Students by Points"
                action={
                    <Link to="/admin/users" className="btn btn-ghost btn-sm">
                        View All <ArrowRight size={16} />
                    </Link>
                }
            >
                {stats?.topStudents?.length > 0 ? (
                    <div className="top-students">
                        {stats.topStudents.map((student, index) => (
                            <div key={student._id} className="student-item">
                                <span className={`rank rank-${index + 1}`}>#{index + 1}</span>
                                <div className="student-info">
                                    <h4>{student.fullName}</h4>
                                    <p>{student.registrationNumber} • {student.branch} {student.semester}</p>
                                </div>
                                <span className="student-points">{student.totalPoints} pts</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">No students yet</div>
                )}
            </Card>

            {/* Quick Links */}
            <div className="quick-links">
                <Link to="/admin/users" className="quick-link">
                    <Users size={20} />
                    Manage Users
                </Link>
                <Link to="/admin/rules" className="quick-link">
                    <TrendingUp size={20} />
                    Point Rules
                </Link>
                <Link to="/admin/audit" className="quick-link">
                    <FileText size={20} />
                    Audit Logs
                </Link>
            </div>
        </div>
    );
};

export default AdminDashboard;
