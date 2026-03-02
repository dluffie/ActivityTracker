import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { activityAPI } from '../../api';
import { Card, Loading } from '../../components/ui';
import useClickSound from '../../hooks/useClickSound';
import anime from 'animejs';
import {
    TrendingUp,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    Upload,
    ArrowRight,
    Zap,
    Sun
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import toast from 'react-hot-toast';
import './StudentDashboard.css';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6', '#8b5cf6'];
const CYBER_COLORS = ['#00f0ff', '#39ff14', '#ffee00', '#ff2d95', '#ff00ff', '#00ff88'];

const StudentDashboard = () => {
    const { user } = useAuth();
    const { theme, setTheme, isCyberpunk } = useTheme();
    const { playClick, playHover } = useClickSound();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [recentActivities, setRecentActivities] = useState([]);
    const dashboardRef = useRef(null);
    const statsRef = useRef(null);
    const counterRefs = useRef([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Anime.js entrance animations
    useEffect(() => {
        if (!loading && dashboardRef.current) {
            // Staggered card entrance
            anime({
                targets: '.sd-stat-card',
                translateY: [40, 0],
                opacity: [0, 1],
                duration: 600,
                delay: anime.stagger(120, { start: 200 }),
                easing: 'easeOutCubic'
            });

            // Dashboard content fade in
            anime({
                targets: '.sd-content-section',
                translateY: [30, 0],
                opacity: [0, 1],
                duration: 500,
                delay: anime.stagger(150, { start: 700 }),
                easing: 'easeOutCubic'
            });

            // Tips card
            anime({
                targets: '.sd-tips',
                translateY: [20, 0],
                opacity: [0, 1],
                duration: 500,
                delay: 1100,
                easing: 'easeOutCubic'
            });
        }
    }, [loading]);

    // Animated counters
    useEffect(() => {
        if (!loading && stats) {
            const statusCounts = getStatusCounts();
            const counterValues = [
                { el: counterRefs.current[0], val: user?.totalPoints || getTotalApprovedPoints() },
                { el: counterRefs.current[1], val: statusCounts.pending },
                { el: counterRefs.current[2], val: statusCounts.approved },
                { el: counterRefs.current[3], val: statusCounts.rejected }
            ];

            counterValues.forEach(({ el, val }) => {
                if (el && val > 0) {
                    const obj = { count: 0 };
                    anime({
                        targets: obj,
                        count: val,
                        round: 1,
                        duration: 1200,
                        delay: 400,
                        easing: 'easeOutExpo',
                        update: () => {
                            if (el) el.textContent = obj.count;
                        }
                    });
                }
            });

            // Progress bar animation
            anime({
                targets: '.sd-progress-fill',
                width: [`0%`, `${progressPercent}%`],
                duration: 1500,
                delay: 500,
                easing: 'easeOutExpo'
            });
        }
    }, [loading, stats]);

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

    const handleThemeSwitch = (newTheme) => {
        playClick();
        setTheme(newTheme);
    };

    const statusCounts = getStatusCounts();
    const totalPoints = user?.totalPoints || getTotalApprovedPoints();
    const requiredPoints = user?.isLateral ? 40 : 60;
    const progressPercent = Math.min((totalPoints / requiredPoints) * 100, 100);
    const chartColors = isCyberpunk ? CYBER_COLORS : COLORS;

    if (loading) {
        return <Loading fullScreen text="Loading dashboard..." />;
    }

    return (
        <div className={`student-dashboard ${isCyberpunk ? 'cyber-mode' : ''}`} ref={dashboardRef}>
            {/* Cyberpunk background effects */}
            {isCyberpunk && (
                <div className="sd-cyber-bg">
                    <div className="sd-grid-overlay" />
                    <div className="sd-scanline" />
                </div>
            )}

            <div className="sd-header">
                <div className="sd-header-info">
                    <h1 className={isCyberpunk ? 'glitch-text neon-text' : ''}>
                        {isCyberpunk ? `> ${user?.fullName?.split(' ')[0]}_` : `Welcome, ${user?.fullName?.split(' ')[0]}! 👋`}
                    </h1>
                    <p>{isCyberpunk ? '// ACTIVITY_POINTS_OVERVIEW' : "Here's your activity points overview"}</p>
                </div>
                <div className="sd-header-actions">
                    {/* Theme Switcher */}
                    <div className="sd-theme-switcher">
                        <button
                            className={`sd-theme-btn ${!isCyberpunk ? 'active' : ''}`}
                            onClick={() => handleThemeSwitch(theme === 'light' ? 'light' : 'dark')}
                            title="Normal Mode"
                        >
                            <Sun size={16} />
                            <span>Normal</span>
                        </button>
                        <button
                            className={`sd-theme-btn sd-theme-btn-cyber ${isCyberpunk ? 'active' : ''}`}
                            onClick={() => handleThemeSwitch('cyberpunk')}
                            title="Cyberpunk Mode"
                        >
                            <Zap size={16} />
                            <span>Cyber</span>
                        </button>
                    </div>
                    <Link
                        to="/student/upload"
                        className={`btn ${isCyberpunk ? 'sd-cyber-btn' : 'btn-primary'}`}
                        onClick={playClick}
                        onMouseEnter={playHover}
                    >
                        <Upload size={18} />
                        Upload Activity
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="sd-stats-grid">
                <div className="sd-stat-card sd-stat-main" style={{ opacity: 0 }}>
                    <div className={`sd-stat-icon ${isCyberpunk ? 'sd-icon-neon-cyan' : 'gradient-purple'}`}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="sd-stat-info">
                        <span className="sd-stat-value" ref={el => counterRefs.current[0] = el}>
                            {totalPoints}
                        </span>
                        <span className="sd-stat-label">
                            {isCyberpunk ? 'XP_TOTAL' : 'Total Points'}
                        </span>
                    </div>
                    <div className="sd-progress-section">
                        <div className="sd-progress-track">
                            <div className="sd-progress-fill" style={{ width: 0 }} />
                        </div>
                        <span className="sd-progress-label">
                            {totalPoints} / {requiredPoints} {isCyberpunk ? 'XP_REQUIRED' : 'points required'}
                        </span>
                    </div>
                </div>

                <div className="sd-stat-card" style={{ opacity: 0 }}
                    onMouseEnter={playHover} onClick={playClick}>
                    <div className={`sd-stat-icon ${isCyberpunk ? 'sd-icon-neon-yellow' : 'gradient-yellow'}`}>
                        <Clock size={24} />
                    </div>
                    <div className="sd-stat-info">
                        <span className="sd-stat-value" ref={el => counterRefs.current[1] = el}>
                            {statusCounts.pending}
                        </span>
                        <span className="sd-stat-label">
                            {isCyberpunk ? 'QUEUE' : 'Pending'}
                        </span>
                    </div>
                </div>

                <div className="sd-stat-card" style={{ opacity: 0 }}
                    onMouseEnter={playHover} onClick={playClick}>
                    <div className={`sd-stat-icon ${isCyberpunk ? 'sd-icon-neon-green' : 'gradient-green'}`}>
                        <CheckCircle size={24} />
                    </div>
                    <div className="sd-stat-info">
                        <span className="sd-stat-value" ref={el => counterRefs.current[2] = el}>
                            {statusCounts.approved}
                        </span>
                        <span className="sd-stat-label">
                            {isCyberpunk ? 'VERIFIED' : 'Approved'}
                        </span>
                    </div>
                </div>

                <div className="sd-stat-card" style={{ opacity: 0 }}
                    onMouseEnter={playHover} onClick={playClick}>
                    <div className={`sd-stat-icon ${isCyberpunk ? 'sd-icon-neon-red' : 'gradient-red'}`}>
                        <XCircle size={24} />
                    </div>
                    <div className="sd-stat-info">
                        <span className="sd-stat-value" ref={el => counterRefs.current[3] = el}>
                            {statusCounts.rejected}
                        </span>
                        <span className="sd-stat-label">
                            {isCyberpunk ? 'DENIED' : 'Rejected'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Charts and Recent Activities */}
            <div className="sd-content">
                {/* Points by Category */}
                <div className="sd-content-section" style={{ opacity: 0 }}>
                    <Card title={isCyberpunk ? '// DATA_ANALYSIS' : 'Points by Category'}
                        className={`sd-chart-card ${isCyberpunk ? 'cyber-card' : ''}`}>
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
                                                fill={chartColors[index % chartColors.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: isCyberpunk ? '#0d0d1f' : 'var(--bg-card)',
                                            border: isCyberpunk ? '1px solid #00f0ff' : '1px solid var(--border-color)',
                                            borderRadius: '8px',
                                            color: isCyberpunk ? '#e0f0ff' : 'var(--text-primary)'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="sd-empty">
                                <FileText size={48} className="text-tertiary" />
                                <p>{isCyberpunk ? 'NO_DATA_FOUND' : 'No activities yet'}</p>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Recent Activities */}
                <div className="sd-content-section" style={{ opacity: 0 }}>
                    <Card
                        title={isCyberpunk ? '// RECENT_LOG' : 'Recent Activities'}
                        action={
                            <Link to="/student/activities"
                                className="btn btn-ghost btn-sm"
                                onClick={playClick} onMouseEnter={playHover}>
                                View All <ArrowRight size={16} />
                            </Link>
                        }
                        className={`sd-recent-card ${isCyberpunk ? 'cyber-card' : ''}`}
                    >
                        {recentActivities.length > 0 ? (
                            <div className="sd-recent-list">
                                {recentActivities.map((activity, i) => (
                                    <div key={activity._id}
                                        className="sd-recent-item"
                                        onMouseEnter={playHover}
                                        style={{ animationDelay: `${i * 0.1}s` }}
                                    >
                                        <div className="sd-recent-info">
                                            <h4>{activity.eventName}</h4>
                                            <p>{activity.activityType} • {activity.level}
                                                {activity.submittedByRole === 'teacher' && activity.submittedBy && (
                                                    <span className="sd-teacher-tag"> • Submitted by TR {activity.submittedBy?.fullName || ''}</span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="sd-recent-meta">
                                            <span className={`badge badge-${activity.status === 'approved' ? 'success' :
                                                activity.status === 'rejected' ? 'error' :
                                                    activity.status === 'correction_needed' ? 'warning' :
                                                        'info'
                                                }`}>
                                                {isCyberpunk ? activity.status.toUpperCase() : activity.status}
                                            </span>
                                            {activity.status === 'approved' && (
                                                <span className="sd-points">+{activity.pointsAssigned} pts</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="sd-empty">
                                <FileText size={48} className="text-tertiary" />
                                <p>{isCyberpunk ? 'NO_ENTRIES' : 'No activities uploaded yet'}</p>
                                <Link to="/student/upload"
                                    className={`btn ${isCyberpunk ? 'sd-cyber-btn' : 'btn-primary'} btn-sm`}
                                    onClick={playClick}>
                                    Upload Your First Activity
                                </Link>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Quick Tips */}
            <div className="sd-tips" style={{ opacity: 0 }}>
                <Card className={`sd-tips-card ${isCyberpunk ? 'cyber-card' : ''}`} hover={false}>
                    <h3>{isCyberpunk ? '> SYS_TIPS' : '💡 Quick Tips'}</h3>
                    <ul>
                        <li>{isCyberpunk ? '> ' : ''}Upload clear, readable certificates for faster verification</li>
                        <li>{isCyberpunk ? '> ' : ''}You need {requiredPoints} points total to graduate — you have {totalPoints}</li>
                        <li>{isCyberpunk ? '> ' : ''}Points from different categories all count towards your total</li>
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default StudentDashboard;
