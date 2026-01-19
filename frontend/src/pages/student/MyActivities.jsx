import { useState, useEffect } from 'react';
import { activityAPI } from '../../api';
import { Card, Loading, Pagination, Button, Modal } from '../../components/ui';
import {
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Calendar,
    Eye,
    Download,
    Upload,
    Award,
    Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import './MyActivities.css';

const MyActivities = () => {
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
    const [filter, setFilter] = useState('all');
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchActivities();
    }, [pagination.page, filter]);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit
            };
            if (filter !== 'all') {
                params.status = filter;
            }
            const response = await activityAPI.getMy(params);
            setActivities(response.data.activities || []);
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination?.total || 0,
                pages: response.data.pagination?.pages || 1,
            }));
        } catch (error) {
            toast.error('Failed to load activities');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved':
                return <CheckCircle size={18} className="text-success" />;
            case 'rejected':
                return <XCircle size={18} className="text-error" />;
            case 'correction_needed':
                return <AlertTriangle size={18} className="text-warning" />;
            default:
                return <Clock size={18} className="text-info" />;
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            pending: 'info',
            approved: 'success',
            rejected: 'error',
            correction_needed: 'warning'
        };
        return statusMap[status] || 'info';
    };

    const openActivityDetails = (activity) => {
        setSelectedActivity(activity);
        setShowModal(true);
    };

    if (loading && activities.length === 0) {
        return <Loading fullScreen text="Loading activities..." />;
    }

    return (
        <div className="my-activities-page">
            <div className="page-header">
                <div>
                    <h1><FileText size={28} /> My Activities</h1>
                    <p>View all your uploaded activities and their status</p>
                </div>
                <Link to="/student/upload" className="btn btn-primary">
                    <Upload size={18} /> Upload New
                </Link>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                {['all', 'pending', 'approved', 'rejected', 'correction_needed'].map(f => (
                    <button
                        key={f}
                        className={`filter-tab ${filter === f ? 'active' : ''}`}
                        onClick={() => {
                            setFilter(f);
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                    >
                        {f === 'all' ? 'All' :
                            f === 'correction_needed' ? 'Needs Correction' :
                                f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Activities List */}
            <Card>
                {activities.length > 0 ? (
                    <>
                        <div className="activities-list">
                            {activities.map((activity) => (
                                <div key={activity._id} className="activity-item" onClick={() => openActivityDetails(activity)}>
                                    <div className="activity-icon">
                                        {getStatusIcon(activity.status)}
                                    </div>
                                    <div className="activity-main">
                                        <h4>{activity.eventName}</h4>
                                        <p className="activity-meta">
                                            <span>{activity.activityType}</span>
                                            <span>•</span>
                                            <span>{activity.level}</span>
                                            <span>•</span>
                                            <span><Calendar size={14} /> {formatDate(activity.eventDate)}</span>
                                        </p>
                                        {activity.correctionNote && (
                                            <p className="correction-note">
                                                <AlertTriangle size={14} /> {activity.correctionNote}
                                            </p>
                                        )}
                                    </div>
                                    <div className="activity-right">
                                        <span className={`badge badge-${getStatusBadge(activity.status)}`}>
                                            {activity.status === 'correction_needed' ? 'Correction' : activity.status}
                                        </span>
                                        {activity.status === 'approved' && (
                                            <span className="points-earned">
                                                <Award size={14} /> +{activity.pointsAssigned} pts
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {pagination.pages > 1 && (
                            <Pagination
                                currentPage={pagination.page}
                                totalPages={pagination.pages}
                                totalItems={pagination.total}
                                itemsPerPage={pagination.limit}
                                onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                            />
                        )}
                    </>
                ) : (
                    <div className="empty-activities">
                        <FileText size={64} className="empty-icon" />
                        <h3>No Activities Found</h3>
                        <p>
                            {filter === 'all'
                                ? "You haven't uploaded any activities yet. Start by uploading your first certificate!"
                                : `No ${filter === 'correction_needed' ? 'activities needing correction' : filter + ' activities'} found.`
                            }
                        </p>
                        {filter === 'all' && (
                            <Link to="/student/upload" className="btn btn-primary">
                                <Upload size={18} /> Upload Your First Activity
                            </Link>
                        )}
                    </div>
                )}
            </Card>

            {/* Activity Details Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Activity Details"
                size="large"
            >
                {selectedActivity && (
                    <div className="activity-details-modal">
                        <div className="detail-header">
                            <h3>{selectedActivity.eventName}</h3>
                            <span className={`badge badge-${getStatusBadge(selectedActivity.status)}`}>
                                {selectedActivity.status}
                            </span>
                        </div>

                        <div className="detail-grid">
                            <div className="detail-item">
                                <label>Activity Type</label>
                                <span>{selectedActivity.activityType}</span>
                            </div>
                            <div className="detail-item">
                                <label>Level</label>
                                <span>{selectedActivity.level}</span>
                            </div>
                            <div className="detail-item">
                                <label>Event Date</label>
                                <span>{formatDate(selectedActivity.eventDate)}</span>
                            </div>
                            <div className="detail-item">
                                <label>Submitted On</label>
                                <span>{formatDate(selectedActivity.createdAt)}</span>
                            </div>
                            {selectedActivity.status === 'approved' && (
                                <div className="detail-item highlight">
                                    <label>Points Earned</label>
                                    <span className="points-value">+{selectedActivity.pointsAssigned}</span>
                                </div>
                            )}
                        </div>

                        {selectedActivity.description && (
                            <div className="detail-section">
                                <label>Description</label>
                                <p>{selectedActivity.description}</p>
                            </div>
                        )}

                        {selectedActivity.correctionNote && (
                            <div className="detail-section correction">
                                <label><AlertTriangle size={14} /> Correction Required</label>
                                <p>{selectedActivity.correctionNote}</p>
                            </div>
                        )}

                        {selectedActivity.rejectionReason && (
                            <div className="detail-section rejection">
                                <label><XCircle size={14} /> Rejection Reason</label>
                                <p>{selectedActivity.rejectionReason}</p>
                            </div>
                        )}

                        {/* Document Preview */}
                        {selectedActivity.documentUrl && (
                            <div className="detail-section">
                                <label>Certificate/Document</label>
                                <div className="document-preview">
                                    {selectedActivity.documentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                        <img
                                            src={selectedActivity.documentUrl}
                                            alt="Certificate"
                                            className="certificate-image"
                                        />
                                    ) : (
                                        <div className="document-file">
                                            <FileText size={48} />
                                            <p>Document uploaded</p>
                                        </div>
                                    )}
                                    <a
                                        href={selectedActivity.documentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-secondary"
                                    >
                                        <Eye size={16} /> View Full Document
                                    </a>
                                </div>
                            </div>
                        )}

                        <div className="modal-actions">
                            <Button variant="ghost" onClick={() => setShowModal(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MyActivities;
