import { useState } from 'react';
import { teacherAPI } from '../../api';
import { Card, Button, Input, Select } from '../../components/ui';
import { Bell, Send, Users, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import './SendReminders.css';

const RECIPIENT_OPTIONS = [
    { value: 'all', label: 'All Students in My Classes' },
    { value: 'low_points', label: 'Students with Low Points' },
    { value: 'no_activities', label: 'Students with No Activities' },
];

const SendReminders = () => {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [formData, setFormData] = useState({
        recipients: 'all',
        subject: '',
        message: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.subject.trim() || !formData.message.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await teacherAPI.sendReminder({
                recipientType: formData.recipients,
                subject: formData.subject,
                message: formData.message,
            });
            setSent(true);
            toast.success('Reminder sent successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send reminder');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="send-reminders">
                <div className="success-state">
                    <Card className="success-card">
                        <div className="success-icon">
                            <CheckCircle size={64} />
                        </div>
                        <h2>Reminder Sent!</h2>
                        <p>Your reminder has been sent to the selected students.</p>
                        <Button onClick={() => {
                            setSent(false);
                            setFormData({ recipients: 'all', subject: '', message: '' });
                        }}>
                            Send Another
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="send-reminders">
            <div className="page-header">
                <div>
                    <h1><Bell size={28} /> Send Reminders</h1>
                    <p>Send notifications to your students</p>
                </div>
            </div>

            <div className="reminder-form-container">
                <Card className="form-card">
                    <form onSubmit={handleSubmit}>
                        <Select
                            label="Recipients"
                            name="recipients"
                            value={formData.recipients}
                            onChange={handleChange}
                            options={RECIPIENT_OPTIONS}
                        />

                        <Input
                            label="Subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="Enter reminder subject"
                        />

                        <div className="form-group">
                            <label className="form-label">Message</label>
                            <textarea
                                name="message"
                                className="form-input"
                                rows={6}
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Enter your reminder message..."
                            />
                        </div>

                        <div className="form-actions">
                            <Button type="submit" loading={loading}>
                                <Send size={16} /> Send Reminder
                            </Button>
                        </div>
                    </form>
                </Card>

                <div className="tips-section">
                    <Card className="tips-card">
                        <h4>💡 Tips for Effective Reminders</h4>
                        <ul>
                            <li>Be clear and concise about what action students need to take</li>
                            <li>Include specific deadlines if applicable</li>
                            <li>Mention the required activity points for graduation</li>
                            <li>Keep a friendly and encouraging tone</li>
                        </ul>
                    </Card>

                    <Card className="template-card">
                        <h4>📝 Quick Templates</h4>
                        <button
                            className="template-btn"
                            onClick={() => setFormData(prev => ({
                                ...prev,
                                subject: 'Activity Points Reminder',
                                message: 'Dear Student,\n\nThis is a friendly reminder to upload your activity certificates for verification. Please ensure you submit all your activities before the end of the semester.\n\nBest regards,\nYour Teacher'
                            }))}
                        >
                            General Reminder
                        </button>
                        <button
                            className="template-btn"
                            onClick={() => setFormData(prev => ({
                                ...prev,
                                subject: 'Urgent: Low Activity Points',
                                message: 'Dear Student,\n\nYour current activity points are below the required threshold. Please submit your pending activities as soon as possible to avoid any issues with your graduation requirements.\n\nBest regards,\nYour Teacher'
                            }))}
                        >
                            Low Points Alert
                        </button>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SendReminders;
