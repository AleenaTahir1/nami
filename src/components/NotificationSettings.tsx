import { Bell, BellOff, Volume2, VolumeX, Eye, EyeOff, Check, X } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import '../styles/NotificationSettings.css';

export function NotificationSettings() {
    const { permission, settings, loading, requestPermission, updateSettings } = useNotifications();

    const handleRequestPermission = async () => {
        await requestPermission();
    };

    const handleToggleEnabled = async () => {
        await updateSettings({ enabled: !settings.enabled });
    };

    const handleToggleSound = async () => {
        await updateSettings({ sound: !settings.sound });
    };

    const handleTogglePreview = async () => {
        await updateSettings({ preview: !settings.preview });
    };

    if (loading) {
        return (
            <div className="notification-settings-loading">
                <p>Loading notification settings...</p>
            </div>
        );
    }

    return (
        <div className="notification-settings">
            <div className="settings-header">
                <Bell size={24} />
                <h3>Notifications</h3>
            </div>

            {/* Permission Status */}
            <div className="permission-status">
                <div className="status-indicator">
                    {permission.granted ? (
                        <>
                            <Check size={18} className="status-icon granted" />
                            <span className="status-text">Notifications Enabled</span>
                        </>
                    ) : permission.denied ? (
                        <>
                            <X size={18} className="status-icon denied" />
                            <span className="status-text">Notifications Blocked</span>
                        </>
                    ) : (
                        <>
                            <Bell size={18} className="status-icon default" />
                            <span className="status-text">Permission Not Requested</span>
                        </>
                    )}
                </div>

                {!permission.granted && (
                    <button className="request-permission-btn" onClick={handleRequestPermission}>
                        Enable Notifications
                    </button>
                )}

                {permission.denied && (
                    <p className="permission-help">
                        Notifications are blocked. Please enable them in your system settings.
                    </p>
                )}
            </div>

            {/* Settings */}
            <div className="settings-list">
                {/* Enable/Disable Notifications */}
                <div className="setting-item">
                    <div className="setting-info">
                        {settings.enabled ? <Bell size={20} /> : <BellOff size={20} />}
                        <div>
                            <h4>Enable Notifications</h4>
                            <p>Receive notifications for new messages</p>
                        </div>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={settings.enabled}
                            onChange={handleToggleEnabled}
                            disabled={!permission.granted}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                {/* Sound */}
                <div className="setting-item">
                    <div className="setting-info">
                        {settings.sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        <div>
                            <h4>Notification Sound</h4>
                            <p>Play sound when receiving notifications</p>
                        </div>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={settings.sound}
                            onChange={handleToggleSound}
                            disabled={!settings.enabled || !permission.granted}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                {/* Message Preview */}
                <div className="setting-item">
                    <div className="setting-info">
                        {settings.preview ? <Eye size={20} /> : <EyeOff size={20} />}
                        <div>
                            <h4>Message Preview</h4>
                            <p>Show message content in notifications</p>
                        </div>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={settings.preview}
                            onChange={handleTogglePreview}
                            disabled={!settings.enabled || !permission.granted}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>
        </div>
    );
}
