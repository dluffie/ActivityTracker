import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    Upload,
    FileText,
    User,
    Users,
    CheckSquare,
    Settings,
    BarChart3,
    Mail,
    BookOpen,
    ClipboardList,
    History
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const location = useLocation();

    const studentLinks = [
        { to: '/student', icon: LayoutDashboard, label: 'Dashboard', exact: true },
        { to: '/student/upload', icon: Upload, label: 'Upload Activity' },
        { to: '/student/activities', icon: FileText, label: 'My Activities' },
        { to: '/profile', icon: User, label: 'Profile' },
    ];

    const teacherLinks = [
        { to: '/teacher', icon: LayoutDashboard, label: 'Dashboard', exact: true },
        { to: '/teacher/verification', icon: CheckSquare, label: 'Verification Queue' },
        { to: '/teacher/students', icon: Users, label: 'My Students' },
        { to: '/teacher/submit', icon: Upload, label: 'Submit for Student' },
        { to: '/teacher/reminders', icon: Mail, label: 'Send Reminders' },
        { to: '/teacher/classes', icon: BookOpen, label: 'My Classes' },
        { to: '/profile', icon: User, label: 'Profile' },
    ];

    const adminLinks = [
        { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
        { to: '/admin/users', icon: Users, label: 'User Management' },
        { to: '/admin/rules', icon: ClipboardList, label: 'Point Rules' },
        { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
        { to: '/admin/audit', icon: History, label: 'Audit Logs' },
        { to: '/admin/settings', icon: Settings, label: 'Settings' },
    ];

    const getLinks = () => {
        switch (user?.role) {
            case 'admin': return adminLinks;
            case 'teacher': return teacherLinks;
            default: return studentLinks;
        }
    };

    const links = getLinks();

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div className="sidebar-overlay hide-desktop" onClick={onClose} />
            )}

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <nav className="sidebar-nav">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.exact}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'active' : ''}`
                            }
                            onClick={onClose}
                        >
                            <link.icon size={20} />
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-stats">
                        {user?.role === 'student' && (
                            <>
                                <div className="stat-item">
                                    <span className="stat-value">{user?.totalPoints || 0}</span>
                                    <span className="stat-label">Total Points</span>
                                </div>
                                <div className="stat-progress">
                                    <div className="progress">
                                        <div
                                            className="progress-bar"
                                            style={{ width: `${Math.min((user?.totalPoints || 0) / 60 * 100, 100)}%` }}
                                        />
                                    </div>
                                    <span className="stat-label">
                                        {user?.totalPoints || 0}/60 points required
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
