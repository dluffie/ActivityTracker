import { useState, useEffect } from 'react';
import { teacherAPI, authAPI } from '../../api';
import { Card, Loading, Button, Pagination } from '../../components/ui';
import { School, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import './ClassSubscription.css';

const ClassSubscription = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [options, setOptions] = useState({ branches: [], semesters: [], sections: [] });
    const [subscribedClasses, setSubscribedClasses] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState([]);

    useEffect(() => {
        fetchData();
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
                </p>
            </Card>

            <div className="classes-grid">
                {options.branches?.map(branch => (
                    <Card key={branch} className="branch-card">
                        <h3>{branch}</h3>
                        <div className="semesters-grid">
                            {options.semesters?.map(semester => (
                                <div key={`${branch}-${semester}`} className="semester-section">
                                    <h4>Semester {semester}</h4>
                                    <div className="sections-list">
                                        {(options.sections?.length > 0 ? options.sections : ['']).map(section => (
                                            <button
                                                key={`${branch}-${semester}-${section}`}
                                                className={`class-btn ${isSelected(branch, semester, section) ? 'selected' : ''}`}
                                                onClick={() => toggleClass(branch, semester, section)}
                                            >
                                                {section || 'All'}
                                                {isSelected(branch, semester, section) && <Check size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>

            <div className="selected-summary">
                <Card>
                    <h4>Selected Classes ({selectedClasses.length})</h4>
                    {selectedClasses.length > 0 ? (
                        <div className="selected-tags">
                            {selectedClasses.map(key => {
                                const [branch, semester, section] = key.split('-');
                                return (
                                    <span key={key} className="class-tag">
                                        {branch} - Sem {semester} {section ? `- ${section}` : ''}
                                        <button onClick={() => toggleClass(branch, semester, section)}>
                                            <X size={12} />
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="empty-text">No classes selected</p>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default ClassSubscription;
