import { useState, useEffect } from 'react';
import { Card, Button, Input, Loading } from '../../components/ui';
import { Settings, Save, Database, Mail, Shield, Bell } from 'lucide-react';
import { adminAPI } from '../../api';
import toast from 'react-hot-toast';
import './Settings.css';

const AdminSettings = () => {
    const [saving, setSaving] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [settings, setSettings] = useState({
        systemName: 'Activity Point Management System',
        requiredPoints: '60',
        maxFileSize: '10',
        emailNotifications: true,
        autoApprove: false,
        maintenanceMode: false,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoadingSettings(true);
        try {
            const response = await adminAPI.getSettings();
            const s = response.data.settings;
            setSettings({
                systemName: s.systemName || 'Activity Point Management System',
                requiredPoints: String(s.requiredPoints || 60),
                maxFileSize: String(s.maxFileSize || 10),
                emailNotifications: s.emailNotifications ?? true,
                autoApprove: s.autoApprove ?? false,
                maintenanceMode: s.maintenanceMode ?? false,
            });
        } catch (error) {
            toast.error('Failed to load settings');
        } finally {
            setLoadingSettings(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await adminAPI.updateSettings(settings);
            toast.success('Settings saved successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleMaintenanceToggle = async (e) => {
        const enabled = e.target.checked;
        const newSettings = { ...settings, maintenanceMode: enabled };
        setSettings(newSettings);

        try {
            await adminAPI.updateSettings(newSettings);
            if (enabled) {
                toast('⚠️ Maintenance Mode ENABLED — all non-admin users are blocked!', {
                    icon: '🔧',
                    duration: 5000,
                    style: { background: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b' }
                });
            } else {
                toast.success('Maintenance Mode disabled — site is live again.');
            }
        } catch (error) {
            // Revert on failure
            setSettings(prev => ({ ...prev, maintenanceMode: !enabled }));
            toast.error('Failed to update maintenance mode');
        }
    };

    if (loadingSettings) {
        return <Loading fullScreen text="Loading settings..." />;
    }

    return (
        <div className="admin-settings">
            <div className="page-header">
                <div>
                    <h1><Settings size={28} /> System Settings</h1>
                    <p>Configure system-wide parameters</p>
                </div>
                <Button onClick={handleSave} loading={saving}>
                    <Save size={16} /> Save Changes
                </Button>
            </div>

            <div className="settings-grid">
                {/* General Settings */}
                <Card className="settings-card">
                    <div className="card-header">
                        <Database size={20} />
                        <h3>General Settings</h3>
                    </div>
                    <div className="settings-form">
                        <Input
                            label="System Name"
                            name="systemName"
                            value={settings.systemName}
                            onChange={handleChange}
                            placeholder="Enter system name"
                        />
                        <Input
                            label="Required Points for Graduation"
                            name="requiredPoints"
                            type="number"
                            value={settings.requiredPoints}
                            onChange={handleChange}
                            placeholder="e.g., 60"
                        />
                        <Input
                            label="Max File Upload Size (MB)"
                            name="maxFileSize"
                            type="number"
                            value={settings.maxFileSize}
                            onChange={handleChange}
                            placeholder="e.g., 10"
                        />
                    </div>
                </Card>

                {/* Notification Settings */}
                <Card className="settings-card">
                    <div className="card-header">
                        <Bell size={20} />
                        <h3>Notification Settings</h3>
                    </div>
                    <div className="settings-form">
                        <label className="toggle-setting">
                            <div className="toggle-info">
                                <span className="toggle-label">Email Notifications</span>
                                <span className="toggle-desc">Send email notifications for activity updates</span>
                            </div>
                            <input
                                type="checkbox"
                                name="emailNotifications"
                                checked={settings.emailNotifications}
                                onChange={handleChange}
                                className="toggle-input"
                            />
                            <span className="toggle-switch"></span>
                        </label>
                    </div>
                </Card>

                {/* Security Settings */}
                <Card className="settings-card">
                    <div className="card-header">
                        <Shield size={20} />
                        <h3>Security Settings</h3>
                    </div>
                    <div className="settings-form">
                        <label className="toggle-setting">
                            <div className="toggle-info">
                                <span className="toggle-label">Auto-Approve Activities</span>
                                <span className="toggle-desc">Automatically approve activities below a point threshold</span>
                            </div>
                            <input
                                type="checkbox"
                                name="autoApprove"
                                checked={settings.autoApprove}
                                onChange={handleChange}
                                className="toggle-input"
                            />
                            <span className="toggle-switch"></span>
                        </label>

                        <label className="toggle-setting warning">
                            <div className="toggle-info">
                                <span className="toggle-label">Maintenance Mode</span>
                                <span className="toggle-desc">Restrict access to administrators only</span>
                            </div>
                            <input
                                type="checkbox"
                                name="maintenanceMode"
                                checked={settings.maintenanceMode}
                                onChange={handleMaintenanceToggle}
                                className="toggle-input"
                            />
                            <span className="toggle-switch"></span>
                        </label>
                    </div>
                </Card>

                {/* Danger Zone */}
                <Card className="settings-card danger-zone">
                    <div className="card-header">
                        <Shield size={20} />
                        <h3>Danger Zone</h3>
                    </div>
                    <div className="danger-actions">
                        <div className="danger-item">
                            <div>
                                <h4>Reset All Statistics</h4>
                                <p>Clear all activity statistics. This action cannot be undone.</p>
                            </div>
                            <Button variant="secondary" className="btn-danger-outline">
                                Reset Stats
                            </Button>
                        </div>
                        <div className="danger-item">
                            <div>
                                <h4>Export All Data</h4>
                                <p>Download a backup of all system data.</p>
                            </div>
                            <Button variant="secondary">
                                Export Data
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminSettings;
