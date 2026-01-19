import { useState, useEffect } from 'react';
import { teacherAPI } from '../../api';
import { Card, Loading, Table, Pagination, Button, Modal } from '../../components/ui';
import { ShieldCheck, Search, CheckCircle, XCircle, User, Calendar, Hash, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import './StudentVerification.css';

const StudentVerification = () => {
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchUnverifiedStudents();
    }, [pagination.page]);

    const fetchUnverifiedStudents = async () => {
        setLoading(true);
        try {
            const response = await teacherAPI.getUnverifiedStudents({
                page: pagination.page,
                limit: pagination.limit,
            });
            setStudents(response.data.students || []);
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination?.total || 0,
                pages: response.data.pagination?.pages || 1,
            }));
        } catch (error) {
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (student) => {
        setActionLoading(true);
        try {
            await teacherAPI.verifyStudent(student._id);
            toast.success(`${student.fullName}'s profile verified!`);
            setStudents(prev => prev.filter(s => s._id !== student._id));
            setPagination(prev => ({ ...prev, total: prev.total - 1 }));
        } catch (error) {
            toast.error('Failed to verify student');
        } finally {
            setActionLoading(false);
        }
    };

    const openRejectModal = (student) => {
        setSelectedStudent(student);
        setRejectReason('');
        setRejectModalOpen(true);
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.error('Please provide a reason');
            return;
        }

        setActionLoading(true);
        try {
            await teacherAPI.rejectVerification(selectedStudent._id, rejectReason);
            toast.success('Rejection sent to student');
            setRejectModalOpen(false);
            setSelectedStudent(null);
        } catch (error) {
            toast.error('Failed to reject verification');
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const columns = [
        {
            key: 'fullName',
            title: 'Student',
            render: (val, row) => (
                <div className="student-cell">
                    <div className="student-avatar">
                        {row.profileImage ? (
                            <img src={row.profileImage} alt={val} />
                        ) : (
                            <User size={20} />
                        )}
                    </div>
                    <div className="student-info">
                        <span className="student-name">{val}</span>
                        <span className="student-email">{row.email}</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'registrationNumber',
            title: 'Reg. No',
            render: (val) => (
                <span className="reg-number">
                    <Hash size={14} /> {val}
                </span>
            ),
        },
        {
            key: 'branch',
            title: 'Class',
            render: (val, row) => (
                <span className="class-badge">
                    <BookOpen size={14} /> {val} - {row.semester}
                </span>
            ),
        },
        {
            key: 'dob',
            title: 'DOB',
            render: (val) => (
                <span className="dob">
                    <Calendar size={14} /> {formatDate(val)}
                </span>
            ),
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (_, row) => (
                <div className="action-buttons">
                    <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleVerify(row)}
                        loading={actionLoading}
                    >
                        <CheckCircle size={16} /> Verify
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => openRejectModal(row)}
                    >
                        <XCircle size={16} /> Reject
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="student-verification">
            <div className="page-header">
                <div>
                    <h1><ShieldCheck size={28} /> Verify Students</h1>
                    <p>Review and verify student profile details</p>
                </div>
                <div className="pending-count">
                    <span className="count">{pagination.total}</span>
                    <span className="label">Pending</span>
                </div>
            </div>

            {/* Students Table */}
            <Card>
                <Table
                    columns={columns}
                    data={students}
                    loading={loading}
                    emptyMessage="No students pending verification 🎉"
                />
                {pagination.pages > 1 && (
                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.pages}
                        totalItems={pagination.total}
                        itemsPerPage={pagination.limit}
                        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                    />
                )}
            </Card>

            {/* Reject Modal */}
            <Modal
                isOpen={rejectModalOpen}
                onClose={() => setRejectModalOpen(false)}
                title="Reject Verification"
            >
                <div className="reject-modal-content">
                    <p>
                        Why are you rejecting <strong>{selectedStudent?.fullName}</strong>'s profile verification?
                    </p>
                    <textarea
                        placeholder="Enter reason for rejection..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={4}
                    />
                    <div className="modal-actions">
                        <Button variant="ghost" onClick={() => setRejectModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleReject}
                            loading={actionLoading}
                        >
                            Send Rejection
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default StudentVerification;
