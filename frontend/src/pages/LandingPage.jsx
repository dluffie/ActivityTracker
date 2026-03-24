import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ClipboardCheck,
    ShieldCheck,
    BarChart3,
    Smartphone,
    LogIn,
    UserPlus,
    Download,
    ChevronRight,
    GraduationCap,
    Users,
    Award,
    BookOpen
} from 'lucide-react';
import './LandingPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LandingPage = () => {
    const featureCardsRef = useRef([]);
    const stepsRef = useRef([]);
    const blogCardsRef = useRef([]);
    const [featuredActivities, setFeaturedActivities] = useState([]);

    useEffect(() => {
        // IntersectionObserver for scroll-triggered animations
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
        );

        featureCardsRef.current.forEach((card) => {
            if (card) observer.observe(card);
        });

        stepsRef.current.forEach((step) => {
            if (step) observer.observe(step);
        });

        blogCardsRef.current.forEach((card) => {
            if (card) observer.observe(card);
        });

        return () => observer.disconnect();
    }, [featuredActivities]);

    // Fetch featured activities for blog section
    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                const response = await fetch(`${API_URL}/activity/featured`);
                const data = await response.json();
                setFeaturedActivities(data.activities || []);
            } catch (error) {
                console.error('Failed to fetch featured activities:', error);
            }
        };
        fetchFeatured();
    }, []);

    return (
        <div className="landing-page">
            {/* ========== NAVBAR ========== */}
            <nav className="landing-navbar">
                <div className="landing-navbar-brand">
                    <div className="landing-navbar-logo">
                        <GraduationCap size={24} />
                    </div>
                    <div className="landing-navbar-title">
                        <h1>GPC Kothamangalam</h1>
                        <span>Activity Tracking & Management System</span>
                    </div>
                </div>
                <div className="landing-navbar-actions">
                    {featuredActivities.length > 0 && (
                        <a href="#achievements" className="landing-btn landing-btn-blog">
                            <Award size={16} /> Achievements
                        </a>
                    )}
                    <Link to="/login" className="landing-btn landing-btn-login">
                        <LogIn size={16} /> Login
                    </Link>
                    <Link to="/signup" className="landing-btn landing-btn-signup">
                        <UserPlus size={16} /> Sign Up
                    </Link>
                </div>
            </nav>

            {/* ========== HERO SECTION ========== */}
            <section className="landing-hero">
                <div className="landing-hero-pattern" />

                <div className="landing-hero-content">
                    <div className="landing-hero-badge">
                        <span className="landing-hero-badge-dot" />
                        Lorem
                    </div>

                    <h2>
                        <span className="hero-highlight">Activity Tracking</span> &<br />
                        Management System
                    </h2>

                    <div className="landing-hero-college">
                        <p>Government Polytechnic College Kothamangalam</p>
                        <p>Chelad P.O. Kothamangalam, Ernakulam — 686691 Kerala</p>
                    </div>

                    <p className="landing-hero-subtitle">
                        A comprehensive platform for students to log co-curricular &
                        extra-curricular activities, earn points, and get verified by teachers —
                        all in one place.
                    </p>

                    <div className="landing-hero-cta">
                        <Link to="/login" className="landing-btn landing-btn-hero-login">
                            <LogIn size={18} /> Login to Portal
                        </Link>
                        <Link to="/signup" className="landing-btn landing-btn-hero-signup">
                            <UserPlus size={18} /> Create Account
                        </Link>
                        <a
                            href="https://github.com/dluffie/ActivityTracker/releases/download/CAPMS/Activity.Tracker.apk"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="landing-btn landing-btn-download"
                        >
                            <Download size={18} /> Download App
                        </a>
                    </div>
                </div>

                <div className="landing-scroll-indicator">
                    <div className="landing-scroll-mouse" />
                    Scroll to explore
                </div>
            </section>

            {/* ========== STATS BAR ========== */}
            <section className="landing-stats">
                <div className="landing-stats-inner">
                    <div className="landing-stat">
                        <div className="landing-stat-value">500+</div>
                        <div className="landing-stat-label">Active Students</div>
                    </div>
                    <div className="landing-stat">
                        <div className="landing-stat-value">20+</div>
                        <div className="landing-stat-label">Faculty Members</div>
                    </div>
                    <div className="landing-stat">
                        <div className="landing-stat-value">1000+</div>
                        <div className="landing-stat-label">Activities Logged</div>
                    </div>
                    <div className="landing-stat">
                        <div className="landing-stat-value">6</div>
                        <div className="landing-stat-label">Departments</div>
                    </div>
                </div>
            </section>

            {/* ========== FEATURES ========== */}
            <section className="landing-features">
                <div className="landing-section-header">
                    <span className="landing-section-tag">Features</span>
                    <h3>Everything You Need</h3>
                    <p>
                        Track, verify, and analyze student activities with our powerful
                        platform designed for polytechnic education.
                    </p>
                </div>

                <div className="landing-features-grid">
                    <div
                        className="landing-feature-card"
                        ref={(el) => (featureCardsRef.current[0] = el)}
                    >
                        <div className="landing-feature-icon blue">
                            <ClipboardCheck size={28} />
                        </div>
                        <h4>Activity Logging</h4>
                        <p>
                            Students can easily submit their co-curricular and extra-curricular
                            activities with supporting documents for review.
                        </p>
                    </div>

                    <div
                        className="landing-feature-card"
                        ref={(el) => (featureCardsRef.current[1] = el)}
                    >
                        <div className="landing-feature-icon green">
                            <ShieldCheck size={28} />
                        </div>
                        <h4>Teacher Verification</h4>
                        <p>
                            Faculty can review, approve, or request changes to submitted
                            activities with a streamlined verification workflow.
                        </p>
                    </div>

                    <div
                        className="landing-feature-card"
                        ref={(el) => (featureCardsRef.current[2] = el)}
                    >
                        <div className="landing-feature-icon amber">
                            <BarChart3 size={28} />
                        </div>
                        <h4>Points & Analytics</h4>
                        <p>
                            Track activity points in real time with detailed dashboards and
                            progress reports for students and teachers alike.
                        </p>
                    </div>

                    <div
                        className="landing-feature-card"
                        ref={(el) => (featureCardsRef.current[3] = el)}
                    >
                        <div className="landing-feature-icon purple">
                            <Smartphone size={28} />
                        </div>
                        <h4>Mobile Access</h4>
                        <p>
                            Access your dashboard on the go with our mobile app — upload
                            activities, check points, and stay updated anywhere.
                        </p>
                    </div>
                </div>
            </section>

            {/* ========== HOW IT WORKS ========== */}
            <section className="landing-how">
                <div className="landing-section-header">
                    <span className="landing-section-tag">How it Works</span>
                    <h3>Simple 3-Step Process</h3>
                    <p>
                        Getting started is easy. Follow these steps to begin tracking your
                        activities.
                    </p>
                </div>

                <div className="landing-steps">
                    <div
                        className="landing-step"
                        ref={(el) => (stepsRef.current[0] = el)}
                    >
                        <div className="landing-step-number">1</div>
                        <h4>Create an Account</h4>
                        <p>
                            Sign up with your college details and get your profile verified by
                            your class teacher.
                        </p>
                    </div>

                    <div
                        className="landing-step"
                        ref={(el) => (stepsRef.current[1] = el)}
                    >
                        <div className="landing-step-number">2</div>
                        <h4>Log Your Activities</h4>
                        <p>
                            Submit your co-curricular and extra-curricular activities with
                            certificates or proof documents.
                        </p>
                    </div>

                    <div
                        className="landing-step"
                        ref={(el) => (stepsRef.current[2] = el)}
                    >
                        <div className="landing-step-number">3</div>
                        <h4>Earn & Track Points</h4>
                        <p>
                            After teacher verification, earn activity points and track your
                            progress on the dashboard.
                        </p>
                    </div>
                </div>
            </section>

            {/* ========== STUDENT ACHIEVEMENTS / BLOG ========== */}
            {featuredActivities.length > 0 && (
                <section className="landing-blog" id="achievements">
                    <div className="landing-section-header">
                        <span className="landing-section-tag">🏆 Achievements</span>
                        <h3>Student Spotlight</h3>
                        <p>
                            Celebrating the outstanding achievements of our students.
                            These accomplishments have been verified and recognized by our faculty.
                        </p>
                    </div>

                    <div className="landing-blog-grid">
                        {featuredActivities.map((activity, index) => (
                            <div
                                key={activity._id}
                                className="landing-blog-card"
                                ref={(el) => (blogCardsRef.current[index] = el)}
                            >
                                <div className="blog-card-header">
                                    <div className="blog-student-avatar">
                                        {activity.student?.profileImage ? (
                                            <img
                                                src={activity.student.profileImage}
                                                alt={activity.student.fullName}
                                            />
                                        ) : (
                                            <div className="blog-avatar-placeholder">
                                                {activity.student?.fullName?.charAt(0) || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="blog-student-info">
                                        <span className="blog-student-name">
                                            {activity.student?.fullName}
                                        </span>
                                        <span className="blog-student-dept">
                                            {activity.student?.branch} — Sem {activity.student?.semester}
                                        </span>
                                    </div>
                                </div>
                                <div className="blog-card-body">
                                    <div className="blog-achievement-badge">
                                        <Award size={14} />
                                        {activity.level?.charAt(0).toUpperCase() + activity.level?.slice(1)} Level
                                    </div>
                                    <h4 className="blog-event-name">{activity.eventName}</h4>
                                    <p className="blog-activity-type">
                                        {activity.activityType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        {activity.position && activity.position !== '' && ` • ${activity.position.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
                                    </p>
                                </div>
                                <div className="blog-card-footer">
                                    <span className="blog-congrats">
                                        🎉 Congratulations on this achievement!
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ========== CTA SECTION ========== */}
            <section className="landing-cta">
                <div className="landing-cta-content">
                    <h3>Ready to Get Started?</h3>
                    <p>
                        Join hundreds of students already tracking their achievements. Create
                        your account today and start earning activity points.
                    </p>
                    <div className="landing-cta-buttons">
                        <Link to="/signup" className="landing-btn landing-btn-hero-login">
                            <UserPlus size={18} /> Create Your Account
                        </Link>
                        <a
                            href="https://github.com/dxzoro/ActivityTracker/releases/latest"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="landing-btn landing-btn-download"
                        >
                            <Download size={18} /> Get the App
                        </a>
                    </div>
                </div>
            </section>

            {/* ========== FOOTER ========== */}
            <footer className="landing-footer">
                <div className="landing-footer-inner">
                    <div className="landing-footer-brand">
                        <h4>GPC Kothamangalam — CAPMS</h4>
                        <p>
                            Co-curricular & Activity Point Management System<br />
                            Government Polytechnic College Kothamangalam<br />
                            Chelad P.O. Kothamangalam, Ernakulam — 686691 Kerala
                        </p>
                    </div>
                    <div className="landing-footer-links">
                        <h5>Quick Links</h5>
                        <ul>
                            <li><Link to="/login">Login</Link></li>
                            <li><Link to="/signup">Sign Up</Link></li>
                            <li>
                                <a
                                    href="https://gptcktm.ac.in"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    College Website
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className="landing-footer-links">
                        <h5>Resources</h5>
                        <ul>
                            <li><a href="#features">Features</a></li>
                            <li><a href="#how-it-works">How It Works</a></li>
                            <li>
                                <a
                                    href="https://sbte.kerala.gov.in"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    SBTE Kerala
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="landing-footer-bottom">
                    <span>© 2026 GPC Kothamangalam. All rights reserved.</span>
                    <span>Activity Point Management System v1.0</span>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
