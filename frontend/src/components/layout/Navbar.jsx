import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { notificationAPI } from '../../api';
import logo from '../../assets/logo.webp';
import {
    Menu,
    X,
    Sun,
    Moon,
    Zap,
    Bell,
    LogOut,
    User,
    ChevronDown,
    CheckCircle,
    Clock,
    XCircle,
    AlertTriangle,
    FileText,
    UserCheck,
    Volume2,
    VolumeX
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import './Navbar.css';

const NOTIF_ICONS = {
    approval: { icon: CheckCircle, color: '#22c55e' },
    rejection: { icon: XCircle, color: '#ef4444' },
    correction: { icon: AlertTriangle, color: '#f59e0b' },
    teacher_submission: { icon: UserCheck, color: '#6366f1' },
    activity_submitted: { icon: FileText, color: '#3b82f6' },
    profile_verified: { icon: CheckCircle, color: '#22c55e' },
    profile_rejected: { icon: XCircle, color: '#ef4444' },
    reminder: { icon: Bell, color: '#f59e0b' },
    system: { icon: Bell, color: '#6366f1' },
};

const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
};

const Navbar = ({ onMenuToggle, isSidebarOpen }) => {
    const { user, logout } = useAuth();
    const { theme, setTheme, toggleTheme, isCyberpunk, isBrutalist, soundEnabled, toggleSound } = useTheme();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const notifRef = useRef(null);
    const profileRef = useRef(null);

    // Fetch notifications on mount & periodically
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // every 30s
        return () => clearInterval(interval);
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await notificationAPI.getAll({ limit: 10 });
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch (err) {
            // silently fail
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await notificationAPI.markRead(id);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            // silently fail
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationAPI.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            // silently fail
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getDashboardLink = () => {
        switch (user?.role) {
            case 'admin': return '/admin';
            case 'teacher': return '/teacher';
            default: return '/student';
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <button
                    className="navbar-menu-btn hide-desktop"
                    onClick={onMenuToggle}
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <Link to={getDashboardLink()} className="navbar-brand">
                    <div className="navbar-logo">
                        <img src={logo} alt="CAPMS" className="logo-icon" style={{ width: 55, height: 55, paddingLeft: 5 }} />
                        <span className="logo-text">CAPMS</span>
                    </div>
                </Link>
            </div>

            <div className="navbar-right">
                <button
                    className={`navbar-icon-btn ${isCyberpunk ? 'navbar-icon-btn-disabled' : ''}`}
                    onClick={() => {
                        if (!isCyberpunk) {
                            // Only toggle between light and dark — never into cyberpunk
                            const next = theme === 'light' ? 'dark' : 'light';
                            setTheme(next);
                        }
                    }}
                    title={isCyberpunk ? 'Exit Cyberpunk from Dashboard first' : `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    disabled={isCyberpunk}
                    style={isCyberpunk ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                >
                    {isCyberpunk ? <Zap size={20} /> : theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                {/* Sound toggle — visible in cyberpunk theme */}
                {isCyberpunk && (
                    <button
                        className="navbar-icon-btn sound-toggle-btn"
                        onClick={toggleSound}
                        title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
                    >
                        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                )}

                {/* Notification Bell */}
                <div className="notif-container" ref={notifRef}>
                    <button
                        className="navbar-icon-btn"
                        title="Notifications"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="notification-badge">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="notif-dropdown">
                            <div className="notif-header">
                                <h4>Notifications</h4>
                                {unreadCount > 0 && (
                                    <button
                                        className="notif-mark-all"
                                        onClick={handleMarkAllRead}
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            <div className="notif-list">
                                {notifications.length > 0 ? (
                                    notifications.map(n => {
                                        const iconData = NOTIF_ICONS[n.type] || NOTIF_ICONS.system;
                                        const IconComp = iconData.icon;
                                        return (
                                            <div
                                                key={n._id}
                                                className={`notif-item ${!n.read ? 'notif-unread' : ''}`}
                                                onClick={() => {
                                                    if (!n.read) handleMarkRead(n._id);
                                                    if (n.link) {
                                                        navigate(n.link);
                                                        setShowNotifications(false);
                                                    }
                                                }}
                                            >
                                                <div
                                                    className="notif-icon"
                                                    style={{ color: iconData.color }}
                                                >
                                                    <IconComp size={18} />
                                                </div>
                                                <div className="notif-content">
                                                    <span className="notif-title">{n.title}</span>
                                                    <span className="notif-message">
                                                        {n.message?.length > 80
                                                            ? n.message.substring(0, 80) + '...'
                                                            : n.message}
                                                    </span>
                                                    <span className="notif-time">
                                                        {timeAgo(n.createdAt)}
                                                    </span>
                                                </div>
                                                {!n.read && <div className="notif-dot" />}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="notif-empty">
                                        <Bell size={32} />
                                        <p>No notifications yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="navbar-profile" ref={profileRef}>
                    <button
                        className="profile-btn"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <div className="profile-avatar">
                            {user?.profileImage ? (
                                <img src={user.profileImage} alt={user.fullName} />
                            ) : (
                                <User size={20} />
                            )}
                            {user?.role === 'student' && user?.profileVerified && (
                                <span className="verified-indicator" title="Profile Verified">
                                    <CheckCircle size={12} />
                                </span>
                            )}
                        </div>
                        <span className="profile-name hide-mobile">{user?.fullName}</span>
                        <ChevronDown size={16} className="hide-mobile" />
                    </button>

                    {showDropdown && (
                        <div className="profile-dropdown">
                            <div className="dropdown-header">
                                <p className="dropdown-name">{user?.fullName}</p>
                                <p className="dropdown-email">{user?.email}</p>
                                <div className="dropdown-badges">
                                    <span className="dropdown-role badge badge-primary">
                                        {user?.role}
                                    </span>
                                    {user?.role === 'student' && (
                                        <span className={`dropdown-verification ${user?.profileVerified ? 'verified' : 'pending'}`}>
                                            {user?.profileVerified ? (
                                                <><CheckCircle size={12} /> Verified</>
                                            ) : (
                                                <><Clock size={12} /> Pending</>
                                            )}
                                        </span>
                                    )}
                                    {user?.role === 'student' && user?.isLateral && (
                                        <span className="dropdown-lateral badge badge-warning">
                                            Lateral Entry
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="dropdown-divider" />
                            <Link
                                to="/profile"
                                className="dropdown-item"
                                onClick={() => setShowDropdown(false)}
                            >
                                <User size={16} />
                                Profile
                            </Link>
                            <button
                                className="dropdown-item text-error"
                                onClick={handleLogout}
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
