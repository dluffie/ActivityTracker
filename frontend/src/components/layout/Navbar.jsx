import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
    Menu,
    X,
    Sun,
    Moon,
    Bell,
    LogOut,
    User,
    ChevronDown,
    CheckCircle,
    Clock
} from 'lucide-react';
import { useState } from 'react';
import './Navbar.css';

const Navbar = ({ onMenuToggle, isSidebarOpen }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);

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
                        <span className="logo-icon">📊</span>
                        <span className="logo-text">CAPMS</span>
                    </div>
                </Link>
            </div>

            <div className="navbar-right">
                <button
                    className="navbar-icon-btn"
                    onClick={toggleTheme}
                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                <button className="navbar-icon-btn" title="Notifications">
                    <Bell size={20} />
                    <span className="notification-badge">3</span>
                </button>

                <div className="navbar-profile">
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
