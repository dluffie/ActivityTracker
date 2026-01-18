import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { Card, Loading, Select, Button } from '../../components/ui';
import { BarChart2, TrendingUp, Users, FileText, Download } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    CartesianGrid,
    Legend,
    AreaChart,
    Area
} from 'recharts';
import toast from 'react-hot-toast';
import './Analytics.css';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6', '#8b5cf6', '#ec4899', '#f97316'];

const Analytics = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [dateRange, setDateRange] = useState('year');

    useEffect(() => {
        fetchStats();
    }, [dateRange]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getStats();
            setStats(response.data);
        } catch (error) {
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loading fullScreen text="Loading analytics..." />;
    }

    return (
        <div className="analytics-page">
            <div className="page-header">
                <div>
                    <h1><BarChart2 size={28} /> Analytics Dashboard</h1>
                    <p>Comprehensive overview of system activity</p>
                </div>
                <div className="header-actions">
                    <Select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        options={[
                            { value: 'month', label: 'This Month' },
                            { value: 'quarter', label: 'This Quarter' },
                            { value: 'year', label: 'This Year' },
                            { value: 'all', label: 'All Time' },
                        ]}
                    />
                    <Button variant="secondary">
                        <Download size={16} /> Export Report
                    </Button>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="stats-grid">
                <Card className="stat-card gradient-blue">
                    <div className="stat-content">
                        <Users size={32} />
                        <div>
                            <span className="stat-value">{stats?.overview?.totalStudents || 0}</span>
                            <span className="stat-label">Total Students</span>
                        </div>
                    </div>
                </Card>
                <Card className="stat-card gradient-green">
                    <div className="stat-content">
                        <FileText size={32} />
                        <div>
                            <span className="stat-value">{stats?.overview?.totalActivities || 0}</span>
                            <span className="stat-label">Total Activities</span>
                        </div>
                    </div>
                </Card>
                <Card className="stat-card gradient-purple">
                    <div className="stat-content">
                        <TrendingUp size={32} />
                        <div>
                            <span className="stat-value">{stats?.overview?.totalPoints || 0}</span>
                            <span className="stat-label">Total Points Awarded</span>
                        </div>
                    </div>
                </Card>
                <Card className="stat-card gradient-yellow">
                    <div className="stat-content">
                        <FileText size={32} />
                        <div>
                            <span className="stat-value">{stats?.overview?.pendingActivities || 0}</span>
                            <span className="stat-label">Pending Review</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="charts-grid">
                <Card title="Activities by Type" className="chart-card">
                    {stats?.byType?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={stats.byType}
                                    dataKey="count"
                                    nameKey="_id"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={120}
                                    label={({ _id, count }) => `${_id}: ${count}`}
                                >
                                    {stats.byType.map((entry, index) => (
                                        <Cell key={entry._id} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-chart">No data available</div>
                    )}
                </Card>

                <Card title="Monthly Submissions" className="chart-card">
                    {stats?.byMonth?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={stats.byMonth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="_id" stroke="var(--text-tertiary)" />
                                <YAxis stroke="var(--text-tertiary)" />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#6366f1"
                                    fill="rgba(99, 102, 241, 0.2)"
                                    name="Activities"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-chart">No data available</div>
                    )}
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="charts-grid">
                <Card title="Points by Branch" className="chart-card">
                    {stats?.pointsByBranch?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.pointsByBranch}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="_id" stroke="var(--text-tertiary)" />
                                <YAxis stroke="var(--text-tertiary)" />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                />
                                <Bar dataKey="totalPoints" fill="#22c55e" radius={[4, 4, 0, 0]} name="Total Points" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-chart">No data available</div>
                    )}
                </Card>

                <Card title="Students by Semester" className="chart-card">
                    {stats?.studentsBySemester?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.studentsBySemester}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="_id" stroke="var(--text-tertiary)" />
                                <YAxis stroke="var(--text-tertiary)" />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                />
                                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Students" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-chart">No data available</div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Analytics;
