import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Lock, LogOut,
    Eye, Mail, Camera, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';

const SettingsPage = () => {
    const navigate = useNavigate();
    const { signOut, user } = useAuth();
    const { profile, loading, updateProfile } = useProfile();
    
    const [displayName, setDisplayName] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [onlineStatus, setOnlineStatus] = useState(false);
    const [readReceipts, setReadReceipts] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name);
            setUsername(profile.username);
            setBio(profile.bio || '');
            setOnlineStatus(profile.show_online_status ?? true);
            setReadReceipts(profile.read_receipts_enabled ?? true);
        }
    }, [profile]);

    const handleSave = async () => {
        try {
            setSaving(true);
            setSaveMessage('');
            await updateProfile({
                display_name: displayName,
                username: username,
                bio: bio || null,
                show_online_status: onlineStatus,
                read_receipts_enabled: readReceipts,
            });
            setSaveMessage('Profile updated successfully!');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            setSaveMessage('Failed to update profile');
            console.error('Error updating profile:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                Loading...
            </div>
        );
    }

    return (
        <div className="settings-layout">
            {/* Side Navigation */}
            <aside className="settings-sidebar">
                {/* Back button */}
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    <ChevronLeft size={16} />
                    <span>Back to Messages</span>
                </button>

                {/* User Mini Profile */}
                <div className="user-mini-profile">
                    <div className="mini-avatar">
                        <div className="avatar-placeholder">
                            {profile?.display_name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </div>
                        <span className="online-indicator" />
                    </div>
                    <div className="mini-info">
                        <h2>{profile?.display_name || 'User'}</h2>
                        <p>@{profile?.username || ''}</p>
                    </div>
                </div>

                {/* Navigation Links - Profile only */}
                <nav className="settings-nav">
                    <button className="nav-item active">
                        <User size={16} />
                        <span>Profile</span>
                    </button>
                </nav>

                {/* Bottom Actions */}
                <div className="settings-sidebar-footer">
                    <button className="logout-btn" onClick={async () => {
                        await signOut();
                        navigate('/');
                    }}>
                        <LogOut size={16} />
                        <span>Log Out</span>
                    </button>
                    <p className="version">Version 0.1.0</p>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="settings-content">
                <header className="settings-header">
                    <h1>Profile Settings</h1>
                    <p>Manage your profile and preferences.</p>
                </header>

                <div className="settings-form">
                    {/* Avatar Section */}
                    <section className="avatar-section">
                        <div className="avatar-edit">
                            <div className="large-avatar">
                                <div className="avatar-placeholder large">
                                    {profile?.display_name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                </div>
                            </div>
                            <div className="avatar-overlay">
                                <Camera size={18} />
                            </div>
                        </div>
                        <div className="avatar-info">
                            <h3>Profile Photo</h3>
                            <p>JPG or PNG. Max 2MB.</p>
                            <div className="avatar-actions">
                                <button className="btn-secondary">Change</button>
                                <button className="btn-text-danger">Remove</button>
                            </div>
                        </div>
                    </section>

                    <hr className="divider" />

                    {/* Personal Info Form */}
                    <section className="form-section">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Display Name</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Username</label>
                                <div className="input-with-prefix">
                                    <span className="prefix">@</span>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                maxLength={160}
                            />
                            <span className="char-count">{bio.length}/160</span>
                        </div>

                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={profile?.email || user?.email || ''}
                                disabled
                                className="disabled"
                            />
                            <span className="helper-text">
                                <Lock size={10} />
                                Contact support to change
                            </span>
                        </div>

                        {saveMessage && (
                            <p style={{ 
                                color: saveMessage.includes('success') ? '#10b981' : '#ef4444', 
                                fontSize: '0.875rem',
                                marginTop: '0.5rem'
                            }}>
                                {saveMessage}
                            </p>
                        )}
                    </section>

                    <hr className="divider" />

                    {/* Preferences / Toggles */}
                    <section className="preferences-section">
                        <h3>Preferences</h3>

                        <div className="preference-item">
                            <div className="preference-info">
                                <div className="preference-icon">
                                    <Eye size={16} />
                                </div>
                                <div>
                                    <p className="preference-title">Online Status</p>
                                    <p className="preference-desc">Show when you're active</p>
                                </div>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={onlineStatus}
                                    onChange={(e) => setOnlineStatus(e.target.checked)}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>

                        <div className="preference-item">
                            <div className="preference-info">
                                <div className="preference-icon">
                                    <Mail size={16} />
                                </div>
                                <div>
                                    <p className="preference-title">Read Receipts</p>
                                    <p className="preference-desc">Show when you've read messages</p>
                                </div>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={readReceipts}
                                    onChange={(e) => setReadReceipts(e.target.checked)}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>
                    </section>

                    {/* Save Actions */}
                    <div className="form-actions">
                        <button className="btn-cancel" onClick={() => navigate('/dashboard')}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SettingsPage;
