import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { activityAPI, teacherAPI } from '../../api';
import { Card, Loading, Modal, Table, Pagination, Button, Input, Select } from '../../components/ui';
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    Eye,
    Search,
    Filter,
    FileText,
    Calendar,
    User
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Verification.css';

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'correction_needed', label: 'Correction Needed' },
];

const Verification = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
    const [filters, setFilters] = useState({ status: 'pending', search: '' });
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionData, setActionData] = useState({ points: '', remarks: '' });

    useEffect(() => {
        fetchActivities();
    }, [pagination.page, filters]);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const response = await activityAPI.getPending({
                page: pagination.page,
                limit: pagination.limit,
                status: filters.status || undefined,
                search: filters.search || undefined,
            });
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

    const handleViewActivity = (activity) => {
        setSelectedActivity(activity);
        setActionData({ points: activity.pointsAssigned || '', remarks: '' });
        setShowModal(true);
    };

    const handleApprove = async () => {
        if (!actionData.points || actionData.points <= 0) {
            toast.error('Please enter valid points');
            return;
        }

        setActionLoading(true);
        try {
            await activityAPI.approve(selectedActivity._id, {
                pointsAssigned: parseInt(actionData.points),
                comments: actionData.remarks,
            });
            toast.success('Activity approved!');
            setShowModal(false);
            fetchActivities();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!actionData.remarks.trim()) {
            toast.error('Please provide rejection reason');
            return;
        }

        setActionLoading(true);
        try {
            await activityAPI.reject(selectedActivity._id, {
                reason: actionData.remarks,
            });
            toast.success('Activity rejected');
            setShowModal(false);
            fetchActivities();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRequestCorrection = async () => {
        if (!actionData.remarks.trim()) {
            toast.error('Please provide correction details');
            return;
        }

        setActionLoading(true);
        try {
            await activityAPI.requestCorrection(selectedActivity._id, {
                comments: actionData.remarks,
            });
            toast.success('Correction requested');
            setShowModal(false);
            fetchActivities();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to request correction');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEdit = async () => {
        if (!actionData.points || actionData.points <= 0) {
            toast.error('Please enter valid points');
            return;
        }

        setActionLoading(true);
        try {
            await activityAPI.edit(selectedActivity._id, {
                pointsAssigned: parseInt(actionData.points),
                teacherComments: actionData.remarks,
            });
            toast.success('Activity updated!');
            setShowModal(false);
            fetchActivities();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update');
        } finally {
            setActionLoading(false);
        }
    };

    const columns = [
        {
            key: 'student',
            title: 'Student',
            render: (_, row) => (
                <div className="student-cell">
                    <span className="student-name">{row.student?.fullName}</span>
                    <span className="student-reg">{row.student?.registrationNumber}</span>
                </div>
            ),
        },
        {
            key: 'eventName',
            title: 'Event',
            render: (val, row) => (
                <div className="event-cell">
                    <span className="event-name">{val}</span>
                    <span className="event-type">{row.activityType} • {row.level}</span>
                </div>
            ),
        },
        {
            key: 'startDate',
            title: 'Date',
            render: (val) => new Date(val).toLocaleDateString(),
        },
        {
            key: 'status',
            title: 'Status',
            render: (val) => (
                <span className={`badge badge-${val === 'approved' ? 'success' : val === 'rejected' ? 'error' : val === 'correction_needed' ? 'warning' : 'info'}`}>
                    {val}
                </span>
            ),
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (_, row) => (
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleViewActivity(row)}
                >
                    <Eye size={16} /> View
                </button>
            ),
        },
    ];

    return (
        <div className="verification-page">
            <div className="page-header">
                <div>
                    <h1>Activity Verification</h1>
                    <p>Review and verify student activity submissions</p>
                </div>
            </div>

            {/* Filters */}
            <Card className="filters-card">
                <div className="filters-row">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by student name or event..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && fetchActivities()}
                        />
                    </div>
                    <Select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        options={STATUS_OPTIONS}
                    />
                    <Button onClick={fetchActivities} variant="secondary">
                        <Filter size={16} /> Apply
                    </Button>
                </div>
            </Card>

            {/* Activities Table */}
            <Card>
                <Table
                    columns={columns}
                    data={activities}
                    loading={loading}
                    emptyMessage="No activities to review"
                />
                <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.pages}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                    onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                />
            </Card>

            {/* Activity Detail Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Activity Details"
                size="large"
            >
                {selectedActivity && (
                    <div className="activity-detail">
                        <div className="detail-grid">
                            <div className="detail-section">
                                <h4><User size={16} /> Student Information</h4>
                                <div className="detail-row">
                                    <span>Name:</span>
                                    <strong>{selectedActivity.student?.fullName}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Reg. No:</span>
                                    <strong>{selectedActivity.student?.registrationNumber}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Branch:</span>
                                    <strong>{selectedActivity.student?.branch} - Sem {selectedActivity.student?.semester}</strong>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h4><FileText size={16} /> Activity Information</h4>
                                <div className="detail-row">
                                    <span>Event:</span>
                                    <strong>{selectedActivity.eventName}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Type:</span>
                                    <strong>{selectedActivity.activityType}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Level:</span>
                                    <strong>{selectedActivity.level}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Position:</span>
                                    <strong>{selectedActivity.position || 'N/A'}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Date:</span>
                                    <strong>
                                        {new Date(selectedActivity.startDate).toLocaleDateString()}
                                        {selectedActivity.endDate && ` - ${new Date(selectedActivity.endDate).toLocaleDateString()}`}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {selectedActivity.description && (
                            <div className="detail-section">
                                <h4>Description</h4>
                                <p>{selectedActivity.description}</p>
                            </div>
                        )}

                        {selectedActivity.docUrl && (
                            <div className="detail-section">
                                <h4>Certificate/Document</h4>
                                <a
                                    href={selectedActivity.docUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary btn-sm"
                                >
                                    <FileText size={16} /> View Document
                                </a>
                            </div>
                        )}

                        {selectedActivity.status === 'pending' && (
                            <div className="action-section">
                                <h4>Take Action</h4>
                                <div className="action-form">
                                    <Input
                                        label="Points to Award"
                                        type="number"
                                        value={actionData.points}
                                        onChange={(e) => setActionData(prev => ({ ...prev, points: e.target.value }))}
                                        placeholder="Enter points"
                                        min="1"
                                    />
                                    <div className="form-group">
                                        <label className="form-label">Remarks (Required for rejection/correction)</label>
                                        <textarea
                                            className="form-input"
                                            rows={3}
                                            value={actionData.remarks}
                                            onChange={(e) => setActionData(prev => ({ ...prev, remarks: e.target.value }))}
                                            placeholder="Enter remarks..."
                                        />
                                    </div>
                                    <div className="action-buttons">
                                        <Button
                                            onClick={handleApprove}
                                            loading={actionLoading}
                                            className="btn-success"
                                        >
                                            <CheckCircle size={16} /> Approve
                                        </Button>
                                        <Button
                                            onClick={handleRequestCorrection}
                                            loading={actionLoading}
                                            variant="secondary"
                                        >
                                            <AlertTriangle size={16} /> Request Correction
                                        </Button>
                                        <Button
                                            onClick={handleReject}
                                            loading={actionLoading}
                                            className="btn-danger"
                                        >
                                            <XCircle size={16} /> Reject
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedActivity.status === 'approved' && (
                            <div className="action-section">
                                <h4>Edit Approved Activity</h4>
                                <div className="action-form">
                                    <Input
                                        label="Points Assigned"
                                        type="number"
                                        value={actionData.points}
                                        onChange={(e) => setActionData(prev => ({ ...prev, points: e.target.value }))}
                                        placeholder="Enter points"
                                        min="1"
                                    />
                                    <div className="form-group">
                                        <label className="form-label">Teacher Comments</label>
                                        <textarea
                                            className="form-input"
                                            rows={3}
                                            value={actionData.remarks}
                                            onChange={(e) => setActionData(prev => ({ ...prev, remarks: e.target.value }))}
                                            placeholder="Enter comments..."
                                        />
                                    </div>
                                    <div className="action-buttons">
                                        <Button
                                            onClick={handleEdit}
                                            loading={actionLoading}
                                            className="btn-primary"
                                        >
                                            <CheckCircle size={16} /> Save Changes
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Verification;
