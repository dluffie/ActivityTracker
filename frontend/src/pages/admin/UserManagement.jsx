import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { Card, Loading, Table, Pagination, Button, Input, Select, Modal } from '../../components/ui';
import { Users, Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import './UserManagement.css';

const ROLE_OPTIONS = [
    { value: '', label: 'All Roles' },
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'admin', label: 'Admin' },
];

const UserManagement = () => {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
    const [filters, setFilters] = useState({ role: '', search: '' });
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'student',
        registrationNumber: '',
        branch: '',
        semester: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, [pagination.page, filters.role]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getUsers({
                page: pagination.page,
                limit: pagination.limit,
                role: filters.role || undefined,
                search: filters.search || undefined,
            });
            setUsers(response.data.users || []);
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination?.total || 0,
                pages: response.data.pagination?.pages || 1,
            }));
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setModalMode('create');
        setFormData({
            fullName: '',
            email: '',
            password: '',
            role: 'student',
            registrationNumber: '',
            branch: '',
            semester: '',
        });
        setShowModal(true);
    };

    const handleOpenEdit = (user) => {
        setModalMode('edit');
        setSelectedUser(user);
        setFormData({
            fullName: user.fullName,
            email: user.email,
            password: '',
            role: user.role,
            registrationNumber: user.registrationNumber || '',
            branch: user.branch || '',
            semester: user.semester || '',
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.fullName || !formData.email) {
            toast.error('Please fill required fields');
            return;
        }

        setSaving(true);
        try {
            if (modalMode === 'create') {
                await adminAPI.createUser(formData);
                toast.success('User created successfully!');
            } else {
                await adminAPI.updateUser(selectedUser._id, formData);
                toast.success('User updated successfully!');
            }
            setShowModal(false);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (user) => {
        if (!window.confirm(`Are you sure you want to delete ${user.fullName}?`)) return;

        try {
            await adminAPI.deleteUser(user._id);
            toast.success('User deleted');
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const columns = [
        {
            key: 'fullName',
            title: 'Name',
            render: (val, row) => (
                <div className="user-cell">
                    <span className="user-name">{val}</span>
                    <span className="user-email">{row.email}</span>
                </div>
            ),
        },
        {
            key: 'role',
            title: 'Role',
            render: (val) => (
                <span className={`role-badge role-${val}`}>{val}</span>
            ),
        },
        {
            key: 'registrationNumber',
            title: 'Reg. No',
            render: (val) => val || '-',
        },
        {
            key: 'branch',
            title: 'Branch',
            render: (val, row) => val ? `${val} - Sem ${row.semester}` : '-',
        },
        {
            key: 'totalPoints',
            title: 'Points',
            render: (val, row) => row.role === 'student' ? (val || 0) : '-',
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (_, row) => (
                <div className="action-btns">
                    <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(row)}>
                        <Edit2 size={14} />
                    </button>
                    <button className="btn btn-ghost btn-sm text-error" onClick={() => handleDelete(row)}>
                        <Trash2 size={14} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="user-management">
            <div className="page-header">
                <div>
                    <h1><Users size={28} /> User Management</h1>
                    <p>Manage students, teachers, and administrators</p>
                </div>
                <Button onClick={handleOpenCreate}>
                    <Plus size={16} /> Add User
                </Button>
            </div>

            {/* Filters */}
            <Card className="filters-card">
                <div className="filters-row">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                        />
                    </div>
                    <Select
                        value={filters.role}
                        onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                        options={ROLE_OPTIONS}
                    />
                    <Button onClick={fetchUsers} variant="secondary">
                        <Filter size={16} /> Apply
                    </Button>
                </div>
            </Card>

            {/* Users Table */}
            <Card>
                <Table
                    columns={columns}
                    data={users}
                    loading={loading}
                    emptyMessage="No users found"
                />
                <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.pages}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                    onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                />
            </Card>

            {/* User Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={modalMode === 'create' ? 'Add New User' : 'Edit User'}
            >
                <form onSubmit={handleSubmit} className="user-form">
                    <Input
                        label="Full Name *"
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="Enter full name"
                    />
                    <Input
                        label="Email *"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email"
                    />
                    {modalMode === 'create' && (
                        <Input
                            label="Password *"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Enter password"
                        />
                    )}
                    <Select
                        label="Role *"
                        value={formData.role}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                        options={[
                            { value: 'student', label: 'Student' },
                            { value: 'teacher', label: 'Teacher' },
                            { value: 'admin', label: 'Admin' },
                        ]}
                    />
                    {formData.role === 'student' && (
                        <>
                            <Input
                                label="Registration Number"
                                value={formData.registrationNumber}
                                onChange={(e) => setFormData(prev => ({ ...prev, registrationNumber: e.target.value }))}
                                placeholder="e.g., 21CS045"
                            />
                            <div className="form-row">
                                <Input
                                    label="Branch"
                                    value={formData.branch}
                                    onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                                    placeholder="e.g., CSE"
                                />
                                <Input
                                    label="Semester"
                                    value={formData.semester}
                                    onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                                    placeholder="e.g., 5"
                                />
                            </div>
                        </>
                    )}
                    <div className="modal-footer">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={saving}>
                            {modalMode === 'create' ? 'Create User' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UserManagement;
