import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { activityAPI } from '../../api';
import { Card, Loading } from '../../components/ui';
import useClickSound from '../../hooks/useClickSound';
import useDataCache from '../../hooks/useDataCache';
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
    Sun,
    Hammer,
    PartyPopper
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
const BRUTAL_COLORS = ['#FF6B00', '#0A0A0A', '#FFD600', '#D32F2F', '#2E7D32', '#555555'];

const StudentDashboard = () => {
    const { user } = useAuth();
    const { theme, setTheme, isCyberpunk, isBrutalist } = useTheme();
    const { playClick, playHover } = useClickSound();
    const dashboardRef = useRef(null);
    const statsRef = useRef(null);
    const counterRefs = useRef([]);

    const fetchDashboardFn = useCallback(async () => {
        const [statsRes, activitiesRes] = await Promise.all([
            activityAPI.getStats(),
            activityAPI.getMy({ limit: 5 })
        ]);
        return { stats: statsRes.data, recentActivities: activitiesRes.data.activities };
    }, []);

    const { data: dashData, loading } = useDataCache('student-dashboard', fetchDashboardFn);
    const stats = dashData?.stats || null;
    const recentActivities = dashData?.recentActivities || [];

    // Anime.js entrance animations
    useEffect(() => {
        if (!loading && dashboardRef.current) {
            // Staggered card entrance
            anime({
                targets: '.sd-stat-card',
                translateY: isBrutalist ? [0, 0] : [40, 0],
                translateX: isBrutalist ? [-20, 0] : [0, 0],
                opacity: [0, 1],
                duration: isBrutalist ? 400 : 600,
                delay: anime.stagger(isBrutalist ? 80 : 120, { start: 200 }),
                easing: isBrutalist ? 'easeOutQuad' : 'easeOutCubic'
            });

            // Dashboard content fade in
            anime({
                targets: '.sd-content-section',
                translateY: isBrutalist ? [0, 0] : [30, 0],
                opacity: [0, 1],
                duration: isBrutalist ? 300 : 500,
                delay: anime.stagger(150, { start: 700 }),
                easing: isBrutalist ? 'easeOutQuad' : 'easeOutCubic'
            });

            // Tips card
            anime({
                targets: '.sd-tips',
                translateY: isBrutalist ? [0, 0] : [20, 0],
                opacity: [0, 1],
                duration: isBrutalist ? 300 : 500,
                delay: 1100,
                easing: isBrutalist ? 'easeOutQuad' : 'easeOutCubic'
            });
        }
    }, [loading, isBrutalist]);

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
    const goalAchieved = totalPoints >= requiredPoints;
    const chartColors = isCyberpunk ? CYBER_COLORS : isBrutalist ? BRUTAL_COLORS : COLORS;

    // Helper for label text
    const label = (normal, cyber, brutal) => {
        if (isBrutalist) return brutal;
        if (isCyberpunk) return cyber;
        return normal;
    };

    if (loading) {
        return <Loading fullScreen text={isBrutalist ? "LOADING_SYSTEMS..." : "Loading dashboard..."} />;
    }

    return (
        <div className={`student-dashboard ${isCyberpunk ? 'cyber-mode' : ''} ${isBrutalist ? 'brutalist-mode' : ''}`} ref={dashboardRef}>
            {/* Cyberpunk background effects */}
            {isCyberpunk && (
                <div className="sd-cyber-bg">
                    <div className="sd-grid-overlay" />
                    <div className="sd-scanline" />
                </div>
            )}

            {/* Brutalist blueprint background */}
            {isBrutalist && (
                <div className="sd-brutalist-bg">
                    <div className="sd-blueprint-grid" />
                    <div className="sd-crosshair sd-crosshair-tl" />
                    <div className="sd-crosshair sd-crosshair-tr" />
                    <div className="sd-crosshair sd-crosshair-bl" />
                    <div className="sd-crosshair sd-crosshair-br" />
                    <div className="sd-stamp">UNDER CONSTRUCTION</div>
                </div>
            )}

            <div className="sd-header">
                <div className="sd-header-info">
                    <h1 className={isCyberpunk ? 'glitch-text neon-text' : ''}>
                        {label(
                            `Welcome, ${user?.fullName?.split(' ')[0]}! 👋`,
                            `> ${user?.fullName?.split(' ')[0]}_`,
                            `SECTOR: ${user?.fullName?.split(' ')[0]?.toUpperCase()}`
                        )}
                    </h1>
                    <p>{label(
                        "Here's your activity points overview",
                        '// ACTIVITY_POINTS_OVERVIEW',
                        '// ACTIVITY_LOG_STATUS — LIVE FEED'
                    )}</p>
                </div>
                <div className="sd-header-actions">
                    {/* Theme Switcher */}
                    <div className="sd-theme-switcher">
                        <button
                            className={`sd-theme-btn ${!isCyberpunk && !isBrutalist ? 'active' : ''}`}
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
                        <button
                            className={`sd-theme-btn sd-theme-btn-brutal ${isBrutalist ? 'active' : ''}`}
                            onClick={() => handleThemeSwitch('brutalist')}
                            title="Brutalist Mode"
                        >
                            <Hammer size={16} />
                            <span>Raw</span>
                        </button>
                    </div>
                    <Link
                        to="/student/upload"
                        className={`btn ${isCyberpunk ? 'sd-cyber-btn' : isBrutalist ? 'sd-brutal-btn' : 'btn-primary'}`}
                        onClick={playClick}
                        onMouseEnter={playHover}
                    >
                        <Upload size={18} />
                        {label('Upload Activity', 'Upload Activity', 'SUBMIT_NEW')}
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="sd-stats-grid">
                <div className={`sd-stat-card sd-stat-main ${goalAchieved ? 'sd-goal-achieved' : ''}`} style={{ opacity: 0 }}>
                    <div className={`sd-stat-icon ${goalAchieved ? 'gradient-green' : isCyberpunk ? 'sd-icon-neon-cyan' : isBrutalist ? 'sd-icon-brutal-orange' : 'gradient-purple'}`}>
                        {goalAchieved ? <CheckCircle size={24} /> : <TrendingUp size={24} />}
                    </div>
                    <div className="sd-stat-info">
                        <span className="sd-stat-value" ref={el => counterRefs.current[0] = el}>
                            {totalPoints}
                        </span>
                        <span className="sd-stat-label">
                            {goalAchieved
                                ? label('Goal Achieved! 🎉', 'TARGET_COMPLETE', 'OBJECTIVE_CLEARED')
                                : label('Total Points', 'XP_TOTAL', 'TOTAL_XP')
                            }
                        </span>
                    </div>
                    <div className="sd-progress-section">
                        <div className={`sd-progress-track ${goalAchieved ? 'sd-progress-achieved' : ''}`}>
                            <div className="sd-progress-fill" style={{ width: 0 }} />
                        </div>
                        <span className={`sd-progress-label ${goalAchieved ? 'sd-achieved-label' : ''}`}>
                            {goalAchieved ? (
                                <><PartyPopper size={14} /> {totalPoints} / {requiredPoints} — {label('GOAL ACHIEVED!', 'TARGET_MET', 'CLEARED!')}</>
                            ) : (
                                <>{totalPoints} / {requiredPoints} {label('points required', 'XP_REQUIRED', 'UNITS_REQUIRED')}</>
                            )}
                        </span>
                    </div>
                </div>

                <div className="sd-stat-card" style={{ opacity: 0 }}
                    onMouseEnter={playHover} onClick={playClick}>
                    <div className={`sd-stat-icon ${isCyberpunk ? 'sd-icon-neon-yellow' : isBrutalist ? 'sd-icon-brutal-yellow' : 'gradient-yellow'}`}>
                        <Clock size={24} />
                    </div>
                    <div className="sd-stat-info">
                        <span className="sd-stat-value" ref={el => counterRefs.current[1] = el}>
                            {statusCounts.pending}
                        </span>
                        <span className="sd-stat-label">
                            {label('Pending', 'QUEUE', 'QUEUE')}
                        </span>
                    </div>
                </div>

                <div className="sd-stat-card" style={{ opacity: 0 }}
                    onMouseEnter={playHover} onClick={playClick}>
                    <div className={`sd-stat-icon ${isCyberpunk ? 'sd-icon-neon-green' : isBrutalist ? 'sd-icon-brutal-green' : 'gradient-green'}`}>
                        <CheckCircle size={24} />
                    </div>
                    <div className="sd-stat-info">
                        <span className="sd-stat-value" ref={el => counterRefs.current[2] = el}>
                            {statusCounts.approved}
                        </span>
                        <span className="sd-stat-label">
                            {label('Approved', 'VERIFIED', 'CLEARED')}
                        </span>
                    </div>
                </div>

                <div className="sd-stat-card" style={{ opacity: 0 }}
                    onMouseEnter={playHover} onClick={playClick}>
                    <div className={`sd-stat-icon ${isCyberpunk ? 'sd-icon-neon-red' : isBrutalist ? 'sd-icon-brutal-red' : 'gradient-red'}`}>
                        <XCircle size={24} />
                    </div>
                    <div className="sd-stat-info">
                        <span className="sd-stat-value" ref={el => counterRefs.current[3] = el}>
                            {statusCounts.rejected}
                        </span>
                        <span className="sd-stat-label">
                            {label('Rejected', 'DENIED', 'DENIED')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Charts and Recent Activities */}
            <div className="sd-content">
                {/* Points by Category */}
                <div className="sd-content-section" style={{ opacity: 0 }}>
                    <Card title={label('Points by Category', '// DATA_ANALYSIS', '// SECTOR_BREAKDOWN')}
                        className={`sd-chart-card ${isCyberpunk ? 'cyber-card' : ''} ${isBrutalist ? 'brutal-card' : ''}`}>
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
                                        stroke={isBrutalist ? '#0A0A0A' : undefined}
                                        strokeWidth={isBrutalist ? 2 : 1}
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
                                            background: isCyberpunk ? '#0d0d1f' : isBrutalist ? '#F5F0E8' : 'var(--bg-card)',
                                            border: isCyberpunk ? '1px solid #00f0ff' : isBrutalist ? '3px solid #0A0A0A' : '1px solid var(--border-color)',
                                            borderRadius: isBrutalist ? '0' : '8px',
                                            color: isCyberpunk ? '#e0f0ff' : isBrutalist ? '#0A0A0A' : 'var(--text-primary)',
                                            fontFamily: isBrutalist ? "'IBM Plex Mono', monospace" : undefined,
                                            boxShadow: isBrutalist ? '3px 3px 0 #0A0A0A' : undefined
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="sd-empty">
                                <FileText size={48} className="text-tertiary" />
                                <p>{label('No activities yet', 'NO_DATA_FOUND', 'NO_DATA_AVAILABLE')}</p>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Recent Activities */}
                <div className="sd-content-section" style={{ opacity: 0 }}>
                    <Card
                        title={label('Recent Activities', '// RECENT_LOG', '// RECENT_ENTRIES')}
                        action={
                            <Link to="/student/activities"
                                className="btn btn-ghost btn-sm"
                                onClick={playClick} onMouseEnter={playHover}>
                                {label('View All', 'View All', 'VIEW_ALL')} <ArrowRight size={16} />
                            </Link>
                        }
                        className={`sd-recent-card ${isCyberpunk ? 'cyber-card' : ''} ${isBrutalist ? 'brutal-card' : ''}`}
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
                                                {isCyberpunk || isBrutalist ? activity.status.toUpperCase() : activity.status}
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
                                <p>{label('No activities uploaded yet', 'NO_ENTRIES', 'NO_ENTRIES_LOGGED')}</p>
                                <Link to="/student/upload"
                                    className={`btn ${isCyberpunk ? 'sd-cyber-btn' : isBrutalist ? 'sd-brutal-btn' : 'btn-primary'} btn-sm`}
                                    onClick={playClick}>
                                    {label('Upload Your First Activity', 'Upload Your First Activity', 'SUBMIT_FIRST_ENTRY')}
                                </Link>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Quick Tips */}
            <div className="sd-tips" style={{ opacity: 0 }}>
                <Card className={`sd-tips-card ${isCyberpunk ? 'cyber-card' : ''} ${isBrutalist ? 'brutal-card' : ''}`} hover={false}>
                    <h3>{label('💡 Quick Tips', '> SYS_TIPS', '■ OPERATIONAL_NOTES')}</h3>
                    <ul>
                        <li>{label('', '> ', '→ ')}Upload clear, readable certificates for faster verification</li>
                        <li>{label('', '> ', '→ ')}You need {requiredPoints} points total to graduate — you have {totalPoints}</li>
                        <li>{label('', '> ', '→ ')}Points from different categories all count towards your total</li>
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default StudentDashboard;
