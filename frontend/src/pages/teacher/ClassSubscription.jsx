import { useState, useEffect, useRef } from 'react';
import { teacherAPI, authAPI } from '../../api';
import { Card, Loading, Button } from '../../components/ui';
import { School, Check, X, Download, Trash2, AlertTriangle, FileText, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './ClassSubscription.css';

// Branch display name mapping
const BRANCH_NAMES = {
    'CT': 'Computer Engineering',
    'CE': 'Civil Engineering',
    'ME': 'Mechanical Engineering',
    'EE': 'Electrical Engineering',
    'EC': 'Electronics Engineering',
    'AR': 'Architecture',
};

const ClassSubscription = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [options, setOptions] = useState({ branches: [], semesters: [], sections: [] });
    const [subscribedClasses, setSubscribedClasses] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [optionsRes, classesRes] = await Promise.all([
                authAPI.getOptions(),
                teacherAPI.getMyClasses(),
            ]);
            setOptions(optionsRes.data);
            const currentClasses = classesRes.data.classes || [];
            setSubscribedClasses(currentClasses);
            setSelectedClasses(currentClasses.map(c => `${c.branch}-${c.semester}-${c.section || ''}`));
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const generateClassKey = (branch, semester, section) => `${branch}-${semester}-${section || ''}`;

    const toggleClass = (branch, semester, section) => {
        const key = generateClassKey(branch, semester, section);
        setSelectedClasses(prev =>
            prev.includes(key)
                ? prev.filter(k => k !== key)
                : [...prev, key]
        );
    };

    const isSelected = (branch, semester, section) => {
        return selectedClasses.includes(generateClassKey(branch, semester, section));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const classes = selectedClasses.map(key => {
                const [branch, semester, section] = key.split('-');
                return { branch, semester, section: section || undefined };
            });
            await teacherAPI.subscribeClasses(classes);
            toast.success('Classes updated successfully!');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update classes');
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadPDF = async (branch, semester) => {
        const key = `${branch}-${semester}`;
        setPdfLoading(key);
        try {
            const response = await teacherAPI.getClassReport({ branch, semester });
            const { students } = response.data;

            if (!students || students.length === 0) {
                toast.error('No students found in this class');
                return;
            }

            const doc = new jsPDF();
            const branchName = BRANCH_NAMES[branch] || branch;

            // Title
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('Government Polytechnic College Kothamangalam', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

            // Subtitle
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.text('Activity Point Summary', doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });

            // Department
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text(branchName, doc.internal.pageSize.getWidth() / 2, 38, { align: 'center' });

            // Table
            autoTable(doc, {
                startY: 48,
                head: [['Sl. No', 'Register Number', 'Name', 'Activity Points']],
                body: students.map((s, i) => [
                    i + 1,
                    s.registrationNumber || 'N/A',
                    s.fullName,
                    s.totalPoints || 0
                ]),
                theme: 'grid',
                headStyles: {
                    fillColor: [63, 81, 181],
                    textColor: 255,
                    fontStyle: 'bold',
                },
                styles: {
                    fontSize: 10,
                    cellPadding: 4,
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 20 },
                    3: { halign: 'center', cellWidth: 35 },
                },
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setFont(undefined, 'normal');
                doc.text(
                    `Generated on ${new Date().toLocaleDateString('en-IN')} — Page ${i} of ${pageCount}`,
                    doc.internal.pageSize.getWidth() / 2,
                    doc.internal.pageSize.getHeight() - 10,
                    { align: 'center' }
                );
            }

            doc.save(`Activity_Report_${branch}_${semester}.pdf`);
            toast.success('PDF downloaded!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate PDF');
        } finally {
            setPdfLoading(null);
        }
    };

    const handleDeleteClassData = async (branch, semester) => {
        const expectedText = `${branch} ${semester}`;
        if (deleteConfirmText.trim().toUpperCase() !== expectedText.toUpperCase()) {
            toast.error(`Please type "${expectedText}" to confirm`);
            return;
        }

        setDeleteLoading(true);
        try {
            const response = await teacherAPI.deleteClassData({ branch, semester });
            toast.success(response.data.message);
            setShowDeleteConfirm(null);
            setDeleteConfirmText('');
            setActiveDropdown(null);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete class data');
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading) {
        return <Loading fullScreen text="Loading classes..." />;
    }

    return (
        <div className="class-subscription">
            <div className="page-header">
                <div>
                    <h1><School size={28} /> Class Subscription</h1>
                    <p>Select the classes you want to manage</p>
                </div>
                <Button onClick={handleSave} loading={saving}>
                    <Check size={16} /> Save Changes
                </Button>
            </div>

            <Card className="info-card">
                <p>
                    <strong>Tip:</strong> Subscribe to classes to receive student activity submissions from those classes.
                    Students in subscribed classes will appear in your verification queue.
                    Click on a subscribed class tag below to download a PDF report or manage data.
                </p>
            </Card>

            <div className="classes-grid">
                {options.branches?.map(branch => (
                    <Card key={branch} className="branch-card">
                        <h3>{branch}</h3>
                        <div className="semesters-grid">
                            {options.semesters?.map(semester => (
                                <button
                                    key={`${branch}-${semester}`}
                                    className={`semester-btn ${isSelected(branch, semester, '') ? 'selected' : ''}`}
                                    onClick={() => toggleClass(branch, semester, '')}
                                >
                                    {semester}
                                    {isSelected(branch, semester, '') && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>

            <div className="selected-summary">
                <Card>
                    <h4>Selected Classes ({selectedClasses.length})</h4>
                    {selectedClasses.length > 0 ? (
                        <div className="selected-tags" ref={dropdownRef}>
                            {selectedClasses.map(key => {
                                const [branch, semester, section] = key.split('-');
                                const isS6 = semester.toUpperCase() === 'S6';
                                return (
                                    <div key={key} className="class-tag-wrapper">
                                        <span
                                            className={`class-tag clickable ${activeDropdown === key ? 'active' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveDropdown(activeDropdown === key ? null : key);
                                            }}
                                        >
                                            {branch} - Sem {semester} {section ? `- ${section}` : ''}
                                            <ChevronDown size={12} className={`tag-chevron ${activeDropdown === key ? 'open' : ''}`} />
                                            <button
                                                className="tag-remove"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleClass(branch, semester, section);
                                                }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>

                                        {activeDropdown === key && (
                                            <div className="class-actions-dropdown">
                                                <button
                                                    className="dropdown-item"
                                                    onClick={() => {
                                                        handleDownloadPDF(branch, semester);
                                                        setActiveDropdown(null);
                                                    }}
                                                    disabled={pdfLoading === `${branch}-${semester}`}
                                                >
                                                    {pdfLoading === `${branch}-${semester}` ? (
                                                        <>⏳ Generating...</>
                                                    ) : (
                                                        <><Download size={14} /> Download PDF Report</>
                                                    )}
                                                </button>

                                                {isS6 && (
                                                    <button
                                                        className="dropdown-item danger"
                                                        onClick={() => {
                                                            setShowDeleteConfirm({ branch, semester });
                                                            setActiveDropdown(null);
                                                        }}
                                                    >
                                                        <Trash2 size={14} /> Delete Class Data
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="empty-text">No classes selected</p>
                    )}
                </Card>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="delete-overlay" onClick={() => { setShowDeleteConfirm(null); setDeleteConfirmText(''); }}>
                    <div className="delete-dialog" onClick={e => e.stopPropagation()}>
                        <div className="delete-warning-icon">
                            <AlertTriangle size={48} />
                        </div>
                        <h3>⚠️ Delete All Data for {showDeleteConfirm.branch} S6?</h3>
                        <p>
                            This will <strong>permanently delete</strong> all students, activities, uploaded documents,
                            and profile photos for <strong>{showDeleteConfirm.branch} Semester 6</strong>.
                            This action <strong>cannot be undone</strong>.
                        </p>
                        <div className="delete-confirm-input">
                            <label>
                                Type <strong>"{showDeleteConfirm.branch} {showDeleteConfirm.semester}"</strong> to confirm:
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={e => setDeleteConfirmText(e.target.value)}
                                placeholder={`${showDeleteConfirm.branch} ${showDeleteConfirm.semester}`}
                                className="form-input"
                            />
                        </div>
                        <div className="delete-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => { setShowDeleteConfirm(null); setDeleteConfirmText(''); }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={() => handleDeleteClassData(showDeleteConfirm.branch, showDeleteConfirm.semester)}
                                disabled={deleteLoading || deleteConfirmText.trim().toUpperCase() !== `${showDeleteConfirm.branch} ${showDeleteConfirm.semester}`.toUpperCase()}
                            >
                                {deleteLoading ? 'Deleting...' : '🗑️ Delete Everything'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassSubscription;
