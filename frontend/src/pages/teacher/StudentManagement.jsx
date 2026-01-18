import { useState, useEffect } from 'react';
import { teacherAPI } from '../../api';
import { Card, Loading, Table, Pagination, Button } from '../../components/ui';
import { Users, Search, Download, Eye, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import './StudentManagement.css';

const StudentManagement = () => {
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchStudents();
    }, [pagination.page]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const response = await teacherAPI.getStudents({
                page: pagination.page,
                limit: pagination.limit,
                search: search || undefined,
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

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchStudents();
    };

    const columns = [
        {
            key: 'fullName',
            title: 'Name',
            render: (val, row) => (
                <div className="student-cell">
                    <span className="student-name">{val}</span>
                    <span className="student-email">{row.email}</span>
                </div>
            ),
        },
        {
            key: 'registrationNumber',
            title: 'Reg. No',
        },
        {
            key: 'branch',
            title: 'Branch',
            render: (val, row) => `${val} - Sem ${row.semester}`,
        },
        {
            key: 'section',
            title: 'Section',
        },
        {
            key: 'totalPoints',
            title: 'Points',
            render: (val) => (
                <span className="points-badge">
                    <TrendingUp size={14} /> {val || 0}
                </span>
            ),
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (_, row) => (
                <button className="btn btn-ghost btn-sm">
                    <Eye size={16} /> View
                </button>
            ),
        },
    ];

    return (
        <div className="student-management">
            <div className="page-header">
                <div>
                    <h1><Users size={28} /> My Students</h1>
                    <p>View and manage students in your subscribed classes</p>
                </div>
                <Button variant="secondary">
                    <Download size={16} /> Export
                </Button>
            </div>

            {/* Search */}
            <Card className="search-card">
                <div className="search-row">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, registration number..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Button onClick={handleSearch}>Search</Button>
                </div>
            </Card>

            {/* Students Table */}
            <Card>
                <Table
                    columns={columns}
                    data={students}
                    loading={loading}
                    emptyMessage="No students found in your classes"
                />
                <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.pages}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                    onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                />
            </Card>
        </div>
    );
};

export default StudentManagement;
