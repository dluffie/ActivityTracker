import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { Card, Loading, Table, Button, Input, Select, Modal } from '../../components/ui';
import { Settings, Plus, Edit2, Trash2, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import './RulesManagement.css';

const ACTIVITY_TYPES = [
    { value: 'sports', label: 'Sports' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'technical', label: 'Technical' },
    { value: 'nss', label: 'NSS' },
    { value: 'ncc', label: 'NCC' },
    { value: 'internship', label: 'Internship' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'hackathon', label: 'Hackathon' },
    { value: 'paper_publication', label: 'Paper Publication' },
    { value: 'project', label: 'Project' },
    { value: 'volunteer', label: 'Volunteer Work' },
    { value: 'other', label: 'Other' },
];

const LEVELS = [
    { value: 'college', label: 'College Level' },
    { value: 'district', label: 'District Level' },
    { value: 'state', label: 'State Level' },
    { value: 'national', label: 'National Level' },
    { value: 'international', label: 'International Level' },
];

const RulesManagement = () => {
    const [loading, setLoading] = useState(true);
    const [rules, setRules] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedRule, setSelectedRule] = useState(null);
    const [formData, setFormData] = useState({
        activityType: '',
        level: '',
        basePoints: '',
        maxPoints: '',
        description: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getRules();
            setRules(response.data.rules || response.data || []);
        } catch (error) {
            toast.error('Failed to load rules');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setModalMode('create');
        setFormData({
            activityType: '',
            level: '',
            basePoints: '',
            maxPoints: '',
            description: '',
        });
        setShowModal(true);
    };

    const handleOpenEdit = (rule) => {
        setModalMode('edit');
        setSelectedRule(rule);
        setFormData({
            activityType: rule.activityType,
            level: rule.level,
            basePoints: rule.basePoints,
            maxPoints: rule.maxPoints || '',
            description: rule.description || '',
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.activityType || !formData.level || !formData.basePoints) {
            toast.error('Please fill required fields');
            return;
        }

        setSaving(true);
        try {
            if (modalMode === 'create') {
                await adminAPI.createRule(formData);
                toast.success('Rule created successfully!');
            } else {
                await adminAPI.updateRule(selectedRule._id, formData);
                toast.success('Rule updated successfully!');
            }
            setShowModal(false);
            fetchRules();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (rule) => {
        if (!window.confirm('Are you sure you want to delete this rule?')) return;

        try {
            await adminAPI.deleteRule(rule._id);
            toast.success('Rule deleted');
            fetchRules();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete rule');
        }
    };

    const getTypeName = (type) => ACTIVITY_TYPES.find(t => t.value === type)?.label || type;
    const getLevelName = (level) => LEVELS.find(l => l.value === level)?.label || level;

    const columns = [
        {
            key: 'activityType',
            title: 'Activity Type',
            render: (val) => <span className="type-badge">{getTypeName(val)}</span>,
        },
        {
            key: 'level',
            title: 'Level',
            render: (val) => getLevelName(val),
        },
        {
            key: 'basePoints',
            title: 'Base Points',
            render: (val) => (
                <span className="points-value">
                    <Award size={14} /> {val}
                </span>
            ),
        },
        {
            key: 'maxPoints',
            title: 'Max Points',
            render: (val) => val || '-',
        },
        {
            key: 'description',
            title: 'Description',
            render: (val) => val || '-',
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

    if (loading) {
        return <Loading fullScreen text="Loading rules..." />;
    }

    return (
        <div className="rules-management">
            <div className="page-header">
                <div>
                    <h1><Settings size={28} /> Point Rules</h1>
                    <p>Configure activity point allocation rules</p>
                </div>
                <Button onClick={handleOpenCreate}>
                    <Plus size={16} /> Add Rule
                </Button>
            </div>

            <Card className="info-card">
                <p>
                    <strong>Note:</strong> These rules determine how many points are awarded for each type of activity at different levels.
                    Base points are awarded automatically, and max points define the upper limit for each category.
                </p>
            </Card>

            <Card>
                <Table
                    columns={columns}
                    data={rules}
                    emptyMessage="No rules configured yet"
                />
            </Card>

            {/* Rule Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={modalMode === 'create' ? 'Add Point Rule' : 'Edit Rule'}
            >
                <form onSubmit={handleSubmit} className="rule-form">
                    <Select
                        label="Activity Type *"
                        value={formData.activityType}
                        onChange={(e) => setFormData(prev => ({ ...prev, activityType: e.target.value }))}
                        options={ACTIVITY_TYPES}
                        placeholder="Select activity type"
                    />
                    <Select
                        label="Level *"
                        value={formData.level}
                        onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                        options={LEVELS}
                        placeholder="Select level"
                    />
                    <div className="form-row">
                        <Input
                            label="Base Points *"
                            type="number"
                            value={formData.basePoints}
                            onChange={(e) => setFormData(prev => ({ ...prev, basePoints: e.target.value }))}
                            placeholder="e.g., 5"
                            min="1"
                        />
                        <Input
                            label="Max Points"
                            type="number"
                            value={formData.maxPoints}
                            onChange={(e) => setFormData(prev => ({ ...prev, maxPoints: e.target.value }))}
                            placeholder="e.g., 10"
                            min="1"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-input"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Optional description for this rule..."
                        />
                    </div>
                    <div className="modal-footer">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={saving}>
                            {modalMode === 'create' ? 'Create Rule' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default RulesManagement;
