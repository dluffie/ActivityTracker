import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { Card, Loading, Table, Pagination, Select } from '../../components/ui';
import { FileText, Search, Filter, User, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import './AuditLogs.css';

const ACTION_OPTIONS = [
    { value: '', label: 'All Actions' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
    { value: 'approve', label: 'Approve' },
    { value: 'reject', label: 'Reject' },
    { value: 'login', label: 'Login' },
];

const AuditLogs = () => {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
    const [filters, setFilters] = useState({ action: '', search: '' });

    useEffect(() => {
        fetchLogs();
    }, [pagination.page, filters.action]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getAuditLogs({
                page: pagination.page,
                limit: pagination.limit,
                action: filters.action || undefined,
                search: filters.search || undefined,
            });
            setLogs(response.data.logs || []);
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination?.total || 0,
                pages: response.data.pagination?.pages || 1,
            }));
        } catch (error) {
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action) => {
        const colors = {
            create: 'success',
            update: 'info',
            delete: 'error',
            approve: 'success',
            reject: 'error',
            login: 'info',
        };
        return colors[action] || 'info';
    };

    const columns = [
        {
            key: 'createdAt',
            title: 'Timestamp',
            render: (val) => (
                <div className="timestamp-cell">
                    <Clock size={14} />
                    {new Date(val).toLocaleString()}
                </div>
            ),
        },
        {
            key: 'user',
            title: 'User',
            render: (val) => (
                <div className="user-cell">
                    <User size={14} />
                    <span>{val?.fullName || 'System'}</span>
                    <span className="user-role">{val?.role}</span>
                </div>
            ),
        },
        {
            key: 'action',
            title: 'Action',
            render: (val) => (
                <span className={`action-badge action-${getActionColor(val)}`}>
                    {val}
                </span>
            ),
        },
        {
            key: 'resource',
            title: 'Resource',
        },
        {
            key: 'description',
            title: 'Description',
            render: (val) => <span className="description">{val || '-'}</span>,
        },
    ];

    return (
        <div className="audit-logs">
            <div className="page-header">
                <div>
                    <h1><FileText size={28} /> Audit Logs</h1>
                    <p>Track all system activities and changes</p>
                </div>
            </div>

            {/* Filters */}
            <Card className="filters-card">
                <div className="filters-row">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                        />
                    </div>
                    <Select
                        value={filters.action}
                        onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                        options={ACTION_OPTIONS}
                    />
                    <button className="btn btn-secondary" onClick={fetchLogs}>
                        <Filter size={16} /> Apply
                    </button>
                </div>
            </Card>

            {/* Logs Table */}
            <Card>
                <Table
                    columns={columns}
                    data={logs}
                    loading={loading}
                    emptyMessage="No audit logs found"
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

export default AuditLogs;
